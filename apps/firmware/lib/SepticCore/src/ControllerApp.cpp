#include "septic/core/ControllerApp.h"

namespace septic::core
{

	ControllerApp::ControllerApp(ControllerConfig config, IClock &clock, ITelemetrySink &telemetry_sink)
		: config_(config),
		  clock_(clock),
		  telemetry_sink_(telemetry_sink),
		  recovery_manager_(config.start_in_safe_hold) {}

	void ControllerApp::completeStartupChecks()
	{
		recovery_manager_.completeStartupChecks();
	}

	const ControllerState &ControllerApp::tick(const InputSnapshot &inputs)
	{
		const auto now_ms = clock_.millis();

		if (recovery_manager_.startup_hold_active())
		{
			state_ = recovery_manager_.applyStartupPolicy(now_ms);
		}
		else
		{
			state_ = control_loop_.evaluate(inputs, state_, now_ms);
		}

		if (config_.telemetry_enabled)
		{
			telemetry_sink_.publishHeartbeat(state_);
		}

		return state_;
	}

	const ControllerState &ControllerApp::currentState() const
	{
		return state_;
	}

} // namespace septic::core
