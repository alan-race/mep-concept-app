# MEP Concept Design Tool PWA — Validation record

Version: 1.0.4

## Room editor defect corrected

The room editor previously placed `onclick="event.stopPropagation()"` on the modal container while all application actions were handled by a delegated click listener on the parent application element. This prevented the Save room, Cancel and close (X) buttons from reaching their handlers.

Version 1.0.4:

- removes the click-propagation blocker from the room editor;
- closes the modal backdrop only when the backdrop itself is tapped;
- gives the Save, Cancel and close controls explicit `type="button"` behaviour;
- adds Escape-key close support;
- adds `touch-action: manipulation` for more reliable mobile taps;
- increments the application and service-worker cache version to 1.0.4.

## Checks completed

- JavaScript syntax check passed for `app.js`.
- JavaScript syntax check passed for `calc.js`.
- Four calculation-engine tests passed.
- Two room-editor regression checks passed.

A complete Android-device UI test still depends on the user's browser, launcher and deployed GitHub Pages environment. The corrected event flow has been verified directly in the source and protected by regression tests.
