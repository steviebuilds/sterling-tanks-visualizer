import { useEffect, useMemo, useRef, useState } from 'react';
import { getFloats, getTankOutput, SIMULATOR_CONFIG } from '../simulator/simulatorModel';

const STATION = {
	eq: 0,
	effluent: 1,
};

const TANK = {
	eq: 0,
	effluent: 1,
};

const PUMPS_PER_STATION = 2;
const BLOWER_COUNT = 8;
const VALVE_COUNT = 12;
const SCAN_MS = 100;

function emptyCoreState() {
	return {
		status: 'loading',
		ready: false,
		outputs: null,
		error: null,
	};
}

function highRuleToCoreValue(highRule) {
	return highRule === 'pumpdown' ? 1 : 0;
}

function fallbackOutputs({ alarmSilenced, blowerFault, highRule, levels, pumpProofFault, rebootHold, selectedTank }) {
	const eq = getTankOutput({
		level: levels.eq,
		highRule,
		proofFault: pumpProofFault && selectedTank === 'eq',
		rebootHold,
	});
	const effluent = getTankOutput({
		level: levels.effluent,
		highRule,
		proofFault: pumpProofFault && selectedTank === 'effluent',
		rebootHold,
	});
	const alarm = eq.alarm || effluent.alarm || blowerFault;

	return {
		mode: rebootHold ? 1 : alarm ? 3 : 2,
		cycleCount: 0,
		eq,
		effluent,
		alarm,
		audibleAlarm: alarm && !alarmSilenced,
		visualAlarm: alarm,
		blower: !rebootHold && !blowerFault,
		valve: effluent.flow,
		valves: [],
		source: 'fallback',
	};
}

function readCoreSnapshot(api, handle, levels) {
	const pump = (station, index) => api.getPump(handle, station, index) !== 0;
	const pumpFault = (station, index) => api.getPumpFault(handle, station, index) !== 0;
	const highFault = (tank) => api.getHighFault(handle, tank) !== 0;
	const blower = Array.from({ length: BLOWER_COUNT }, (_, index) => api.getBlower(handle, index) !== 0);
	const blowerFaults = Array.from({ length: BLOWER_COUNT }, (_, index) => api.getBlowerFault(handle, index) !== 0);
	const valves = Array.from({ length: VALVE_COUNT }, (_, index) => api.getValve(handle, index) !== 0);
	const eqFloats = getFloats(levels.eq);
	const effluentFloats = getFloats(levels.effluent);
	const eqPumpOne = pump(STATION.eq, 0);
	const eqPumpTwo = pump(STATION.eq, 1);
	const effluentPumpOne = pump(STATION.effluent, 0);
	const effluentPumpTwo = pump(STATION.effluent, 1);
	const audibleAlarm = api.getAudibleAlarm(handle) !== 0;
	const visualAlarm = api.getVisualAlarm(handle) !== 0;

	return {
		mode: api.getMode(handle),
		cycleCount: api.getCycleCount(handle),
		eq: {
			floats: eqFloats,
			pumpOne: eqPumpOne,
			pumpTwo: eqPumpTwo,
			alarm: highFault(TANK.eq) || pumpFault(STATION.eq, 0) || pumpFault(STATION.eq, 1),
			flow: eqPumpOne || eqPumpTwo,
			highFault: highFault(TANK.eq),
			pumpFault: pumpFault(STATION.eq, 0) || pumpFault(STATION.eq, 1),
		},
		effluent: {
			floats: effluentFloats,
			pumpOne: effluentPumpOne,
			pumpTwo: effluentPumpTwo,
			alarm: highFault(TANK.effluent) || pumpFault(STATION.effluent, 0) || pumpFault(STATION.effluent, 1),
			flow: effluentPumpOne || effluentPumpTwo,
			highFault: highFault(TANK.effluent),
			pumpFault: pumpFault(STATION.effluent, 0) || pumpFault(STATION.effluent, 1),
		},
		alarm: audibleAlarm || visualAlarm,
		audibleAlarm,
		visualAlarm,
		blower: blower.some(Boolean),
		blowerFault: blowerFaults.some(Boolean),
		valve: valves.some(Boolean),
		valves,
		source: 'core',
	};
}

function applyInputs(api, handle, { alarmSilenced, blowerFault, levels, pumpProofFault, selectedTank }) {
	Object.entries(TANK).forEach(([tankKey, tankIndex]) => {
		const floats = getFloats(levels[tankKey]);
		api.setTank(handle, tankIndex, floats.low ? 1 : 0, floats.call ? 1 : 0, floats.lag ? 1 : 0, floats.high ? 1 : 0);
	});

	Object.entries(STATION).forEach(([tankKey, stationIndex]) => {
		const proofHealthy = !(pumpProofFault && selectedTank === tankKey);
		for (let pumpIndex = 0; pumpIndex < PUMPS_PER_STATION; pumpIndex += 1) {
			api.setPumpProof(handle, stationIndex, pumpIndex, proofHealthy ? 1 : 0);
		}
	});

	for (let blowerIndex = 0; blowerIndex < BLOWER_COUNT; blowerIndex += 1) {
		api.setBlowerProof(handle, blowerIndex, blowerFault ? 0 : 1);
	}

	api.setAlarmSilence(handle, alarmSilenced ? 1 : 0);
}

