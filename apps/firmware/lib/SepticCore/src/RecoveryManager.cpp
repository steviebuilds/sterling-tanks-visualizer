#include "septic/core/RecoveryManager.h"

namespace septic::core
{

	RecoveryManager::RecoveryManager(const bool start_in_safe_hold)
		: startup_hold_active_(start_in_safe_hold) {}

	bool RecoveryManager::startup_hold_active() const
	{
		return startup_hold_active_;
	}

	void RecoveryManager::completeStartupChecks()
	{
		startup_hold_active_ = false;
	}

	ControllerState RecoveryManager::applyStartupPolicy(const std::uint32_t now_ms) const
	{
		ControllerState state{};
		state.mode = ControllerMode::SafeHold;
		state.last_tick_ms = now_ms;
		state.outputs = {};
		return state;
	}

} // namespace septic::core
