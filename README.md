# Septic System

Monorepo for the Sterling septic system work.

## Apps

- `apps/visualiser` The React + Vite reference app for system flow, control logic, pinouts, and clarifying questions.
- `apps/firmware` PlatformIO ESP32 controller scaffold with a native-testable core and a thin hardware shell.

## Repo structure

```text
apps/
  firmware/
  visualiser/
docs/
Dockerfile
package.json
yarn.lock
```

## Engineering context

Before changing logic assumptions, read:

- `docs/system-context.md`
- the clarifying questions surfaced in `apps/visualiser/src/App.jsx`

## Local

```bash
corepack enable
yarn install
yarn dev
```

Root scripts currently target the visualiser workspace:

- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn preview`

## Firmware scaffold

The firmware app lives at `apps/firmware` and is intentionally structured around testability:

- pure C++ control core in `lib/SepticCore`
- ESP32/Arduino integration in `lib/SepticHal` and `src/main.cpp`
- native host tests in `apps/firmware/test`
- architecture and implementation notes in `apps/firmware/docs`

Typical commands:

```bash
cd apps/firmware
pio test -e native
pio run -e esp32dev
```

## Coolify / Docker

The root `Dockerfile` is the deployment target. It installs workspace dependencies from the monorepo root and builds only `apps/visualiser`, then serves that build with nginx.

```bash
docker build -t septic-system-visualiser .
docker run --rm -p 8080:80 septic-system-visualiser
```
