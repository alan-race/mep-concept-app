import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAssumptions, defaultRoom, calculateRoom, aggregateRooms, ventilationSupplyLps } from '../calc.js';

test('greatest ventilation method selects the largest flow', () => {
  const room = defaultRoom({ areaM2: 100, heightM: 3, occupants: 5, outdoorAirLpsPerPerson: 10, airChangesPerHour: 1, fixedSupplyAirLps: 90, ventilationMethod: 'greatestOfMethods' });
  assert.equal(ventilationSupplyLps(room), 90);
});

test('gas flow converts diversified kW using calorific value', () => {
  const room = defaultRoom({ gasConnectedLoadKW: 107.6, gasDiversity: 0.5 });
  const result = calculateRoom(room, defaultAssumptions());
  assert.ok(Math.abs(result.gasFlowM3h - 5) < 1e-9);
});

test('aggregate water and drainage diversity is applied after summing units', () => {
  const room1 = defaultRoom();
  const room2 = defaultRoom();
  room1.fixtures.find(f => f.fixtureID === 'wc-cistern').count = 1;
  room2.fixtures.find(f => f.fixtureID === 'wc-cistern').count = 1;
  const total = aggregateRooms([room1, room2], defaultAssumptions());
  assert.ok(Math.abs(total.coldWaterLps - 0.2) < 1e-9); // 0.1 * sqrt(4 LU)
  assert.ok(Math.abs(total.drainageLps - 1.0) < 1e-9); // 0.5 * sqrt(4 DU)
});

test('extract-only room adds makeup-air heating load', () => {
  const room = defaultRoom({ ventilationMethod: 'fixedFlow', fixedSupplyAirLps: 0, fixedExtractAirLps: 20, externalWallAreaM2: 0, glazingAreaM2: 0, infiltrationAirChangesPerHour: 0, heatingIndoorC: 20, heatingOutdoorC: 0, heatingMargin: 0 });
  const result = calculateRoom(room, defaultAssumptions());
  assert.ok(Math.abs(result.ventilationHeatLossKW - 0.4824) < 1e-6);
});
