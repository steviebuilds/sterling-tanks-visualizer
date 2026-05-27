#pragma once

#include "septic/core/ControllerConfig.h"
#include "septic/core/ControllerTypes.h"

namespace septic::core
{

	class ControlLoop
	{
	public:
		explicit ControlLoop(ControllerConfig config);

		ControllerState evaluate(const InputSnapshot &inputs, const ControllerState &previous_state, std::uint32_t now_ms) const;

	private:
		ControllerConfig config_;
	};

} // namespace septic::core
