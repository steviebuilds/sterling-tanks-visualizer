import { useMemo, useState } from 'react';
import { useCoreWasm } from '../core/useCoreWasm';
import { LEVELS, SIMULATOR_CONFIG, TANKS } from '../simulator/simulatorModel';
import { ControlsPanel } from './ControlsPanel';
import { StatusPanel } from './StatusPanel';
import { SystemMap } from './SystemMap';

export function SimulatorView() {
	const [selectedTank, setSelectedTank] = useState('effluent');
	const [levels, setLevels] = useState({
		eq: LEVELS.normal,
		effluent: LEVELS.normal,
	});
	const [highRule, setHighRule] = useState(SIMULATOR_CONFIG.highRuleDefault);
	const [pumpProofFault, setPumpProofFault] = useState(false);
	const [blowerFault, setBlowerFault] = useState(false);
	const [rebootHold, setRebootHold] = useState(false);
	const [alarmSilenced, setAlarmSilenced] = useState(false);
	const [resetVersion, setResetVersion] = useState(0);
	const [events, setEvents] = useState(['Simulator ready']);

	const simulationInputs = useMemo(
		() => ({
			alarmSilenced,
			blowerFault,
			highRule,
			levels,
			pumpProofFault,
			rebootHold,
			resetVersion,
			selectedTank,
		}),
		[alarmSilenced, blowerFault, highRule, levels, pumpProofFault, rebootHold, resetVersion, selectedTank],
	);
	const coreState = useCoreWasm(simulationInputs);
	const outputs = coreState.outputs;

	const addEvent = (message) => {
		setEvents((current) => [message, ...current].slice(0, 24));
	};

	const updateSelectedLevel = (nextLevel, message) => {
		setLevels((current) => ({
			...current,
			[selectedTank]: nextLevel,
		}));
		addEvent(`${TANKS[selectedTank].short}: ${message}`);
	};

	const reset = () => {
		setLevels({
			eq: LEVELS.normal,
			effluent: LEVELS.normal,
		});
		setPumpProofFault(false);
		setBlowerFault(false);
		setRebootHold(false);
		setAlarmSilenced(false);
		setResetVersion((version) => version + 1);
		addEvent('Manual reset acknowledged');
	};

	return (
		<section className="simulator-stack">
			<div className="sim-grid">
				<ControlsPanel
					alarmSilenced={alarmSilenced}
					blowerFault={blowerFault}
					highRule={highRule}
					onEvent={addEvent}
					onReset={reset}
					onSelectedLevelChange={updateSelectedLevel}
					pumpProofFault={pumpProofFault}
					rebootHold={rebootHold}
					selectedLevel={levels[selectedTank]}
					selectedTank={selectedTank}
					setAlarmSilenced={setAlarmSilenced}
					setBlowerFault={setBlowerFault}
					setHighRule={setHighRule}
					setPumpProofFault={setPumpProofFault}
					setRebootHold={setRebootHold}
					setSelectedTank={setSelectedTank}
				/>
				<SystemMap
					blowerFault={outputs.blowerFault}
					levels={levels}
					onSelectTank={(tank) => {
						setSelectedTank(tank);
						addEvent(`${TANKS[tank].short} selected`);
					}}
					outputs={outputs}
					rebootHold={rebootHold}
					selectedTank={selectedTank}
				/>
				<StatusPanel
					events={events}
					outputs={outputs}
					selectedOutput={outputs[selectedTank]}
				/>
			</div>
		</section>
	);
}
