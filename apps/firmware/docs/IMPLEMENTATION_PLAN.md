# Implementation Plan

## What exists now

- PlatformIO project scaffold
- native test target
- ESP32 target
- hardware-agnostic control core
- startup safe-hold policy
- telemetry port
- scenario tests for the current Sterling rules

## What happens next

### Phase 1: close remaining system gaps

- receive corrected plan sheet
- receive hardware pin map
- confirm whether pump-call float is a distinct input
- confirm HAND-mode safety rules
- confirm API payload contract and transport

### Phase 2: hardware adapters

- fill hardware profile from pin map
- replace direct ESP32 pins with expander drivers if the panel uses IO modules
- persistent storage for timers, active zones, lead alternation, and latches

### Phase 3: simulation harness

- replay scenario files
- generate dashboard snapshots from simulated ticks
- test long-run timing and zone rotation
- test reset and power-cycle cases

### Phase 4: adapters

- ESP32 time and logging refinements
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
