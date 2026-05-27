# Controller Rules

This captures the current firmware interpretation of Sterling's 2026-05-13 reply. It is written as implementation context, not as a final commissioning sheet. See [`docs/sterling-email-history.md`](../../../docs/sterling-email-history.md) for the Gmail thread summary and the 2026-05-19 conflicts that still need client confirmation.

## Implemented

- Controller scan target defaults to `100ms`.
- Float changes require `1000ms` confirmation before changing stable state.
- Equalization to ATU pumps are demand controlled.
- Disposal to field pumps use timed dosing: default `30 minutes` interval, `5 minutes` run time.
- Pump stations use two pumps with lead/lag alternation.
- LAG float runs both available pumps.
- LOW float inhibits that tank's pump station without latching.
- HIGH float latches high water and requires manual reset after the float clears.
- HIGH behavior is configurable while Sterling resolves the conflict: either stop the affected tank's pumps or keep alarming while running both available pumps to pump down.
- Pump proof uses flow feedback and latches after `15s` without proof.
- Blower proof uses air feedback and latches after `10s` without proof.
- Blowers run continuously in AUTO unless faulted or switched OFF.
- Disposal valves rotate sequentially across 12 zones, one active zone per dose.
- Alarm silence suppresses audible alarm only. Visual alarm and latched fault remain.

## Still Open

- Complete hardware pin map and terminal assignments.
- Whether the pump-call float is a distinct input or hidden in the current LOW/LAG/HIGH naming.
- Whether HIGH should fail safe by stopping the affected tank's pumps, as in the 2026-05-13 reply, or pump down by running lead/lag, as in the 2026-05-19 reply.
- Whether reboot should restore to OFF pending operator action, as in the 2026-05-13 reply, or resume AUTO after input reread and delay when conditions allow, as in the 2026-05-19 reply.
- Final HOA behavior in HAND, especially which safety interlocks must always win.
- Persistence backend for alternation, configurable timers, active zone count, and latched faults.
- Dashboard/telemetry transport, endpoint, auth, and exact payload format.
- Whether flow proof is per pump, per station, or both in the physical panel.

## Profile Edit Points

Client-editable constants and pin placeholders live in `lib/ESP32Harness/include/septic/hal/SiteConstants.h`.

The current constants name every expected logical point but leave physical pins as `-1`. Unmapped inputs use conservative bench defaults: inactive floats, AUTO HOA, and healthy proof signals. Unmapped outputs are ignored. Fill the constants from the final terminal map before field use.
