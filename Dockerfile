FROM emscripten/emsdk:latest AS core-wasm
WORKDIR /src
COPY apps/firmware/lib/Core apps/firmware/lib/Core
COPY apps/firmware/lib/SimulatorHarness apps/firmware/lib/SimulatorHarness
COPY apps/visualiser/wasm apps/visualiser/wasm
RUN mkdir -p apps/visualiser/public/core && \
    em++ -std=c++17 -O3 \
    -I/src/apps/firmware/lib/Core/include \
    -I/src/apps/firmware/lib/SimulatorHarness/include \
    /src/apps/visualiser/wasm/core-sim.cpp \
    /src/apps/firmware/lib/Core/src/ControlLoop.cpp \
    /src/apps/firmware/lib/Core/src/ControllerApp.cpp \
    /src/apps/firmware/lib/Core/src/ControllerConfig.cpp \
    /src/apps/firmware/lib/Core/src/RecoveryManager.cpp \
    /src/apps/firmware/lib/SimulatorHarness/src/SimulationHarness.cpp \
    -sWASM=1 \
    -sMODULARIZE=1 \
    -sEXPORT_ES6=1 \
    -sENVIRONMENT=web \
    -sALLOW_MEMORY_GROWTH=1 \
    -sEXPORTED_FUNCTIONS='["_core_create","_core_create_with_config","_core_create_configured","_core_destroy","_core_complete_startup","_core_set_tank","_core_set_pump_proof","_core_set_blower_proof","_core_set_alarm_silence","_core_set_manual_reset","_core_tick","_core_get_mode","_core_get_pump","_core_get_blower","_core_get_valve","_core_get_audible_alarm","_core_get_visual_alarm","_core_get_high_fault","_core_get_pump_fault","_core_get_blower_fault","_core_get_cycle_count"]' \
    -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
    -o /src/apps/visualiser/public/core/core-sim.js

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/visualiser/package.json apps/visualiser/package.json
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
COPY --from=core-wasm /src/apps/visualiser/public/core apps/visualiser/public/core
RUN yarn workspace @septic-system/visualiser build

FROM nginx:alpine
COPY --from=build /app/apps/visualiser/dist /usr/share/nginx/html
COPY apps/visualiser/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
