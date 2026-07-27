export const APP_VERSION = "1.0.3";

export const fixtureLibrary = [
  { id: "washbasin", name: "Washbasin", coldDesignFlowLps: 0.10, hotDesignFlowLps: 0.10, coldLoadingUnits: 1.0, hotLoadingUnits: 1.0, drainageDischargeUnits: 0.5 },
  { id: "wc-cistern", name: "WC cistern", coldDesignFlowLps: 0.13, hotDesignFlowLps: 0.00, coldLoadingUnits: 2.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 2.0 },
  { id: "shower", name: "Shower", coldDesignFlowLps: 0.15, hotDesignFlowLps: 0.15, coldLoadingUnits: 2.0, hotLoadingUnits: 2.0, drainageDischargeUnits: 0.6 },
  { id: "bath", name: "Bath", coldDesignFlowLps: 0.20, hotDesignFlowLps: 0.20, coldLoadingUnits: 4.0, hotLoadingUnits: 4.0, drainageDischargeUnits: 0.8 },
  { id: "kitchen-sink", name: "Kitchen sink", coldDesignFlowLps: 0.20, hotDesignFlowLps: 0.20, coldLoadingUnits: 3.0, hotLoadingUnits: 3.0, drainageDischargeUnits: 0.8 },
  { id: "cleaners-sink", name: "Cleaner’s sink", coldDesignFlowLps: 0.20, hotDesignFlowLps: 0.20, coldLoadingUnits: 3.0, hotLoadingUnits: 3.0, drainageDischargeUnits: 1.5 },
  { id: "dishwasher", name: "Dishwasher", coldDesignFlowLps: 0.15, hotDesignFlowLps: 0.00, coldLoadingUnits: 3.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 0.8 },
  { id: "washing-machine", name: "Washing machine", coldDesignFlowLps: 0.15, hotDesignFlowLps: 0.00, coldLoadingUnits: 3.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 0.8 },
  { id: "urinal", name: "Urinal cistern / valve", coldDesignFlowLps: 0.10, hotDesignFlowLps: 0.00, coldLoadingUnits: 1.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 0.5 },
  { id: "drinking-water", name: "Drinking water outlet", coldDesignFlowLps: 0.10, hotDesignFlowLps: 0.00, coldLoadingUnits: 1.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 0.5 },
  { id: "bib-tap", name: "Bib tap", coldDesignFlowLps: 0.20, hotDesignFlowLps: 0.00, coldLoadingUnits: 3.0, hotLoadingUnits: 0.0, drainageDischargeUnits: 0.0 }
];

export function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function defaultAssumptions() {
  return {
    externalWallUValue: 0.26,
    roofUValue: 0.18,
    exposedFloorUValue: 0.22,
    glazingUValue: 1.60,
    airVolumetricHeatCapacityJPerLitreK: 1.206,
    latentAirFactorWPerLpsPerGkg: 2.94,
    defaultHeatRecoveryEfficiency: 0.70,
    defaultHeatingMargin: 0.10,
    defaultCoolingMargin: 0.10,
    gasGrossCalorificValueKWhPerM3: 10.76,
    drainageFrequencyFactorK: 0.50,
    coldWaterSqrtLUCoefficient: 0.10,
    hotWaterSqrtLUCoefficient: 0.10,
    coldWaterTemperatureC: 10,
    hotWaterTemperatureC: 60,
    electricalVoltageSinglePhase: 230,
    electricalVoltageThreePhase: 400,
    fixtureLibrary: structuredCloneSafe(fixtureLibrary)
  };
}

export function defaultRoom(overrides = {}) {
  const room = {
    id: uid(), number: "", name: "New room", type: "General", notes: "",
    areaM2: 25, heightM: 2.7, occupants: 2,
    externalWallAreaM2: 12, roofAreaM2: 0, exposedFloorAreaM2: 0, glazingAreaM2: 4,
    ventilationMethod: "greatestOfMethods",
    outdoorAirLpsPerPerson: 10, outdoorAirLpsPerM2: 0, airChangesPerHour: 1,
    fixedSupplyAirLps: 0, fixedExtractAirLps: 0, heatRecoveryEfficiency: 0.70,
    heatingMethod: "elemental", heatingIndoorC: 21, heatingOutdoorC: -3,
    infiltrationAirChangesPerHour: 0.25, heatingRuleWPerM2: 60, heatingMargin: 0.10,
    coolingMethod: "elemental", coolingIndoorC: 24, coolingOutdoorC: 30,
    outdoorHumidityRatioGPerKg: 11, indoorHumidityRatioGPerKg: 9,
    peopleSensibleWEach: 75, peopleLatentWEach: 55,
    lightingWPerM2: 8, equipmentWPerM2: 12, solarGainWPerM2Glazing: 120,
    coolingRuleWPerM2: 100, coolingMargin: 0.10,
    electricalLightingWPerM2: 8, electricalSmallPowerWPerM2: 15,
    electricalFixedLoadKW: 0, electricalDiversity: 0.80, electricalPowerFactor: 0.95,
    electricalSupply: "singlePhase230",
    gasConnectedLoadKW: 0, gasDiversity: 1.0,
    fixtures: fixtureLibrary.map(f => ({ id: uid(), fixtureID: f.id, count: 0 }))
  };
  return { ...room, ...overrides, fixtures: overrides.fixtures ?? room.fixtures };
}