function createApi(core) {
	return {
		createConfigured: core.cwrap('core_create_configured', 'number', [
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
		]),
		destroy: core.cwrap('core_destroy', null, ['number']),
		setTank: core.cwrap('core_set_tank', null, ['number', 'number', 'number', 'number', 'number', 'number']),
		setPumpProof: core.cwrap('core_set_pump_proof', null, ['number', 'number', 'number', 'number']),
		setBlowerProof: core.cwrap('core_set_blower_proof', null, ['number', 'number', 'number']),
		setAlarmSilence: core.cwrap('core_set_alarm_silence', null, ['number', 'number']),
		tick: core.cwrap('core_tick', null, ['number', 'number']),
		getMode: core.cwrap('core_get_mode', 'number', ['number']),
		getPump: core.cwrap('core_get_pump', 'number', ['number', 'number', 'number']),
		getBlower: core.cwrap('core_get_blower', 'number', ['number', 'number']),
		getValve: core.cwrap('core_get_valve', 'number', ['number', 'number']),
		getAudibleAlarm: core.cwrap('core_get_audible_alarm', 'number', ['number']),
		getVisualAlarm: core.cwrap('core_get_visual_alarm', 'number', ['number']),
		getHighFault: core.cwrap('core_get_high_fault', 'number', ['number', 'number']),
		getPumpFault: core.cwrap('core_get_pump_fault', 'number', ['number', 'number', 'number']),
		getBlowerFault: core.cwrap('core_get_blower_fault', 'number', ['number', 'number']),
		getCycleCount: core.cwrap('core_get_cycle_count', 'number', ['number']),
	};
}

export function useCoreWasm(simulationInputs) {
	const [coreState, setCoreState] = useState(emptyCoreState);
	const [apiReady, setApiReady] = useState(false);
	const apiRef = useRef(null);
	const fallbackRef = useRef(null);
	const handleRef = useRef(0);
	const keyRef = useRef('');
	const fallback = useMemo(() => fallbackOutputs(simulationInputs), [simulationInputs]);
	fallbackRef.current = fallback;

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const coreUrl = `${window.location.origin}/core/core-sim.js`;
				const module = await import(/* @vite-ignore */ coreUrl);
				const createModule = module.default ?? module;
				const core = await createModule({
					locateFile: (path) => `/core/${path}`,
				});

				if (cancelled) return;
				apiRef.current = createApi(core);
				setCoreState((current) => ({ ...current, status: 'ready', ready: true, error: null }));
				setApiReady(true);
			} catch (error) {
				if (!cancelled) {
					setCoreState({
						status: 'missing',
						ready: false,
						outputs: fallbackRef.current,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}

		load();

		return () => {
			cancelled = true;
			if (apiRef.current && handleRef.current) {
				apiRef.current.destroy(handleRef.current);
				handleRef.current = 0;
			}
		};
	}, []);

	useEffect(() => {
		const api = apiRef.current;
		if (!api) {
			setCoreState((current) => ({
				...current,
				outputs: current.ready ? current.outputs : fallback,
			}));
			return;
		}

		const key = [
			simulationInputs.highRule,
			simulationInputs.rebootHold ? 'hold' : 'run',
			simulationInputs.resetVersion,
		].join(':');

		if (!handleRef.current || keyRef.current !== key) {
			if (handleRef.current) {
				api.destroy(handleRef.current);
			}
			handleRef.current = api.createConfigured(
				SIMULATOR_CONFIG.core.floatDebounceMs,
				SIMULATOR_CONFIG.core.pumpProofTimeoutMs,
				SIMULATOR_CONFIG.core.blowerProofTimeoutMs,
				SIMULATOR_CONFIG.core.activeZoneCount,
				highRuleToCoreValue(simulationInputs.highRule),
				simulationInputs.rebootHold ? 0 : 1,
			);
			keyRef.current = key;
		}

		applyInputs(api, handleRef.current, simulationInputs);

		const pumpFaultSelected = simulationInputs.pumpProofFault;
		const blowerFaultSelected = simulationInputs.blowerFault;
		const elapsedMs = pumpFaultSelected || blowerFaultSelected
			? Math.max(SIMULATOR_CONFIG.core.pumpProofTimeoutMs, SIMULATOR_CONFIG.core.blowerProofTimeoutMs) + SCAN_MS
			: SCAN_MS;
		api.tick(handleRef.current, elapsedMs);

		setCoreState({
			status: 'ready',
			ready: true,
			outputs: readCoreSnapshot(api, handleRef.current, simulationInputs.levels),
			error: null,
		});
	}, [apiReady, fallback, simulationInputs]);

	return {
		...coreState,
		outputs: coreState.outputs ?? fallback,
	};
}
