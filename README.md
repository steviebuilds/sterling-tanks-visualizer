# Septic System

Monorepo for the Sterling septic system work.

## Apps

- `apps/visualiser`
  The React + Vite reference app for system flow, control logic, pinouts, and clarifying questions.
- `apps/firmware`
  Reserved for the future PlatformIO ESP32 controller project. Scaffold only for now.

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

## Coolify / Docker

The root `Dockerfile` is the deployment target. It installs workspace dependencies from the monorepo root and builds only `apps/visualiser`, then serves that build with nginx.

```bash
docker build -t septic-system-visualiser .
docker run --rm -p 8080:80 septic-system-visualiser
```