export const roomPresets = {
  "General": () => defaultRoom({ type: "General" }),
  "Open-plan office": () => defaultRoom({ name: "Open-plan office", type: "Office", areaM2: 100, occupants: 10, outdoorAirLpsPerPerson: 10, airChangesPerHour: 1, lightingWPerM2: 7, equipmentWPerM2: 15, electricalLightingWPerM2: 7, electricalSmallPowerWPerM2: 18 }),
  "Meeting room": () => defaultRoom({ name: "Meeting room", type: "Meeting", areaM2: 25, occupants: 10, outdoorAirLpsPerPerson: 10, airChangesPerHour: 1, lightingWPerM2: 8, equipmentWPerM2: 5, electricalLightingWPerM2: 8, electricalSmallPowerWPerM2: 8 }),
  "Classroom": () => defaultRoom({ name: "Classroom", type: "Education", areaM2: 60, occupants: 31, outdoorAirLpsPerPerson: 8, airChangesPerHour: 1.5, lightingWPerM2: 7, equipmentWPerM2: 8, electricalLightingWPerM2: 7, electricalSmallPowerWPerM2: 10 }),
  "Accessible WC": () => {
    const room = defaultRoom({ name: "Accessible WC", type: "Sanitary", areaM2: 5, occupants: 1, externalWallAreaM2: 0, glazingAreaM2: 0, ventilationMethod: "fixedFlow", fixedSupplyAirLps: 0, fixedExtractAirLps: 15, heatingRuleWPerM2: 70, coolingMethod: "areaRule", coolingRuleWPerM2: 0, electricalLightingWPerM2: 8, electricalSmallPowerWPerM2: 0 });
    room.fixtures.forEach(f => { if (["washbasin", "wc-cistern"].includes(f.fixtureID)) f.count = 1; });
    return room;
  },
  "Tea point": () => {
    const room = defaultRoom({ name: "Tea point", type: "Catering", areaM2: 12, occupants: 2, ventilationMethod: "greatestOfMethods", airChangesPerHour: 4, fixedExtractAirLps: 30, equipmentWPerM2: 40, electricalSmallPowerWPerM2: 45 });
    room.fixtures.forEach(f => { if (["kitchen-sink", "dishwasher"].includes(f.fixtureID)) f.count = 1; });
    return room;
  },
  "Corridor": () => defaultRoom({ name: "Corridor", type: "Circulation", areaM2: 40, occupants: 0, outdoorAirLpsPerPerson: 0, outdoorAirLpsPerM2: 0, airChangesPerHour: 0.5, lightingWPerM2: 5, equipmentWPerM2: 0, electricalLightingWPerM2: 5, electricalSmallPowerWPerM2: 0 }),
  "Plant room": () => defaultRoom({ name: "Plant room", type: "Plant", areaM2: 40, occupants: 0, ventilationMethod: "fixedFlow", fixedSupplyAirLps: 100, fixedExtractAirLps: 100, heatingMethod: "areaRule", heatingRuleWPerM2: 30, coolingMethod: "areaRule", coolingRuleWPerM2: 50, electricalLightingWPerM2: 6, electricalSmallPowerWPerM2: 5, electricalFixedLoadKW: 5, electricalSupply: "threePhase400" }),
  "Store": () => defaultRoom({ name: "Store", type: "Storage", areaM2: 20, occupants: 0, outdoorAirLpsPerPerson: 0, airChangesPerHour: 0.5, lightingWPerM2: 5, equipmentWPerM2: 0, electricalLightingWPerM2: 5, electricalSmallPowerWPerM2: 0 })
};

