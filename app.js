import {
  APP_VERSION, defaultProject, sampleProject, defaultRoom, roomPresets,
  calculateRoom, aggregateRooms, aggregateProject, ensureProjectShape,
  uid, n, structuredCloneSafe
} from './calc.js';

const STORAGE_KEY = 'mepConceptPwa.projects.v1';
const SETTINGS_KEY = 'mepConceptPwa.settings.v1';

const state = {
  projects: [],
  currentProjectId: null,
  view: 'projects',
  draftRoom: null,
  draftFloorId: null,
  editingRoomId: null,
  deferredPrompt: null
};

const $app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function fmt(value, digits = 1) {
  const v = Number(value);
  return Number.isFinite(v) ? v.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '0.0';
}

function compact(value, digits = 1) {
  const v = Number(value);
  return Number.isFinite(v) ? v.toLocaleString('en-GB', { maximumFractionDigits: digits }) : '0';
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    state.projects = Array.isArray(saved) ? saved.map(ensureProjectShape) : [];
  } catch {
    state.projects = [];
  }
  if (!state.projects.length) state.projects = [sampleProject()];
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    state.currentProjectId = settings.currentProjectId;
    state.view = settings.view || 'projects';
  } catch { /* use defaults */ }
  if (!state.projects.some(p => p.id === state.currentProjectId)) state.currentProjectId = state.projects[0]?.id ?? null;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ currentProjectId: state.currentProjectId, view: state.view }));
  } catch (error) {
    toast(`Could not save locally: ${error.message}`);
  }
}

function currentProject() {
  return state.projects.find(p => p.id === state.currentProjectId) ?? state.projects[0] ?? null;
}

function touchProject(project = currentProject()) {
  if (project) project.modifiedAt = new Date().toISOString();
  saveState();
}

