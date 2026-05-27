# Sterling Email History

Last updated: 2026-05-20

Coverage: Gmail search for Sterling / Hidden Arbor / OSSF context from 2026-01-01 through 2026-05-20.

Source: Gmail via `gws`, user `steve@wahlu.com`. Raw email bodies are not stored here; this is a retrieval-friendly project memory.

## Relevant Threads

### Hidden Arbor RV Park OSSF

- Thread ID: `19d2a9beec35f79d`
- Subject: `Fwd: Hidden Arbor RV Park OSSF` / `Re: Hidden Arbor RV Park OSSF`
- Participants: Sterling Maynard, Steve Richardson, Clickr Support
- Date range: 2026-03-26 to 2026-05-19

This is the main engineering thread. Sterling forwarded the original Hidden Arbor OSSF plans, Steve sent the control/flow questions, and Sterling later replied with clarifications.

Key timeline:

- 2026-03-26: Sterling forwarded the Hidden Arbor RV Park OSSF plan chain from WaterEngineers.
- 2026-03-28: Steve sent the flow-mapping page and 13 control questions covering polling, dosing, floats, high-level response, proof timing, paired pumps, the 2,000 gallon tank, blowers, BSZ outputs, restart behaviour, zoning, dashboard requirements, and data granularity.
- 2026-04-02: Sterling confirmed his correct email address and said answers would follow.
- 2026-05-19: Sterling replied with a shorter answer set and suggested a call to discuss the points.

The 2026-05-19 reply says:

- The `Holding/Dosing Tank` label is wrong and the relevant tank is the Effluent Holding Pump Tank downstream of the ATU.
- Critical inputs and equipment proof can be checked every 15 seconds; general status/logging every 60 seconds.
- Baseline dosing should remain adjustable, typically 4-12 doses per day with lockout between doses.
- Float semantics: low = pump off / dry-run protection, lead/on = enable dosing, lag = bring second pump online, high = alarm.
- High level should override schedule, run lead pump continuously, then both pumps if the level continues rising, with alarm maintained until manual acknowledgement.
- Proof timing: blower 5-10 seconds; pumps 10-15 seconds.
- Paired pumps alternate each cycle; both run only under high-level condition.
- The 2,000 gallon tank is an effluent holding pump tank after ATU, adding capacity before effluent pumping.
- ATU blowers run continuously during normal operation and only stop for fault or maintenance mode.
- `BSZ-205` through `BSZ-212` should be treated as output relays, intended to control blowers and potentially valves depending on the final I/O mapping.
- Reboot/power loss approach is acceptable if the controller re-reads inputs, waits 10-30 seconds, resumes AUTO only based on current conditions, and does not blindly restart pumps.
- Disposal zones should run sequentially, tied to dose events, with rest/recovery time and hydraulic loading limits respected.
- Dashboard should show real-time I/O, tank levels by float state, equipment running/fault states, active and historical alarms, and manual override.
- Data granularity: alarms immediate, state every 30 seconds, logged summaries every 10-15 minutes, high-resolution data during active events.

### Detailed Control Answer

- Thread ID: `19e23652816a50f5`
- Subject: `Re: Hidden Arbor RV Park OSSF`
- Participants: Sterling Maynard, Steve Richardson, Clickr Support, Mark
- Date: 2026-05-13

This standalone reply is the most detailed control specification received so far and is the basis for the current firmware interpretation.

Key decisions from Sterling:

- Correct flow: `ATU -> Effluent Holding/Pump Tank -> disposal field`.
- The 2,000 gallon tank does not feed the ATU.
- Controller scan loop should target `100ms`.
- Float inputs should use `1s` confirmation debounce.
- Analogue reads should be sampled and filtered every scan.
- Flow pulses should accumulate by hardware interrupt and total per scan.
- EQ tank to ATU pumps are demand-mode pumps, controlled by the pump float.
- ATU effluent to disposal tank pumps are timed dosing: start with a 30 minute interval and 5 minute on-time, field-adjustable.
- Each tank has LOW / LAG / HIGH floats:
  - LOW closed: below minimum level, disable pumps for that tank, non-latching.
  - LAG closed: above normal but below high, enable lag pump as well as lead, non-latching.
  - HIGH closed: high water alarm, stop all pumps for that tank, activate audible and visual alarm, latch fault, manual acknowledgement required after float clears.
- Texas OSSF alarm circuit needs a separate electrical circuit and a physical manual silence switch.
- Pump proof: detect flow pulses within 15 seconds after pump relay energises; otherwise stop pump, fault, close valves, alarm, manual reset.
- Blower proof: air pressure switch must close within 10 seconds after blower relay energises; otherwise stop blower, fault, alarm, manual reset.
- Paired pumps alternate on each call; alternation persists through normal power cycles.
- If LAG is asserted, both pumps run. If the lead pump faults during a dose, the lag pump takes over and the failed pump alarms.
- ATU blowers run continuously in AUTO unless faulted or HOA is OFF.
- `BSZ-205` through `BSZ-212` are blower output relay coils, not feedback inputs.
- On power event, all outputs go OFF, relays de-energise, valves close, and state restores to OFF on reboot.
- Existing latched alarms survive reboot and must be acknowledged before AUTO resumes.
- Disposal has 12 valve outputs, one zone per dose, rotating sequentially.
- Valves only open when the associated pump is permitted to run and close immediately on pump shutdown or any fault.
- Dashboard minimum: floats, pump states, blower states, valve states, flow totals, active alarms with timestamps, and power status.
- Telemetry cadence: live state every 30 seconds, alarm events immediately, daily summaries for runtime/cycles/gallons, 90 day minimum historical retention.
- Sterling said a plan correction and complete hardware pin mapping document would follow.

## Other Search Hits

- Thread ID: `19d2aacb30b66b7b`, Fathom recap from 2026-03-26. This is already represented in the existing source-memory context.
- Calendar invite threads `19d157ee1c3e79e9`, `19d22caf57894533`, and `19d22d178014c011` only scheduled the Sterling device-state workshop.
- Thread ID `19d52ed793cf3b7a` is a Samsung vendor-reference request where Sterling provided an attached reference; it is not engineering context for the septic controller.
- Thread ID `19d3cc6059b90377` is unrelated; "Sterling" refers to Agent Community's AI butler, not Sterling Maynard.
- Thread ID `19ce2ca51aaee58f` is Samsung AI readiness work, not this project.

## Current Interpretation

Use the 2026-05-13 detailed reply as the implementation baseline because it is more complete and more explicit. Treat the 2026-05-19 reply as a follow-up that reopens a few details for discussion.

Open conflicts to resolve with Sterling:

- High-level response differs between emails:
  - 2026-05-13: HIGH stops all pumps for that tank and latches a manual-reset fault.
  - 2026-05-19: HIGH overrides schedule, runs lead pump continuously, then both pumps if level continues rising.
- Polling cadence differs:
  - 2026-05-13: `100ms` scan target with `1s` float debounce.
  - 2026-05-19: 15 second checks for critical inputs/proof and 60 second general logging.
- Reboot behaviour differs:
  - 2026-05-13: outputs off and state restores to OFF; operator-controlled restart.
  - 2026-05-19: re-read inputs, delay 10-30 seconds, resume AUTO only if current conditions call for it.
- BSZ outputs are confirmed as outputs in both replies, but May 19 leaves room for final I/O mapping to decide whether some outputs control valves as well as blowers.
- The plan labelling explanation still needs a corrected drawing because May 19 contains an internally inconsistent sentence about profile vs plan view labels.

