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
    IMPLEMENTATION_PLAN.md
  include/
    README.md
  lib/
    SepticCore/
      include/septic/core/
      src/
    SepticHal/
      include/septic/hal/
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
pio test -e native
pio run -e esp32dev
```

## Current status

- The control core is placeholder-only and intentionally conservative.
- The native tests prove the scaffold shape, not the final Sterling logic.
- Real sequencing, timers, truth tables, and telemetry payloads should be filled in only after the open system questions are answered.