function route(view) {
  state.view = view;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navButton(view, label) {
  const disabled = view !== 'projects' && !currentProject();
  return `<button class="nav-btn ${state.view === view ? 'active' : ''}" data-action="route" data-view="${view}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function render() {
  const p = currentProject();
  $app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">MEP</div>
          <div><h1>MEP Concept Design Tool</h1><small>${p ? esc(p.name) : 'Room-data-sheet concept design'}</small></div>
        </div>
        <div class="top-actions">
          <button class="btn ghost hidden" id="installButton" data-action="install"><span>Install app</span> ⬇</button>
          <button class="btn ghost icon" data-action="export-json" title="Back up project">⇩</button>
        </div>
      </header>
      <nav class="navbar" aria-label="Main navigation">
        ${navButton('projects', 'Projects')}
        ${navButton('project', 'Room data')}
        ${navButton('results', 'Results')}
        ${navButton('assumptions', 'Assumptions')}
        ${navButton('standards', 'Basis & limits')}
      </nav>
      <main>${renderView()}</main>
      <div class="footer-note">MEP Concept Design Tool ${APP_VERSION} · Concept-stage calculations only · Verify every criterion before use in design</div>
      ${state.draftRoom ? renderRoomModal() : ''}
      <input id="importFile" type="file" accept="application/json,.json" class="hidden">
    </div>`;
  updateInstallButton();
}

function renderView() {
  if (state.view !== 'projects' && !currentProject()) return renderProjects();
  switch (state.view) {
    case 'project': return renderProject();
    case 'results': return renderResults();
    case 'assumptions': return renderAssumptions();
    case 'standards': return renderStandards();
    default: return renderProjects();
  }
}

function renderProjects() {
  const cards = state.projects.map(project => {
    const total = aggregateProject(project);
    const modified = new Date(project.modifiedAt).toLocaleDateString('en-GB');
    return `<article class="card project-card">
      <div><span class="pill">${esc(project.revision || 'P01')}</span></div>
      <h3>${esc(project.name)}</h3>
      <div class="meta">${esc(project.client || 'No client')}<br>${esc(project.site || 'No site')} · updated ${modified}</div>
      <div class="stats">
        <div class="stat"><strong>${total.roomCount}</strong><span>Rooms</span></div>
        <div class="stat"><strong>${compact(total.totalAreaM2)}</strong><span>m²</span></div>
        <div class="stat"><strong>${project.floors.length}</strong><span>Floors</span></div>
      </div>
      <div class="actions">
        <button class="btn" data-action="open-project" data-id="${project.id}">Open</button>
        <button class="btn secondary" data-action="duplicate-project" data-id="${project.id}">Duplicate</button>
        <button class="btn danger" data-action="delete-project" data-id="${project.id}">Delete</button>
      </div>
    </article>`;
  }).join('');

  return `<section>
    <div class="page-head">
      <div><h2>Projects</h2><p>Create concepts by floor and room data sheet. Data is stored locally on this device.</p></div>
      <div class="actions">
        <button class="btn accent" data-action="new-project">+ New project</button>
        <button class="btn secondary" data-action="load-sample">Add example</button>
        <button class="btn secondary" data-action="import-json">Import backup</button>
      </div>
    </div>
    <div class="notice info"><strong>Back up important work.</strong> Browser storage can be cleared by device settings. Use the project backup button regularly.</div>
    <div class="grid projects">${cards}</div>
  </section>`;
}

function renderProject() {
  const p = currentProject();
  return `<section>
    <div class="page-head">
      <div><h2>${esc(p.name)}</h2><p>Project details, floors and room data sheets.</p></div>
      <div class="actions">
        <button class="btn secondary" data-action="export-json">Back up JSON</button>
        <button class="btn" data-action="route" data-view="results">View results</button>
      </div>
    </div>
    <article class="card form-card">
      <h3>Project information</h3>
      <div class="form-grid">
        ${textField('Project name', 'name', p.name, 'project', 'span-2')}
        ${textField('Project number', 'projectNumber', p.projectNumber, 'project')}
        ${textField('Revision', 'revision', p.revision, 'project')}
        ${textField('Client', 'client', p.client, 'project', 'span-2')}
        ${textField('Site', 'site', p.site, 'project', 'span-2')}
        ${textField('Author', 'author', p.author, 'project', 'span-2')}
        ${textareaField('Project notes', 'notes', p.notes, 'project', 'span-2')}
      </div>
    </article>
    <div class="page-head" style="margin-top:26px">
      <div><h2 style="font-size:1.35rem">Floors and rooms</h2><p>Add a room from a concept preset, then edit its project-specific criteria.</p></div>
      <button class="btn accent" data-action="add-floor">+ Add floor</button>
    </div>
    ${p.floors.map(renderFloor).join('')}
  </section>`;
}

function renderFloor(floor) {
  const p = currentProject();
  const totals = aggregateRooms(floor.rooms, p.assumptions);
  const rows = floor.rooms.map(room => {
    const r = calculateRoom(room, p.assumptions);
    return `<tr>
      <td>${esc(room.number || '—')}</td><td><strong>${esc(room.name)}</strong><br><span class="help">${esc(room.type)}</span></td>
      <td class="num">${fmt(room.areaM2)}</td><td class="num">${fmt(r.ventilationSupplyLps)}</td><td class="num">${fmt(r.ventilationExtractLps)}</td>
      <td class="num">${fmt(r.heatingLoadKW)}</td><td class="num">${fmt(r.coolingLoadKW)}</td><td class="num">${fmt(r.electricalDiversifiedKW)}</td>
      <td><div class="table-actions">
        <button class="btn secondary small" data-action="edit-room" data-floor-id="${floor.id}" data-room-id="${room.id}">Edit</button>
        <button class="btn secondary small" data-action="duplicate-room" data-floor-id="${floor.id}" data-room-id="${room.id}">Copy</button>
        <button class="btn danger small" data-action="delete-room" data-floor-id="${floor.id}" data-room-id="${room.id}">Delete</button>
      </div></td>
    </tr>`;
  }).join('');
  const presets = Object.keys(roomPresets).map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
  return `<article class="card floor">
    <div class="floor-head">
      <div class="floor-title">
        <input aria-label="Floor name" style="width:min(260px,58vw);font-weight:800" data-floor-field="name" data-floor-id="${floor.id}" value="${esc(floor.name)}">
        <span>Level <input aria-label="Floor level" style="width:74px;min-height:34px" type="number" data-value-type="number" data-floor-field="level" data-floor-id="${floor.id}" value="${n(floor.level)}"></span>
      </div>
      <div class="actions">
        <select class="preset-select" style="width:auto;min-width:160px"><option value="General">Room preset…</option>${presets}</select>
        <button class="btn small" data-action="add-room" data-floor-id="${floor.id}">+ Add room</button>
        <button class="btn danger small" data-action="delete-floor" data-floor-id="${floor.id}">Delete floor</button>
      </div>
    </div>
    <div class="floor-body">
      <div class="grid metrics" style="margin-bottom:14px">
        ${smallMetric('Rooms', totals.roomCount, '')}
        ${smallMetric('Floor area', fmt(totals.totalAreaM2), 'm²')}
        ${smallMetric('Heating', fmt(totals.heatingKW), 'kW')}
        ${smallMetric('Cooling', fmt(totals.coolingKW), 'kW')}
      </div>
      <div class="room-table-wrap">
        ${rows ? `<table><thead><tr><th>Room</th><th>Name / type</th><th class="num">Area m²</th><th class="num">Supply L/s</th><th class="num">Extract L/s</th><th class="num">Heat kW</th><th class="num">Cool kW</th><th class="num">Elec kW</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">No rooms on this floor.</div>'}
      </div>
    </div>
  </article>`;
}

function renderResults() {
  const p = currentProject();
  const total = aggregateProject(p);
  const floorRows = p.floors.map(floor => {
    const t = aggregateRooms(floor.rooms, p.assumptions);
    return `<tr><td><strong>${esc(floor.name)}</strong></td><td class="num">${t.roomCount}</td><td class="num">${fmt(t.totalAreaM2)}</td><td class="num">${fmt(t.supplyAirLps)}</td><td class="num">${fmt(t.extractAirLps)}</td><td class="num">${fmt(t.heatingKW)}</td><td class="num">${fmt(t.coolingKW)}</td><td class="num">${fmt(t.electricalKW)}</td><td class="num">${fmt(t.gasKW)}</td></tr>`;
  }).join('');
  const roomRows = p.floors.flatMap(floor => floor.rooms.map(room => {
    const r = calculateRoom(room, p.assumptions);
    return `<tr><td>${esc(floor.name)}</td><td>${esc(room.number || '—')}</td><td><strong>${esc(room.name)}</strong></td><td class="num">${fmt(room.areaM2)}</td><td class="num">${fmt(r.ventilationSupplyLps)}</td><td class="num">${fmt(r.ventilationExtractLps)}</td><td class="num">${fmt(r.heatingLoadKW)}</td><td class="num">${fmt(r.coolingLoadKW)}</td><td class="num">${fmt(r.electricalDiversifiedKW)}</td><td class="num">${fmt(r.gasDiversifiedKW)}</td><td class="num">${fmt(r.coldWaterProbableLps,2)}</td><td class="num">${fmt(r.drainageFlowLps,2)}</td></tr>`;
  })).join('');
  return `<section>
    <div class="page-head">
      <div><h2>Project results</h2><p>${esc(p.name)} · ${esc(p.revision)}</p></div>
      <div class="actions"><button class="btn secondary" data-action="print">Print / PDF</button><button class="btn" data-action="export-csv">Export CSV</button></div>
    </div>
    <div class="grid metrics">
      ${metric('Total floor area', total.totalAreaM2, 'm²', `${total.roomCount} rooms`)}
      ${metric('Supply air', total.supplyAirLps, 'L/s', `${fmt(total.supplyAirLps * 3.6)} m³/h`)}
      ${metric('Extract air', total.extractAirLps, 'L/s', `${fmt(total.extractAirLps * 3.6)} m³/h`)}
      ${metric('Heating load', total.heatingKW, 'kW', 'Sum of room concepts')}
      ${metric('Cooling load', total.coolingKW, 'kW', `${fmt(total.coolingSensibleKW)} sensible + ${fmt(total.coolingLatentKW)} latent`)}
      ${metric('Electrical demand', total.electricalKW, 'kW', `${fmt(total.electricalKVA)} kVA`)}
      ${metric('Gas load', total.gasKW, 'kW', `${fmt(total.gasM3h,2)} m³/h indicative`)}
      ${metric('Cold water', total.coldWaterLps, 'L/s', `${fmt(total.coldWaterLoadingUnits,1)} total LU`)}
      ${metric('Hot water', total.hotWaterLps, 'L/s', `${fmt(total.dhwGenerationKW)} kW instantaneous duty`)}
      ${metric('Drainage', total.drainageLps, 'L/s', `${fmt(total.drainageDU,1)} total DU`)}
    </div>
    <div class="notice"><strong>Concept output.</strong> These totals do not include plant coincidence, distribution losses, pressure drops, equipment selection, resilience, spatial coordination or detailed compliance checks.</div>
    <article class="card" style="margin-top:18px"><h3 class="section-title">Floor summary</h3><div class="room-table-wrap"><table><thead><tr><th>Floor</th><th class="num">Rooms</th><th class="num">Area m²</th><th class="num">Supply L/s</th><th class="num">Extract L/s</th><th class="num">Heat kW</th><th class="num">Cool kW</th><th class="num">Elec kW</th><th class="num">Gas kW</th></tr></thead><tbody>${floorRows}</tbody></table></div></article>
    <article class="card" style="margin-top:18px"><h3 class="section-title">Room schedule</h3><div class="room-table-wrap"><table><thead><tr><th>Floor</th><th>No.</th><th>Room</th><th class="num">Area m²</th><th class="num">Supply L/s</th><th class="num">Extract L/s</th><th class="num">Heat kW</th><th class="num">Cool kW</th><th class="num">Elec kW</th><th class="num">Gas kW</th><th class="num">CW L/s</th><th class="num">Drain L/s</th></tr></thead><tbody>${roomRows}</tbody></table></div></article>
  </section>`;
}

function renderAssumptions() {
  const p = currentProject();
  const a = p.assumptions;
  const fixtureRows = a.fixtureLibrary.map(f => `<tr>
    <td><input data-fixture-field="name" data-fixture-id="${f.id}" value="${esc(f.name)}"></td>
    ${fixtureInput(f, 'coldDesignFlowLps')}${fixtureInput(f, 'hotDesignFlowLps')}${fixtureInput(f, 'coldLoadingUnits')}${fixtureInput(f, 'hotLoadingUnits')}${fixtureInput(f, 'drainageDischargeUnits')}
  </tr>`).join('');
  return `<section>
    <div class="page-head"><div><h2>Project assumptions</h2><p>These values control every floor and room in this project.</p></div><button class="btn danger" data-action="reset-assumptions">Restore illustrative defaults</button></div>
    <div class="notice"><strong>Verify before use.</strong> Defaults are transparent concept assumptions, not a reproduction of proprietary standards tables or a compliance declaration.</div>
    <article class="card form-card"><h3>Envelope and psychrometrics</h3><div class="form-grid">
      ${assumptionNumber('External wall U-value', 'externalWallUValue', a.externalWallUValue, 'W/m²·K')}
      ${assumptionNumber('Roof U-value', 'roofUValue', a.roofUValue, 'W/m²·K')}
      ${assumptionNumber('Exposed floor U-value', 'exposedFloorUValue', a.exposedFloorUValue, 'W/m²·K')}
      ${assumptionNumber('Glazing U-value', 'glazingUValue', a.glazingUValue, 'W/m²·K')}
      ${assumptionNumber('Air heat capacity factor', 'airVolumetricHeatCapacityJPerLitreK', a.airVolumetricHeatCapacityJPerLitreK, 'W/(L/s·K)')}
      ${assumptionNumber('Latent air factor', 'latentAirFactorWPerLpsPerGkg', a.latentAirFactorWPerLpsPerGkg, 'W/(L/s·g/kg)')}
      ${assumptionNumber('Default heat recovery', 'defaultHeatRecoveryEfficiency', a.defaultHeatRecoveryEfficiency, 'fraction')}
      ${assumptionNumber('Gas gross calorific value', 'gasGrossCalorificValueKWhPerM3', a.gasGrossCalorificValueKWhPerM3, 'kWh/m³')}
    </div></article>
    <article class="card form-card" style="margin-top:16px"><h3>Water, drainage and electrical</h3><div class="form-grid">
      ${assumptionNumber('Cold-water √LU coefficient', 'coldWaterSqrtLUCoefficient', a.coldWaterSqrtLUCoefficient, '')}
      ${assumptionNumber('Hot-water √LU coefficient', 'hotWaterSqrtLUCoefficient', a.hotWaterSqrtLUCoefficient, '')}
      ${assumptionNumber('Drainage frequency factor K', 'drainageFrequencyFactorK', a.drainageFrequencyFactorK, '')}
      ${assumptionNumber('Cold-water temperature', 'coldWaterTemperatureC', a.coldWaterTemperatureC, '°C')}
      ${assumptionNumber('Hot-water temperature', 'hotWaterTemperatureC', a.hotWaterTemperatureC, '°C')}
      ${assumptionNumber('Single-phase voltage', 'electricalVoltageSinglePhase', a.electricalVoltageSinglePhase, 'V')}
      ${assumptionNumber('Three-phase voltage', 'electricalVoltageThreePhase', a.electricalVoltageThreePhase, 'V')}
    </div></article>
    <article class="card" style="margin-top:16px"><h3 class="section-title">Fixture library</h3><p class="help">Edit flows, loading units and discharge units to match the current licensed design basis and project type.</p><div class="room-table-wrap"><table class="assumptions-table"><thead><tr><th>Fixture</th><th>CW flow L/s</th><th>HW flow L/s</th><th>CW LU</th><th>HW LU</th><th>Drainage DU</th></tr></thead><tbody>${fixtureRows}</tbody></table></div></article>
  </section>`;
}

function renderStandards() {
  return `<section>
    <div class="page-head"><div><h2>Calculation basis and limitations</h2><p>Reference framework for competent-person concept design.</p></div></div>
    <div class="grid two">
      <article class="card"><h3>Ventilation</h3><p>Room flow can be calculated from people plus area, air changes, a fixed value, or the greatest selected method.</p><p><code>q = N × qₚ + A × qₐ</code><br><code>q = V × ACH × 1000 / 3600</code></p><p class="help">Enter project criteria from the applicable Approved Document F route, CIBSE guidance, client brief, specialist standard or process requirement.</p></article>
      <article class="card"><h3>Heating</h3><p>Elemental mode combines Σ(U×A) fabric loss with ventilation, extract makeup air and infiltration. Heat recovery applies only to mechanical supply air.</p><p class="help">Use BS EN 12831 methodology and CIBSE design conditions where formally applicable; the simplified room method is not a substitute for a complete design.</p></article>
      <article class="card"><h3>Cooling</h3><p>Elemental mode includes simplified fabric conduction, people, lights, equipment, glazing solar gain, and outdoor-air sensible and latent load.</p><p class="help">It does not perform hourly weather simulation, solar geometry, thermal mass, shading, pull-down or coincident plant diversity.</p></article>
      <article class="card"><h3>Electrical</h3><p>Calculates connected load, user-entered diversity, power factor, kVA and indicative single- or three-phase current.</p><p class="help">Detailed design still requires BS 7671 assessment, circuiting, protective devices, fault levels, voltage drop, harmonics, discrimination and containment.</p></article>
      <article class="card"><h3>Gas</h3><p>Calculates diversified appliance input and indicative standard-volume flow using an editable gross calorific value.</p><p class="help">It is not an IGEM pipe-sizing, pressure-drop, meter, booster, ventilation, flue, interlock or combustion-air calculation.</p></article>
      <article class="card"><h3>Domestic water and drainage</h3><p>Water uses an editable square-root loading-unit approximation. Drainage uses <code>Qww = K × √ΣDU</code>.</p><p class="help">For formal design apply the current BS EN 806/BS 8558 and BS EN 12056 methods, local water-undertaker requirements, Approved Documents G/H, manufacturer data, stack rules, gradients and minimum sizes.</p></article>
    </div>
    <article class="card" style="margin-top:16px"><h3>Reference framework to verify for each project</h3><p>CIBSE Guide A; relevant CIBSE Guide B volumes; CIBSE Domestic Heating Design Guide; BS EN 12831 series; Approved Documents F, G, H, J and L for the applicable nation and transitional provisions; BS EN 806 series; BS 8558; BS EN 12056 series; IGEM/UP/2; IGEM/UP/16; BS 7671 and current IET guidance.</p><div class="notice danger"><strong>Professional-use limitation:</strong> outputs require review by a competent building-services engineer. Do not use this application as a compliance certificate, tender design or construction design without independent verification.</div></article>
  </section>`;
}

function renderRoomModal() {
  const room = state.draftRoom;
  const p = currentProject();
  const result = calculateRoom(room, p.assumptions);
  const fixtures = p.assumptions.fixtureLibrary.map(def => {
    const count = room.fixtures.find(f => f.fixtureID === def.id)?.count ?? 0;
    return `<div class="fixture"><label>${esc(def.name)}<span class="help">${def.coldLoadingUnits} CW LU · ${def.drainageDischargeUnits} DU</span></label><input type="number" min="0" step="1" data-room-fixture-id="${def.id}" value="${count}"></div>`;
  }).join('');
  return `<div class="modal-backdrop" data-action="close-modal-backdrop">
    <section class="modal" role="dialog" aria-modal="true" aria-label="Room editor">
      <header class="modal-head"><h2>${state.editingRoomId ? 'Edit room data sheet' : 'Add room data sheet'}</h2><button type="button" class="btn ghost icon" data-action="close-modal" aria-label="Close room editor" title="Close">✕</button></header>
      <div class="modal-body"><div class="editor-layout">
        <div class="editor-sections">
          ${editorSection('Room details', true, `<div class="form-grid">${roomText('Room number','number',room.number)}${roomText('Room name','name',room.name,'span-2')}${roomText('Room type','type',room.type)}${roomNum('Area','areaM2',room.areaM2,'m²')}${roomNum('Height','heightM',room.heightM,'m')}${roomNum('Occupants','occupants',room.occupants,'people')}${roomNum('External wall area','externalWallAreaM2',room.externalWallAreaM2,'m²')}${roomNum('Glazing area','glazingAreaM2',room.glazingAreaM2,'m²')}${roomNum('Roof area','roofAreaM2',room.roofAreaM2,'m²')}${roomNum('Exposed floor area','exposedFloorAreaM2',room.exposedFloorAreaM2,'m²')}${roomTextarea('Notes','notes',room.notes)}</div>`) }
          ${editorSection('Ventilation', true, `<div class="form-grid">${roomSelect('Method','ventilationMethod',room.ventilationMethod,[['greatestOfMethods','Greatest of methods'],['personAndArea','People + area'],['airChanges','Air changes'],['fixedFlow','Fixed supply']])}${roomNum('Outdoor air per person','outdoorAirLpsPerPerson',room.outdoorAirLpsPerPerson,'L/s·person')}${roomNum('Outdoor air per area','outdoorAirLpsPerM2',room.outdoorAirLpsPerM2,'L/s·m²')}${roomNum('Air changes','airChangesPerHour',room.airChangesPerHour,'ACH')}${roomNum('Fixed supply','fixedSupplyAirLps',room.fixedSupplyAirLps,'L/s')}${roomNum('Fixed extract','fixedExtractAirLps',room.fixedExtractAirLps,'L/s')}${roomNum('Heat recovery efficiency','heatRecoveryEfficiency',room.heatRecoveryEfficiency,'fraction')}</div>`) }
          ${editorSection('Heating', false, `<div class="form-grid">${roomSelect('Method','heatingMethod',room.heatingMethod,[['elemental','Elemental'],['areaRule','W/m² allowance']])}${roomNum('Indoor temperature','heatingIndoorC',room.heatingIndoorC,'°C')}${roomNum('Outdoor temperature','heatingOutdoorC',room.heatingOutdoorC,'°C')}${roomNum('Infiltration','infiltrationAirChangesPerHour',room.infiltrationAirChangesPerHour,'ACH')}${roomNum('Area allowance','heatingRuleWPerM2',room.heatingRuleWPerM2,'W/m²')}${roomNum('Margin','heatingMargin',room.heatingMargin,'fraction')}</div>`) }
          ${editorSection('Cooling', false, `<div class="form-grid">${roomSelect('Method','coolingMethod',room.coolingMethod,[['elemental','Elemental'],['areaRule','W/m² allowance']])}${roomNum('Indoor temperature','coolingIndoorC',room.coolingIndoorC,'°C')}${roomNum('Outdoor temperature','coolingOutdoorC',room.coolingOutdoorC,'°C')}${roomNum('Outdoor humidity ratio','outdoorHumidityRatioGPerKg',room.outdoorHumidityRatioGPerKg,'g/kg')}${roomNum('Indoor humidity ratio','indoorHumidityRatioGPerKg',room.indoorHumidityRatioGPerKg,'g/kg')}${roomNum('People sensible','peopleSensibleWEach',room.peopleSensibleWEach,'W/person')}${roomNum('People latent','peopleLatentWEach',room.peopleLatentWEach,'W/person')}${roomNum('Lighting gain','lightingWPerM2',room.lightingWPerM2,'W/m²')}${roomNum('Equipment gain','equipmentWPerM2',room.equipmentWPerM2,'W/m²')}${roomNum('Solar gain allowance','solarGainWPerM2Glazing',room.solarGainWPerM2Glazing,'W/m² glazing')}${roomNum('Area allowance','coolingRuleWPerM2',room.coolingRuleWPerM2,'W/m²')}${roomNum('Margin','coolingMargin',room.coolingMargin,'fraction')}</div>`) }
          ${editorSection('Electrical', false, `<div class="form-grid">${roomNum('Lighting load','electricalLightingWPerM2',room.electricalLightingWPerM2,'W/m²')}${roomNum('Small power load','electricalSmallPowerWPerM2',room.electricalSmallPowerWPerM2,'W/m²')}${roomNum('Fixed load','electricalFixedLoadKW',room.electricalFixedLoadKW,'kW')}${roomNum('Diversity','electricalDiversity',room.electricalDiversity,'fraction')}${roomNum('Power factor','electricalPowerFactor',room.electricalPowerFactor,'PF')}${roomSelect('Supply','electricalSupply',room.electricalSupply,[['singlePhase230','230 V single-phase'],['threePhase400','400 V three-phase']])}</div>`) }
          ${editorSection('Gas', false, `<div class="form-grid">${roomNum('Connected gas load','gasConnectedLoadKW',room.gasConnectedLoadKW,'kW')}${roomNum('Gas diversity','gasDiversity',room.gasDiversity,'fraction')}</div>`) }
          ${editorSection('Water and drainage fixtures', false, `<div class="fixture-grid">${fixtures}</div><p class="help">Fixture design flows, loading units and discharge units are edited in Project Assumptions.</p>`) }
        </div>
        <aside class="card live-results" id="liveResults">${liveResultsMarkup(result)}</aside>
      </div></div>
      <footer class="modal-footer"><button type="button" class="btn secondary" data-action="close-modal">Cancel</button><button type="button" class="btn" data-action="save-room">Save room</button></footer>
    </section>
  </div>`;
}

function liveResultsMarkup(r) {
  return `<h3>Live concept result</h3>
    ${liveRow('Room volume', `${fmt(r.volumeM3)} m³`)}
    ${liveRow('Supply air', `${fmt(r.ventilationSupplyLps)} L/s`)}
    ${liveRow('Extract air', `${fmt(r.ventilationExtractLps)} L/s`)}
    ${liveRow('Heating', `${fmt(r.heatingLoadKW)} kW`)}
    ${liveRow('Cooling', `${fmt(r.coolingLoadKW)} kW`)}
    ${liveRow('Electrical demand', `${fmt(r.electricalDiversifiedKW)} kW`)}
    ${liveRow('Electrical current', `${fmt(r.electricalCurrentA)} A`)}
    ${liveRow('Gas', `${fmt(r.gasFlowM3h,2)} m³/h`)}
    ${liveRow('Cold water', `${fmt(r.coldWaterProbableLps,2)} L/s`)}
    ${liveRow('Hot water', `${fmt(r.hotWaterProbableLps,2)} L/s`)}
    ${liveRow('Drainage', `${fmt(r.drainageFlowLps,2)} L/s`)}
    <p class="help">Room-level water and drainage probable flows are indicative. Project totals apply diversity after summing units.</p>`;
}

function textField(label, field, value, scope, cls='') { return `<div class="field ${cls}"><label>${label}</label><input data-${scope}-field="${field}" value="${esc(value)}"></div>`; }
function textareaField(label, field, value, scope, cls='') { return `<div class="field ${cls}"><label>${label}</label><textarea data-${scope}-field="${field}">${esc(value)}</textarea></div>`; }
function assumptionNumber(label, field, value, suffix) { return `<div class="field"><label>${label}</label><div class="input-suffix"><input type="number" step="any" data-value-type="number" data-assumption-field="${field}" value="${n(value)}"><span>${esc(suffix)}</span></div></div>`; }
function fixtureInput(f, field) { return `<td><input type="number" step="any" data-value-type="number" data-fixture-field="${field}" data-fixture-id="${f.id}" value="${n(f[field])}"></td>`; }
function smallMetric(label, value, suffix) { return `<div class="stat"><strong>${value}${suffix ? ` ${suffix}` : ''}</strong><span>${label}</span></div>`; }
function metric(label, value, unit, sub) { return `<article class="card metric"><div class="label">${label}</div><div class="value">${fmt(value)} <small>${unit}</small></div><div class="sub">${sub}</div></article>`; }
function liveRow(label, value) { return `<div class="live-row"><span>${label}</span><strong>${value}</strong></div>`; }
function editorSection(title, open, content) { return `<details class="editor-section" ${open ? 'open' : ''}><summary>${title}</summary><div class="editor-section-content">${content}</div></details>`; }
function roomText(label, field, value, cls='') { return `<div class="field ${cls}"><label>${label}</label><input data-room-field="${field}" value="${esc(value)}"></div>`; }
function roomTextarea(label, field, value) { return `<div class="field span-4"><label>${label}</label><textarea data-room-field="${field}">${esc(value)}</textarea></div>`; }
function roomNum(label, field, value, suffix) { return `<div class="field"><label>${label}</label><div class="input-suffix"><input type="number" step="any" data-value-type="number" data-room-field="${field}" value="${n(value)}"><span>${esc(suffix)}</span></div></div>`; }
function roomSelect(label, field, value, options) { return `<div class="field"><label>${label}</label><select data-room-field="${field}">${options.map(([v,l]) => `<option value="${v}" ${v===value?'selected':''}>${l}</option>`).join('')}</select></div>`; }

function openRoom(floorId, roomId = null, presetName = 'General') {
  const floor = currentProject().floors.find(f => f.id === floorId);
  if (!floor) return;
  const room = roomId ? floor.rooms.find(r => r.id === roomId) : null;
  state.draftRoom = room ? structuredCloneSafe(room) : (roomPresets[presetName]?.() ?? defaultRoom());
  state.draftFloorId = floorId;
  state.editingRoomId = roomId;
  render();
}

function closeRoom() {
  state.draftRoom = null; state.draftFloorId = null; state.editingRoomId = null; render();
}

function updateLiveResults() {
  const el = document.querySelector('#liveResults');
  if (el && state.draftRoom) el.innerHTML = liveResultsMarkup(calculateRoom(state.draftRoom, currentProject().assumptions));
}

function coerceInput(input) {
  return input.dataset.valueType === 'number' || input.type === 'number' ? n(input.value) : input.value;
}

function download(filename, content, type='application/octet-stream') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value) { return String(value || 'MEP-Concept').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g,''); }

function exportJSON() {
  const p = currentProject();
  if (!p) return;
  download(`${safeFilename(p.name)}-${safeFilename(p.revision)}.json`, JSON.stringify(p, null, 2), 'application/json');
  toast('Project backup downloaded');
}

function csvCell(value) { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; }

function exportCSV() {
  const p = currentProject(); if (!p) return;
  const headers = ['Floor','Level','Room number','Room name','Type','Area m2','Occupants','Supply L/s','Extract L/s','Heating kW','Cooling sensible kW','Cooling latent kW','Cooling total kW','Electrical kW','Electrical kVA','Current A','Gas kW','Gas m3/h','Cold water LU','Hot water LU','Cold water L/s','Hot water L/s','DHW kW','Drainage DU','Drainage L/s','Notes'];
  const rows = [headers];
  for (const floor of p.floors) for (const room of floor.rooms) {
    const r = calculateRoom(room, p.assumptions);
    rows.push([floor.name,floor.level,room.number,room.name,room.type,room.areaM2,room.occupants,r.ventilationSupplyLps,r.ventilationExtractLps,r.heatingLoadKW,r.coolingSensibleKW,r.coolingLatentKW,r.coolingLoadKW,r.electricalDiversifiedKW,r.electricalKVA,r.electricalCurrentA,r.gasDiversifiedKW,r.gasFlowM3h,r.coldWaterLoadingUnits,r.hotWaterLoadingUnits,r.coldWaterProbableLps,r.hotWaterProbableLps,r.dhwGenerationKW,r.drainageDischargeUnits,r.drainageFlowLps,room.notes]);
  }
  const total = aggregateProject(p);
  rows.push([]); rows.push(['PROJECT TOTAL','','','','',total.totalAreaM2,total.totalOccupants,total.supplyAirLps,total.extractAirLps,total.heatingKW,total.coolingSensibleKW,total.coolingLatentKW,total.coolingKW,total.electricalKW,total.electricalKVA,'',total.gasKW,total.gasM3h,total.coldWaterLoadingUnits,total.hotWaterLoadingUnits,total.coldWaterLps,total.hotWaterLps,total.dhwGenerationKW,total.drainageDU,total.drainageLps,'']);
  download(`${safeFilename(p.name)}-${safeFilename(p.revision)}.csv`, '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  toast('CSV schedule downloaded');
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      const imports = (Array.isArray(raw) ? raw : [raw]).map(ensureProjectShape).map(p => ({ ...p, id: uid(), name: `${p.name} (imported)`, modifiedAt: new Date().toISOString() }));
      state.projects.push(...imports); state.currentProjectId = imports[0].id; state.view = 'project'; saveState(); render(); toast('Project imported');
    } catch (error) { alert(`The selected file is not a valid MEP Concept Design Tool backup.\n\n${error.message}`); }
  };
  reader.readAsText(file);
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function updateInstallButton() {
  const btn = document.querySelector('#installButton');
  if (!btn) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  btn.classList.toggle('hidden', !state.deferredPrompt || standalone);
}

$app.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  // The backdrop is an ancestor of every control in the room editor. Only close
  // when the backdrop itself—not one of its descendants—was tapped.
  if (action === 'close-modal-backdrop' && event.target !== target) return;

  if (action === 'route') return route(target.dataset.view);
  if (action === 'new-project') {
    const p = defaultProject(); state.projects.push(p); state.currentProjectId = p.id; state.view = 'project'; saveState(); return render();
  }
  if (action === 'load-sample') {
    const p = sampleProject(); p.name += ` ${state.projects.length + 1}`; state.projects.push(p); state.currentProjectId = p.id; state.view = 'project'; saveState(); return render();
  }
  if (action === 'open-project') { state.currentProjectId = target.dataset.id; state.view = 'project'; saveState(); return render(); }
  if (action === 'duplicate-project') {
    const source = state.projects.find(p => p.id === target.dataset.id); if (!source) return;
    const copy = ensureProjectShape(structuredCloneSafe(source)); copy.id = uid(); copy.name += ' copy'; copy.createdAt = copy.modifiedAt = new Date().toISOString();
    copy.floors.forEach(f => { f.id = uid(); f.rooms.forEach(r => r.id = uid()); });
    state.projects.push(copy); state.currentProjectId = copy.id; saveState(); return render();
  }
  if (action === 'delete-project') {
    const p = state.projects.find(p => p.id === target.dataset.id); if (!p || !confirm(`Delete “${p.name}”? This cannot be undone unless you have a backup.`)) return;
    state.projects = state.projects.filter(x => x.id !== p.id); state.currentProjectId = state.projects[0]?.id ?? null; saveState(); return render();
  }
  if (action === 'add-floor') {
    const p = currentProject(); const max = p.floors.reduce((m,f) => Math.max(m,n(f.level)), -1); p.floors.push({ id: uid(), name: `Floor ${max + 1}`, level: max + 1, rooms: [] }); touchProject(p); return render();
  }
  if (action === 'delete-floor') {
    const p = currentProject(); const floor = p.floors.find(f => f.id === target.dataset.floorId); if (!floor || !confirm(`Delete ${floor.name} and all its rooms?`)) return;
    p.floors = p.floors.filter(f => f.id !== floor.id); touchProject(p); return render();
  }
  if (action === 'add-room') {
    const preset = target.closest('.floor-head')?.querySelector('.preset-select')?.value || 'General'; return openRoom(target.dataset.floorId, null, preset);
  }
  if (action === 'edit-room') return openRoom(target.dataset.floorId, target.dataset.roomId);
  if (action === 'duplicate-room') {
    const p = currentProject(); const floor = p.floors.find(f => f.id === target.dataset.floorId); const source = floor?.rooms.find(r => r.id === target.dataset.roomId); if (!source) return;
    const copy = structuredCloneSafe(source); copy.id = uid(); copy.number = copy.number ? `${copy.number} copy` : ''; copy.name += ' copy'; floor.rooms.push(copy); touchProject(p); return render();
  }
  if (action === 'delete-room') {
    const p = currentProject(); const floor = p.floors.find(f => f.id === target.dataset.floorId); const room = floor?.rooms.find(r => r.id === target.dataset.roomId); if (!room || !confirm(`Delete “${room.name}”?`)) return;
    floor.rooms = floor.rooms.filter(r => r.id !== room.id); touchProject(p); return render();
  }
  if (action === 'close-modal' || action === 'close-modal-backdrop') return closeRoom();
  if (action === 'save-room') {
    const p = currentProject(); const floor = p.floors.find(f => f.id === state.draftFloorId); if (!floor) return;
    if (state.editingRoomId) { const index = floor.rooms.findIndex(r => r.id === state.editingRoomId); if (index >= 0) floor.rooms[index] = state.draftRoom; }
    else floor.rooms.push(state.draftRoom);
    state.draftRoom = null; state.draftFloorId = null; state.editingRoomId = null; touchProject(p); return render();
  }
  if (action === 'export-json') return exportJSON();
  if (action === 'export-csv') return exportCSV();
  if (action === 'import-json') return document.querySelector('#importFile')?.click();
  if (action === 'print') return window.print();
  if (action === 'reset-assumptions') {
    if (!confirm('Restore the original illustrative assumptions and fixture library? Room inputs will be retained.')) return;
    const fresh = defaultProject().assumptions; currentProject().assumptions = fresh; touchProject(); return render();
  }
  if (action === 'install' && state.deferredPrompt) {
    state.deferredPrompt.prompt(); await state.deferredPrompt.userChoice; state.deferredPrompt = null; updateInstallButton();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.draftRoom) closeRoom();
});

$app.addEventListener('input', event => {
  const input = event.target;
  const p = currentProject();
  if (input.dataset.projectField && p) { p[input.dataset.projectField] = coerceInput(input); touchProject(p); }
  if (input.dataset.floorField && p) {
    const floor = p.floors.find(f => f.id === input.dataset.floorId); if (floor) { floor[input.dataset.floorField] = coerceInput(input); touchProject(p); }
  }
  if (input.dataset.assumptionField && p) { p.assumptions[input.dataset.assumptionField] = coerceInput(input); touchProject(p); }
  if (input.dataset.fixtureField && p) {
    const fixture = p.assumptions.fixtureLibrary.find(f => f.id === input.dataset.fixtureId); if (fixture) { fixture[input.dataset.fixtureField] = coerceInput(input); touchProject(p); }
  }
  if (input.dataset.roomField && state.draftRoom) { state.draftRoom[input.dataset.roomField] = coerceInput(input); updateLiveResults(); }
  if (input.dataset.roomFixtureId && state.draftRoom) {
    const fixture = state.draftRoom.fixtures.find(f => f.fixtureID === input.dataset.roomFixtureId);
    if (fixture) fixture.count = Math.max(0, Math.floor(n(input.value)));
    updateLiveResults();
  }
});

$app.addEventListener('change', event => {
  const input = event.target;
  if (input.id === 'importFile' && input.files?.[0]) { importJSONFile(input.files[0]); input.value = ''; }
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); state.deferredPrompt = event; updateInstallButton();
});
window.addEventListener('appinstalled', () => { state.deferredPrompt = null; updateInstallButton(); toast('MEP Concept Design Tool installed'); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));

loadState();
render();
