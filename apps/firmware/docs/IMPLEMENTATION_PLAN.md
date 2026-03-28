# Implementation Plan

## What exists now

- PlatformIO project scaffold
- native test target
- ESP32 target
- placeholder control application
- placeholder recovery manager
- placeholder telemetry port

## What happens next

### Phase 1: lock system understanding

- confirm tank sequence and passive vs active stages
- confirm float truth table
- confirm blower proof and command model
- confirm timeout values
- confirm zoning behaviour
- confirm API payload contract

### Phase 2: define configuration model

- hardware profile
- IO mapping
- timer values
- alarm thresholds
- site-specific enable/disable flags

### Phase 3: build core engine

- input snapshot model
- control state machine
- alarm manager
- recovery policies
- telemetry/event model

### Phase 4: adapters

- ESP32 time and logging
- MCP23017 input/output access
- ADS1115 analog reads
- Ethernet / API publisher
- persistent queue or buffering

### Phase 5: confidence work

- native scenario tests
- regression suite from real Sterling examples
- target build verification
- bench-mode simulation and replay tools

## Standard for "done"

The firmware should not be considered ready because it compiles.

It should be ready when:

- the rules are explicit
- the behaviour is test-covered
- the failure paths are named
- the restart behaviour is proven
- the telemetry is stable