export function defaultProject(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: uid(), name: "New MEP concept", client: "", site: "", projectNumber: "",
    revision: "P01", author: "", notes: "", createdAt: now, modifiedAt: now,
    assumptions: defaultAssumptions(),
    floors: [{ id: uid(), name: "Ground Floor", level: 0, rooms: [defaultRoom()] }],
    ...overrides
  };
}

export function sampleProject() {
  const office = roomPresets["Open-plan office"]();
  office.number = "G.01";
  office.areaM2 = 120;
  office.occupants = 12;
  office.externalWallAreaM2 = 55;
  office.glazingAreaM2 = 18;
  const wc = roomPresets["Accessible WC"]();
  wc.number = "G.02";
  return defaultProject({
    name: "Example office concept", client: "Example Client", site: "Birmingham, UK",
    projectNumber: "EX-001", author: "Concept Designer",
    notes: "Illustrative concept data only. Replace assumptions with project-specific values.",
    floors: [{ id: uid(), name: "Ground Floor", level: 0, rooms: [office, wc] }]
  });
}

export function n(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(n(value), min), max);
}

export function roomVolume(room) {
  return Math.max(0, n(room.areaM2)) * Math.max(0, n(room.heightM));
}

export function ventilationSupplyLps(room) {
  const personAndArea = Math.max(0, n(room.occupants)) * Math.max(0, n(room.outdoorAirLpsPerPerson))
    + Math.max(0, n(room.areaM2)) * Math.max(0, n(room.outdoorAirLpsPerM2));
  const ach = roomVolume(room) * Math.max(0, n(room.airChangesPerHour)) * 1000 / 3600;
  const fixed = Math.max(0, n(room.fixedSupplyAirLps));
  switch (room.ventilationMethod) {
    case "personAndArea": return personAndArea;
    case "airChanges": return ach;
    case "fixedFlow": return fixed;
    default: return Math.max(personAndArea, ach, fixed);
  }
}

