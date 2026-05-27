# Firmware Architecture

## Goal

Build an ESP32 controller that is boring in the best possible way:

- deterministic
- testable
- safe on restart
- explicit about faults
- resilient when the network disappears
- easy to extend without duplicating logic

## Design shape

### 1\. Domain core first

The real control logic should live in `lib/Core` as plain C++ with no direct dependency on:

- Arduino globals
- GPIO APIs
- Serial
- Wi-Fi stacks
- HTTP clients
- specific sensor libraries

That lets us run the important decisions in native tests on a laptop.

### 2\. Thin hardware shell

`src/main.cpp` and `lib/ESP32Harness` should do only platform work:

- read inputs
- write outputs
- provide time
- publish telemetry
- boot the app

They should not decide the wastewater logic.

### 3\. Ports and adapters

The core talks to interfaces, not hardware:

- clock
- telemetry sink
- input readers
- output writers
- persistent storage
- alarm/event logger

The ESP32 layer implements those interfaces.

### 4\. Deterministic tick model

The firmware should eventually run as a predictable loop:

1. Read all inputs.
2. Build an immutable snapshot.
3. Run the control engine.
4. Apply the resulting commands.
5. Publish telemetry/events.

That makes bugs easier to reason about and replay in tests.

## Reliability plan

### Safe startup

On boot or power return:

- start with outputs off
- re-read the world
- only enable automatic behaviour after startup checks pass

### Fault handling

Critical faults should be explicit and local:

- high level
- no-flow after pump command
- no-airflow after blower command
- missing sensor required for a protective decision

### Self-recovery

Self-recovery should be deliberate, not accidental:

- faults may latch or auto-clear depending on signed-off rules
- telemetry failure must not stop local control
- reboot should return to a known-safe state
- retries should be bounded and observable

## DRY without being clever

The point is not to compress everything into abstractions for their own sake.

The point is:

- one place for state transitions
- one place for alarm rules
- one place for telemetry shaping
- one place for wiring/profile configuration

If two stages share a pattern, extract it. If they do not, keep them separate.

## Testing strategy

### Native tests

These should carry most of the confidence:

- startup behaviour
- state transitions
- alarm latching
- timeout rules
- failover rules
- telemetry shaping

### ESP32 builds

We still compile for the actual target so platform breakage is caught early, even without hardware in hand.

### Simulation

`lib/SimulatorHarness` runs the real controller with a fake clock and controlled input snapshots. That is the shared adapter for:

- rising tank levels
- low-level cutouts
- missed flow proof
- blower proof failures
- reboot during alarm
- API outage and replay

The native Unity tests cover short deterministic cases. The visualiser and any long-running replay tests should use the same harness instead of recreating controller behaviour in TypeScript.
