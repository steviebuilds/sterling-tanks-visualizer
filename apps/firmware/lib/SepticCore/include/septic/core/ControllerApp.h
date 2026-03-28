#pragma once

#include "septic/core/ControlLoop.h"
#include "septic/core/ControllerConfig.h"
#include "septic/core/Ports.h"
#include "septic/core/RecoveryManager.h"

namespace septic::core
{

	class ControllerApp
	{
	public:
		ControllerApp(ControllerConfig config, IClock &clock, ITelemetrySink &telemetry_sink);

		void completeStartupChecks();
		const ControllerState &tick(const InputSnapshot &inputs);
		const ControllerState &currentState() const;

	private:
		ControllerConfig config_;
		IClock &clock_;
		ITelemetrySink &telemetry_sink_;
		ControlLoop control_loop_;
		RecoveryManager recovery_manager_;
		ControllerState state_{};
	};

} // namespace septic::core