export function calculateRoom(room, assumptions) {
  const a = { ...defaultAssumptions(), ...assumptions, fixtureLibrary: assumptions?.fixtureLibrary ?? fixtureLibrary };
  const supply = ventilationSupplyLps(room);
  const extract = Math.max(0, n(room.fixedExtractAirLps));
  const volume = roomVolume(room);
  const heatingDeltaT = Math.max(0, n(room.heatingIndoorC) - n(room.heatingOutdoorC));
  const summerDeltaT = Math.max(0, n(room.coolingOutdoorC) - n(room.coolingIndoorC));
  const opaqueWallArea = Math.max(0, n(room.externalWallAreaM2) - n(room.glazingAreaM2));
  const ua = opaqueWallArea * Math.max(0, n(a.externalWallUValue))
    + Math.max(0, n(room.roofAreaM2)) * Math.max(0, n(a.roofUValue))
    + Math.max(0, n(room.exposedFloorAreaM2)) * Math.max(0, n(a.exposedFloorUValue))
    + Math.max(0, n(room.glazingAreaM2)) * Math.max(0, n(a.glazingUValue));

  const fabricHeatingW = ua * heatingDeltaT;
  const infiltrationLps = volume * Math.max(0, n(room.infiltrationAirChangesPerHour)) * 1000 / 3600;
  const heatRecovery = clamp(room.heatRecoveryEfficiency, 0, 0.95);
  const recoveredSupplyLps = supply * (1 - heatRecovery);
  const extractMakeupLps = Math.max(0, extract - supply);
  const ventilationHeatingW = Math.max(0, n(a.airVolumetricHeatCapacityJPerLitreK))
    * (recoveredSupplyLps + extractMakeupLps + infiltrationLps) * heatingDeltaT;
  const elementalHeatingKW = (fabricHeatingW + ventilationHeatingW) / 1000 * (1 + Math.max(0, n(room.heatingMargin)));
  const ruleHeatingKW = Math.max(0, n(room.areaM2)) * Math.max(0, n(room.heatingRuleWPerM2)) / 1000 * (1 + Math.max(0, n(room.heatingMargin)));
  const heatingKW = room.heatingMethod === "areaRule" ? ruleHeatingKW : elementalHeatingKW;

  const fabricCoolingW = ua * summerDeltaT;
  const internalSensibleW = Math.max(0, n(room.occupants)) * Math.max(0, n(room.peopleSensibleWEach))
    + Math.max(0, n(room.areaM2)) * (Math.max(0, n(room.lightingWPerM2)) + Math.max(0, n(room.equipmentWPerM2)))
    + Math.max(0, n(room.glazingAreaM2)) * Math.max(0, n(room.solarGainWPerM2Glazing));
  const coolingOutdoorAirLps = Math.max(supply, extract);
  const outdoorAirSensibleW = Math.max(0, n(a.airVolumetricHeatCapacityJPerLitreK)) * coolingOutdoorAirLps * summerDeltaT;
  const humidityDifference = Math.max(0, n(room.outdoorHumidityRatioGPerKg) - n(room.indoorHumidityRatioGPerKg));
  const outdoorAirLatentW = Math.max(0, n(a.latentAirFactorWPerLpsPerGkg)) * coolingOutdoorAirLps * humidityDifference;
  const peopleLatentW = Math.max(0, n(room.occupants)) * Math.max(0, n(room.peopleLatentWEach));
  const elementalSensibleKW = (fabricCoolingW + internalSensibleW + outdoorAirSensibleW) / 1000;
  const elementalLatentKW = (outdoorAirLatentW + peopleLatentW) / 1000;
  const elementalCoolingKW = (elementalSensibleKW + elementalLatentKW) * (1 + Math.max(0, n(room.coolingMargin)));
  const ruleCoolingKW = Math.max(0, n(room.areaM2)) * Math.max(0, n(room.coolingRuleWPerM2)) / 1000 * (1 + Math.max(0, n(room.coolingMargin)));
  const coolingKW = room.coolingMethod === "areaRule" ? ruleCoolingKW : elementalCoolingKW;
  const coolingSensibleKW = room.coolingMethod === "areaRule" ? ruleCoolingKW : elementalSensibleKW * (1 + Math.max(0, n(room.coolingMargin)));
  const coolingLatentKW = room.coolingMethod === "areaRule" ? 0 : elementalLatentKW * (1 + Math.max(0, n(room.coolingMargin)));

  const connectedElectricalKW = Math.max(0, n(room.areaM2))
    * (Math.max(0, n(room.electricalLightingWPerM2)) + Math.max(0, n(room.electricalSmallPowerWPerM2))) / 1000
    + Math.max(0, n(room.electricalFixedLoadKW));
  const electricalKW = connectedElectricalKW * clamp(room.electricalDiversity, 0, 1.5);
  const powerFactor = clamp(room.electricalPowerFactor, 0.1, 1.0);
  const electricalKVA = electricalKW / powerFactor;
  const currentA = room.electricalSupply === "threePhase400"
    ? electricalKVA * 1000 / (Math.sqrt(3) * Math.max(1, n(a.electricalVoltageThreePhase)))
    : electricalKVA * 1000 / Math.max(1, n(a.electricalVoltageSinglePhase));

  const gasKW = Math.max(0, n(room.gasConnectedLoadKW)) * clamp(room.gasDiversity, 0, 1.5);
  const gasFlowM3h = gasKW / Math.max(0.1, n(a.gasGrossCalorificValueKWhPerM3));

  let coldConnected = 0, hotConnected = 0, coldLU = 0, hotLU = 0, drainageDU = 0;
  const fixtureMap = new Map((a.fixtureLibrary ?? fixtureLibrary).map(f => [f.id, f]));
  for (const fc of room.fixtures ?? []) {
    const count = Math.max(0, Math.floor(n(fc.count)));
    const def = fixtureMap.get(fc.fixtureID);
    if (!def || count === 0) continue;
    coldConnected += count * Math.max(0, n(def.coldDesignFlowLps));
    hotConnected += count * Math.max(0, n(def.hotDesignFlowLps));
    coldLU += count * Math.max(0, n(def.coldLoadingUnits));
    hotLU += count * Math.max(0, n(def.hotLoadingUnits));
    drainageDU += count * Math.max(0, n(def.drainageDischargeUnits));
  }
  const coldProbable = Math.max(0, n(a.coldWaterSqrtLUCoefficient)) * Math.sqrt(coldLU);
  const hotProbable = Math.max(0, n(a.hotWaterSqrtLUCoefficient)) * Math.sqrt(hotLU);
  const dhwKW = hotProbable * 4.186 * Math.max(0, n(a.hotWaterTemperatureC) - n(a.coldWaterTemperatureC));
  const drainageLps = Math.max(0, n(a.drainageFrequencyFactorK)) * Math.sqrt(drainageDU);

  return {
    id: room.id, roomNumber: room.number, roomName: room.name,
    areaM2: Math.max(0, n(room.areaM2)), volumeM3: volume,
    ventilationSupplyLps: supply, ventilationExtractLps: extract,
    fabricHeatLossKW: fabricHeatingW / 1000, ventilationHeatLossKW: ventilationHeatingW / 1000,
    heatingLoadKW: heatingKW, coolingSensibleKW, coolingLatentKW, coolingLoadKW: coolingKW,
    electricalConnectedKW: connectedElectricalKW, electricalDiversifiedKW: electricalKW,
    electricalKVA, electricalCurrentA: currentA,
    gasDiversifiedKW: gasKW, gasFlowM3h,
    coldWaterConnectedLps: coldConnected, hotWaterConnectedLps: hotConnected,
    coldWaterLoadingUnits: coldLU, hotWaterLoadingUnits: hotLU,
    coldWaterProbableLps: coldProbable, hotWaterProbableLps: hotProbable,
    dhwGenerationKW: dhwKW, drainageDischargeUnits: drainageDU, drainageFlowLps: drainageLps
  };
}

