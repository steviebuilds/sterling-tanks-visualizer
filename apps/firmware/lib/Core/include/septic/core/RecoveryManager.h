#pragma once

#include "septic/core/ControllerTypes.h"

namespace septic::core
{

	class RecoveryManager
	{
	public:
		explicit RecoveryManager(bool start_in_safe_hold);

		bool startup_hold_active() const;
		void completeStartupChecks();
		ControllerState applyStartupPolicy(std::uint32_t now_ms) const;

	private:
		bool startup_hold_active_;
	};

} // namespace septic::core
