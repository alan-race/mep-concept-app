# MEP Concept — Android-installable PWA

This is the Android-compatible port of the original SwiftUI concept application. It is a Progressive Web App (PWA): after it is placed on an HTTPS website, Android Chrome can install it with its own icon and standalone app window.

## Main functions

- Multiple projects, floors and room data sheets
- Ventilation by people + area, ACH, fixed flow or greatest method
- Elemental or W/m² heating and cooling concepts
- Electrical connected/diversified load, kVA and indicative current
- Gas diversified load and indicative m³/h
- Domestic-water fixtures, loading units, probable flow and DHW duty
- Drainage discharge units and indicative wastewater flow
- Floor/project results, CSV export and JSON backup/import
- Local offline storage after installation
- Editable assumptions and fixture library
- Responsive layout for Android tablet, phone and Windows browser

## Calculation validation

Run on a computer with Node.js:

```bash
npm test
```

The included tests check ventilation selection, gas conversion, system-level water/drainage aggregation and extract makeup-air heating.

## Important limitation

This is a concept/feasibility tool. It does not reproduce complete proprietary standards tables and is not a compliance certificate or construction design. Inputs and outputs require verification by a competent building-services engineer using the current documents applicable to the project.

See `INSTALL-ON-ANDROID.md` for deployment and installation instructions.