export function aggregateRooms(rooms, assumptions) {
  const total = {
    roomCount: 0, totalAreaM2: 0, totalOccupants: 0,
    supplyAirLps: 0, extractAirLps: 0, heatingKW: 0, coolingKW: 0,
    coolingSensibleKW: 0, coolingLatentKW: 0,
    electricalKW: 0, electricalKVA: 0, gasKW: 0, gasM3h: 0,
    coldWaterLoadingUnits: 0, hotWaterLoadingUnits: 0, coldWaterLps: 0, hotWaterLps: 0,
    dhwGenerationKW: 0, drainageLps: 0, drainageDU: 0
  };
  for (const room of rooms ?? []) {
    const r = calculateRoom(room, assumptions);
    total.roomCount += 1;
    total.totalAreaM2 += Math.max(0, n(room.areaM2));
    total.totalOccupants += Math.max(0, n(room.occupants));
    total.supplyAirLps += r.ventilationSupplyLps;
    total.extractAirLps += r.ventilationExtractLps;
    total.heatingKW += r.heatingLoadKW;
    total.coolingKW += r.coolingLoadKW;
    total.coolingSensibleKW += r.coolingSensibleKW;
    total.coolingLatentKW += r.coolingLatentKW;
    total.electricalKW += r.electricalDiversifiedKW;
    total.electricalKVA += r.electricalKVA;
    total.gasKW += r.gasDiversifiedKW;
    total.gasM3h += r.gasFlowM3h;
    total.coldWaterLoadingUnits += r.coldWaterLoadingUnits;
    total.hotWaterLoadingUnits += r.hotWaterLoadingUnits;
    total.drainageDU += r.drainageDischargeUnits;
  }
  const a = { ...defaultAssumptions(), ...assumptions };
  total.coldWaterLps = Math.max(0, n(a.coldWaterSqrtLUCoefficient)) * Math.sqrt(total.coldWaterLoadingUnits);
  total.hotWaterLps = Math.max(0, n(a.hotWaterSqrtLUCoefficient)) * Math.sqrt(total.hotWaterLoadingUnits);
  total.dhwGenerationKW = total.hotWaterLps * 4.186 * Math.max(0, n(a.hotWaterTemperatureC) - n(a.coldWaterTemperatureC));
  total.drainageLps = Math.max(0, n(a.drainageFrequencyFactorK)) * Math.sqrt(total.drainageDU);
  return total;
}

export function aggregateProject(project) {
  return aggregateRooms((project?.floors ?? []).flatMap(f => f.rooms ?? []), project?.assumptions ?? defaultAssumptions());
}

export function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function ensureProjectShape(project) {
  const p = { ...defaultProject(), ...project };
  p.assumptions = { ...defaultAssumptions(), ...(project?.assumptions ?? {}) };
  p.assumptions.fixtureLibrary = (project?.assumptions?.fixtureLibrary?.length ? project.assumptions.fixtureLibrary : fixtureLibrary).map(f => ({ ...f }));
  p.floors = (project?.floors?.length ? project.floors : [{ id: uid(), name: "Ground Floor", level: 0, rooms: [defaultRoom()] }]).map(f => ({
    id: f.id ?? uid(), name: f.name ?? "Floor", level: n(f.level),
    rooms: (f.rooms ?? []).map(r => {
      const base = defaultRoom();
      const merged = { ...base, ...r, id: r.id ?? uid() };
      const counts = new Map((r.fixtures ?? []).map(fc => [fc.fixtureID, Math.max(0, Math.floor(n(fc.count)))]));
      merged.fixtures = p.assumptions.fixtureLibrary.map(fd => ({ id: uid(), fixtureID: fd.id, count: counts.get(fd.id) ?? 0 }));
      return merged;
    })
  }));
  return p;
}
