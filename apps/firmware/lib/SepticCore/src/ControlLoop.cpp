#include "septic/core/ControlLoop.h"

namespace septic::core
{

	ControllerState ControlLoop::evaluate(const InputSnapshot &inputs,
										  const ControllerState &previous_state,
										  std::uint32_t now_ms) const
	{
		ControllerState next = previous_state;
		next.last_tick_ms = now_ms;
		next.cycle_count = previous_state.cycle_count + 1;
		next.outputs = {};
		next.faults = {};

		// Placeholder-only behaviour: stay conservative until the Sterling rules are signed off.
		if (inputs.high_level_active)
		{
			next.mode = ControllerMode::Faulted;
			next.faults.high_level = true;
			next.outputs.alarm_enabled = true;
			return next;
		}

		if (inputs.low_level_active && !inputs.flow_proven)
		{
			next.faults.missing_required_input = true;
		}

		next.mode = ControllerMode::Automatic;
		return next;
	}

} // namespace septic::core
