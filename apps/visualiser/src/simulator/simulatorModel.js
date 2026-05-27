export const SIMULATOR_CONFIG = {
	core: {
		floatDebounceMs: 0,
		pumpProofTimeoutMs: 15000,
		blowerProofTimeoutMs: 10000,
		activeZoneCount: 12,
	},
	tank: {
		minPercent: 6,
		maxPercent: 96,
		svgWaterBottomY: 196,
		svgWaterTravel: 166,
		levels: {
			low: 14,
			normal: 42,
			call: 60,
			lag: 78,
			high: 93,
		},
		floats: {
			low: { label: 'LOW', percent: 22, trip: 'below' },
			call: { label: 'CALL', percent: 48, trip: 'above' },
			lag: { label: 'LAG', percent: 74, trip: 'above' },
			high: { label: 'HIGH', percent: 88, trip: 'above' },
		},
	},
	highRuleDefault: 'pumpdown',
};

export const LEVELS = SIMULATOR_CONFIG.tank.levels;

export const TANKS = {
	eq: {
		label: 'EQ / dosing tank',
		short: 'EQ tank',
		pump: 'PSZ-201 / 202',
		flow: 'to ATU',
	},
	effluent: {
		label: 'Effluent pump tank',
		short: 'Effluent tank',
		pump: 'PSZ-203 / 204',
		flow: 'to disposal',
	},
};

export const SCENARIOS = [
	{ id: 'normal', label: 'Normal', level: LEVELS.normal },
	{ id: 'call', label: 'Pump call', level: LEVELS.call },
	{ id: 'lag', label: 'Lag', level: LEVELS.lag },
	{ id: 'high', label: 'High', level: LEVELS.high },
	{ id: 'low', label: 'Low', level: LEVELS.low },
];

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const tankPercentToSvgY = (percent) =>
	SIMULATOR_CONFIG.tank.svgWaterBottomY -
	SIMULATOR_CONFIG.tank.svgWaterTravel * (percent / 100);

export const FLOAT_MARKERS = [
	['high', SIMULATOR_CONFIG.tank.floats.high],
	['lag', SIMULATOR_CONFIG.tank.floats.lag],
	['call', SIMULATOR_CONFIG.tank.floats.call],
	['low', SIMULATOR_CONFIG.tank.floats.low],
].map(([id, marker]) => ({
	id,
	...marker,
	y: tankPercentToSvgY(marker.percent),
}));

export const getFloats = (level) => ({
	low: level <= SIMULATOR_CONFIG.tank.floats.low.percent,
	call: level >= SIMULATOR_CONFIG.tank.floats.call.percent,
	lag: level >= SIMULATOR_CONFIG.tank.floats.lag.percent,
	high: level >= SIMULATOR_CONFIG.tank.floats.high.percent,
});

export const levelName = (level) => {
	if (level >= SIMULATOR_CONFIG.tank.floats.high.percent) return 'High';
	if (level >= SIMULATOR_CONFIG.tank.floats.lag.percent) return 'Lag';
	if (level >= SIMULATOR_CONFIG.tank.floats.call.percent) return 'Pump call';
	if (level <= SIMULATOR_CONFIG.tank.floats.low.percent) return 'Low';
	return 'Normal';
};

export const getTankOutput = ({ level, highRule, proofFault, rebootHold }) => {
	const floats = getFloats(level);
	const highStop = floats.high && highRule === 'stop';
	const pumpAllowed = !rebootHold && !floats.low && !proofFault && !highStop;
	const pumpOne = pumpAllowed && (floats.call || floats.high);
	const pumpTwo = pumpAllowed && (floats.lag || (floats.high && highRule === 'pumpdown'));

	return {
		floats,
		pumpOne,
		pumpTwo,
		alarm: floats.high || proofFault,
		flow: (pumpOne || pumpTwo) && !proofFault,
	};
};
