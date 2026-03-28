#pragma once

#include "septic/core/ControllerTypes.h"

namespace septic::core
{

	class ControlLoop
	{
	public:
		ControllerState evaluate(const InputSnapshot &inputs, const ControllerState &previous_state, std::uint32_t now_ms) const;
	};

} // namespace septic::core
