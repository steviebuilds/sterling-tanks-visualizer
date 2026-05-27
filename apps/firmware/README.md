# Septic Firmware

PlatformIO ESP32 scaffold for the Sterling septic controller.

This is intentionally a clean starting point, not a finished implementation. The aim is to set up the code so the real logic can be added without turning the project into a pile of hardware-coupled guesses.

## Principles

- Keep the control core deterministic and hardware-agnostic.
- Keep `setup()` / `loop()` thin.
- Keep safety behaviour explicit.
- Keep telemetry non-blocking.
- Keep configuration and wiring assumptions out of the core domain logic.
- Make the important behaviour runnable in native tests before we ever touch hardware.

## Structure

```text
apps/firmware/
  docs/
    ARCHITECTURE.md
    CONTROLLER_RULES.md
    IMPLEMENTATION_PLAN.md
  include/
    README.md
  lib/
    Core/
      include/septic/core/
      src/
    ESP32Harness/
      include/septic/hal/
      src/
    SimulatorHarness/
      include/septic/simulator/
      src/
  src/
    main.cpp
  test/
    native/
  platformio.ini
```

## Commands

```bash
cd apps/firmware
pio run
pio run -t upload
```

The default PlatformIO environment is `esp32dev`, so a non-technical user can build or upload without selecting a profile.

For development checks:

```bash
cd apps/firmware
pio run -t compiledb
pio test -e native
pio run -e esp32dev
```

Run `pio run -t compiledb` after changing PlatformIO environments if VS Code shows stale C++ include errors.

## Current status

- The control core implements the current Sterling rules in hardware-agnostic C++.
- `lib/SimulatorHarness` runs the real controller with fake time and inputs for tests and WASM.
- Native tests cover the main control scenarios before hardware exists.
- ESP32 builds compile and run through the site profile / HAL IO adapter.
- Client-editable pins and telemetry placeholders live in `lib/ESP32Harness/include/septic/hal/SiteConstants.h`.
- Persistence, transport, and final HAND-mode behavior are still open.
