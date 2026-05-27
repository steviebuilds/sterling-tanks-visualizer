export const STAGES = [
	{
		id: 'pretreatment',
		title: 'Pretreatment Tank',
		kind: 'pretreatment',
		summary: 'Gravity stage only.',
		countChip: '1 tank in plan',
		inputs: [],
		outputs: [],
		bullets: [
			'If influent enters this tank, let it pass to the next stage by gravity.',
			'No direct ESP32 I/O is shown for this stage in the current pin list.',
		],
		transfer: 'Flows to the next stage by gravity.',
	},
	{
		id: 'holding-pump',
		title: '2000 GALLON EFFLUENT HOLDING/PUMP TANK',
		kind: 'pump-tank-1',
		summary: 'Time-dose pump stage feeding the ATU.',
		countChip: '4 tanks in plan',
		inputs: ['LLS-01', 'ALS-01', 'HLS-01', 'FTQ-03'],
		outputs: ['PSZ-201', 'PSZ-202'],
		bullets: [
			'If the dose schedule is active and LLS-01 does not indicate low level, turn on PSZ-201 or PSZ-202.',
			'If PSZ-201 or PSZ-202 is on, expect flow pulses from FTQ-03.',
			'If LLS-01 indicates low level, turn off the dosing pump.',
			'If PSZ-201 or PSZ-202 is on but FTQ-03 shows no pulses, stop the pump and raise a fault.',
			'If ALS-01 or HLS-01 goes active, raise a high-level alarm.',
		],
		transfer: 'Moves flow forward by dosing pump.',
	},
	{
		id: 'atu',
		title: '1500 GPD A.T.U.',
		kind: 'atu',
		summary: 'Aeration stage with blower proof.',
		countChip: '6 units in plan',
		inputs: [
			'PS-06',
			'PS-07',
			'PS-08',
			'PS-09',
			'PS-10',
			'PS-11',
			'PS-12',
			'PS-13',
		],
		outputs: [
			'BSZ-205',
			'BSZ-206',
			'BSZ-207',
			'BSZ-208',
			'BSZ-209',
			'BSZ-210',
			'BSZ-211',
			'BSZ-212',
		],
		bullets: [
			'If a blower output BSZ-205 to BSZ-212 is commanded on, require proof from the matching pressure switch PS-06 to PS-13.',
			'If the matching pressure switch does not prove airflow, raise a blower / airflow alarm.',
			'If airflow proof is present, allow the aeration stage to continue running.',
		],
		transfer: 'Flows onward after treatment.',
	},
	{
		id: 'holding-dosing',
		title: '2000 GALLON HOLDING/DOSING TANK',
		kind: 'buffer',
		summary: 'Post-ATU buffer / storage stage.',
		countChip: '4 tanks in plan',
		inputs: [],
		outputs: [],
		bullets: [
			'If no dedicated float or pump I/O is wired here, treat this as a passive buffer stage.',
			'If additional field wiring is added later, this stage may need its own control logic.',
		],
		transfer: 'Acts as a passive buffer into the final pump tank.',
	},
	{
		id: 'final-pump',
		title: '1000 GALLON EFFLUENT PUMP TANK',
		kind: 'pump-tank-2',
		summary: 'Final discharge pump stage before chlorination / disposal.',
		countChip: '1 tank in plan',
		inputs: ['LLS-02', 'ALS-02', 'HLS-02', 'FTQ-04', 'FTQ-05'],
		outputs: ['PSZ-203', 'PSZ-204'],
		bullets: [
			'If discharge is required and LLS-02 does not indicate low level, turn on PSZ-203 or PSZ-204.',
			'If zoning is used, open the selected zone valve before turning on PSZ-203 or PSZ-204.',
			'If PSZ-203 or PSZ-204 is on, expect discharge flow pulses from FTQ-04.',
			'If LLS-02 indicates low level, turn off the effluent pump.',
			'If PSZ-203 or PSZ-204 is on but FTQ-04 shows no pulses, stop the pump and raise a fault.',
			'If ALS-02 or HLS-02 goes active, raise a high-level alarm.',
		],
		transfer: 'Moves flow forward by final effluent pump.',
	},
	{
		id: 'chlorinator',
		title: 'Liquid Chlorinator',
		kind: 'chlorinator',
		summary: 'Inline treatment between final pump and disposal area.',
		countChip: '1 inline unit',
		inputs: [],
		outputs: [
			'VXY-213',
			'VXY-214',
			'VXY-215',
			'VXY-216',
			'VXY-217',
			'VXY-218',
			'VXY-219',
			'VXY-220',
			'VXY-221',
			'VXY-222',
			'VXY-223',
			'VXY-224',
		],
		bullets: [
			'If PSZ-203 or PSZ-204 is running, route effluent through the liquid chlorinator.',
			'If zoning is used, open one VXY-213 to VXY-224 zone valve at a time.',
			'If PT-101, PT-102, PT-103, FTQ-04, or FTQ-05 indicate a flow / pressure mismatch, raise a warning for diagnostics.',
		],
		pressures: ['PT-101', 'PT-102', 'PT-103'],
		transfer: 'Discharges treated effluent to the disposal area.',
	},
	{
		id: 'disposal',
		title: 'Proposed OSSF Effluent Disposal Area',
		kind: 'disposal',
		summary: 'Terminal field / dispersal area.',
		inputs: [],
		outputs: [],
		bullets: [
			'If chlorinated effluent reaches this stage, send it to the disposal area.',
			'If pressure or return-flow diagnostics look wrong downstream, raise a maintenance warning.',
		],
		transfer: 'End of the visible process flow.',
	},
];

export const RULES = [
	{
		stage: '2000 GALLON EFFLUENT HOLDING/PUMP TANK',
		when: 'Dose schedule triggers and LLS-01 does not indicate low level',
		then: 'Turn on PSZ-201 or PSZ-202.',
	},
	{
		stage: '2000 GALLON EFFLUENT HOLDING/PUMP TANK',
		when: 'Pump is on but FTQ-03 has no pulses',
		then: 'Stop pump and raise fault.',
	},
	{
		stage: '2000 GALLON EFFLUENT HOLDING/PUMP TANK',
		when: 'ALS-01 or HLS-01 goes active',
		then: 'Raise high-level alarm.',
	},
	{
		stage: '1500 GPD A.T.U.',
		when: 'Blower output is on but matching pressure switch is not proven',
		then: 'Raise blower / airflow alarm.',
	},
	{
		stage: '1000 GALLON EFFLUENT PUMP TANK',
		when: 'Effluent level is high enough to discharge',
		then: 'Open active zone valve if used, then turn on PSZ-203 or PSZ-204.',
	},
	{
		stage: '1000 GALLON EFFLUENT PUMP TANK',
		when: 'Pump is on but FTQ-04 has no pulses',
		then: 'Stop pump and raise fault.',
	},
	{
		stage: '1000 GALLON EFFLUENT PUMP TANK',
		when: 'ALS-02 or HLS-02 goes active',
		then: 'Raise high-level alarm.',
	},
	{
		stage: 'Disposal Area',
		when: 'PT-101 minus PT-102 is too high, or outflow vs return flow looks wrong',
		then: 'Raise maintenance warning for clog / filter / field issue.',
	},
];

export const CLARIFYING_QUESTIONS = [
	{
		id: '1',
		prompt: 'How often should the controller be checking things?',
		note: 'Is it the same for everything, or different per thing? For example: every 30 seconds, every 5 minutes, every 30 minutes.',
	},
	{
		id: '2',
		prompt: 'What kind of dosing schedule do you want on the pumps?',
		note: 'For example: dose every X minutes for Y seconds.',
	},
	{
		id: '3',
		prompt: 'For each float switch, how should we interpret the signal?',
		note: 'For example: low float on means stop pump, alarm float on means raise alarm, high float on means emergency clear-down.',
	},
	{
		id: '4',
		prompt: 'If a tank goes high level, what should the system do right away?',
		note: 'For example: ignore the schedule and run pump 1, run both pumps, keep alarming until manually cleared, and so on.',
	},
	{
		id: '5',
		prompt:
			'How long should we wait for proof after turning on a pump or blower?',
		note: 'For example: 5 seconds for a blower, 15 seconds for a pump, or different values by stage.',
	},
	{
		id: '6',
		prompt: 'How should the paired pumps behave?',
		note: 'For example: alternate each run, or run simultaneously.',
	},
	{
		id: '7',
		prompt:
			'What is the deal with the 2000 GALLON HOLDING/DOSING TANK in the middle?',
		note: 'some ambiguity in the plan, does it have its own pump or not? elevation name doesnt match the plan view name',
	},
	{
		id: '8',
		prompt: 'What is supposed to bring each ATU blower on?',
		note: 'do they run all the time during normal ATU operation',
	},
	{
		id: '9',
		prompt:
			'Are BSZ-205 through BSZ-212 definitely outputs and labeled correctly?',
		note: 'Or are they meant to be the blower output relays to turn the blowers on?',
	},
	{
		id: '10',
		prompt: 'On reboot or power cut:',
		note: 'We will reread inputs, wait for a delay, then resume automatic mode, that sound ok?',
	},
	{
		id: '11',
		prompt: 'How should the final zoning / disposal stage work?',
		note: 'Any specific rules here?',
	},
	{
		id: '12',
		prompt: 'What do you want the dashboard to show?',
		note: 'Just the state of each input and output (High, low) and logs of things changing, alerts etc?',
	},
	{
		id: '13',
		prompt: 'How granular do you want dashboard data?',
		note: 'For instance: send live state every 30 seconds, alarm events immediately, and summaries every 15 minutes.',
	},
];

const makeSpareRows = (slot, start, end, board, address = '-') =>
	Array.from({ length: end - start + 1 }, (_, index) => [
		'spare',
		'spare',
		String(slot),
		String(start + index),
		board,
		address,
	]);

export const PINOUT_GROUPS = [
	{
		type: 'DI',
		rows: [
			[
				'LLS-01',
				'Low level switch dosing',
				'0',
				'1',
				'ESP32 digital input bus',
				'-',
			],
			[
				'ALS-01',
				'Alarm level switch dosing',
				'0',
				'2',
				'ESP32 digital input bus',
				'-',
			],
			[
				'HLS-01',
				'High level switch dosing',
				'0',
				'3',
				'ESP32 digital input bus',
				'-',
			],
			[
				'LLS-02',
				'Low level switch pump',
				'0',
				'4',
				'ESP32 digital input bus',
				'-',
			],
			[
				'ALS-02',
				'Alarm level switch pump',
				'0',
				'5',
				'ESP32 digital input bus',
				'-',
			],
			[
				'HLS-02',
				'High level switch pump',
				'0',
				'6',
				'ESP32 digital input bus',
				'-',
			],
			...makeSpareRows(0, 7, 8, 'ESP32 digital input bus'),
			[
				'FTQ-03',
				'Dosing flow pulse',
				'1',
				'0',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'FTQ-04',
				'Effluent out flow pulse',
				'1',
				'1',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'FTQ-05',
				'Effluent return flow pulse',
				'1',
				'2',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-06',
				'Blower 1 pressure switch',
				'1',
				'3',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-07',
				'Blower 2 pressure switch',
				'1',
				'4',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-08',
				'Blower 3 pressure switch',
				'1',
				'5',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-09',
				'Blower 4 pressure switch',
				'1',
				'6',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-10',
				'Blower 5 pressure switch',
				'1',
				'7',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-11',
				'Blower 6 pressure switch',
				'1',
				'8',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-12',
				'Blower 7 pressure switch',
				'1',
				'9',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			[
				'PS-13',
				'Blower 8 pressure switch',
				'1',
				'10',
				'MCP23017 IO Expansion Board',
				'0x20',
			],
			...makeSpareRows(1, 11, 15, 'MCP23017 IO Expansion Board', '0x20'),
		],
	},
	{
		type: 'DO',
		rows: [
			['PSZ-201', 'Dosing Pump 1', '2', '1', 'ESP32 relay output bus', '-'],
			['PSZ-202', 'Dosing Pump 2', '2', '2', 'ESP32 relay output bus', '-'],
			['PSZ-203', 'Effluent Pump 1', '2', '3', 'ESP32 relay output bus', '-'],
			['PSZ-204', 'Effluent Pump 2', '2', '4', 'ESP32 relay output bus', '-'],
			...makeSpareRows(2, 5, 8, 'ESP32 relay output bus'),
			[
				'BSZ-205',
				'Blower Pressure Switch 1',
				'3',
				'0',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-206',
				'Blower Pressure Switch 2',
				'3',
				'1',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-207',
				'Blower Pressure Switch 3',
				'3',
				'2',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-208',
				'Blower Pressure Switch 4',
				'3',
				'3',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-209',
				'Blower Pressure Switch 5',
				'3',
				'4',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-210',
				'Blower Pressure Switch 6',
				'3',
				'5',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-211',
				'Blower Pressure Switch 7',
				'3',
				'6',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			[
				'BSZ-212',
				'Blower Pressure Switch 8',
				'3',
				'7',
				'MCP23017 IO Expansion Board',
				'0x21',
			],
			...makeSpareRows(3, 8, 15, 'MCP23017 IO Expansion Board', '0x21'),
			[
				'VXY-213',
				'Zone Control Valve 1',
				'4',
				'0',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-214',
				'Zone Control Valve 2',
				'4',
				'1',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-215',
				'Zone Control Valve 3',
				'4',
				'2',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-216',
				'Zone Control Valve 4',
				'4',
				'3',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-217',
				'Zone Control Valve 5',
				'4',
				'4',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-218',
				'Zone Control Valve 6',
				'4',
				'5',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-219',
				'Zone Control Valve 7',
				'4',
				'6',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-220',
				'Zone Control Valve 8',
				'4',
				'7',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-221',
				'Zone Control Valve 9',
				'4',
				'8',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-222',
				'Zone Control Valve 10',
				'4',
				'9',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-223',
				'Zone Control Valve 11',
				'4',
				'10',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			[
				'VXY-224',
				'Zone Control Valve 12',
				'4',
				'11',
				'MCP23017 IO Expansion Board',
				'0x22',
			],
			...makeSpareRows(4, 12, 15, 'MCP23017 IO Expansion Board', '0x22'),
		],
	},
	{
		type: 'AI',
		rows: [
			[
				'PT-101',
				'Effluent upstream pressure',
				'5',
				'0',
				'ADS1115 ADC Expansion Board',
				'0x48',
			],
			[
				'PT-102',
				'Effluent downstream pressure',
				'5',
				'1',
				'ADS1115 ADC Expansion Board',
				'0x48',
			],
			[
				'PT-103',
				'Effluent return pressure',
				'5',
				'2',
				'ADS1115 ADC Expansion Board',
				'0x48',
			],
			[
				'PT-104',
				'Users assign pressure 1',
				'5',
				'3',
				'ADS1115 ADC Expansion Board',
				'0x48',
			],
			[
				'PT-105',
				'Users assign pressure 2',
				'6',
				'0',
				'ADS1115 ADC Expansion Board',
				'0x49',
			],
			[
				'PT-106',
				'Users assign pressure 3',
				'6',
				'1',
				'ADS1115 ADC Expansion Board',
				'0x49',
			],
			[
				'PT-107',
				'Users assign pressure 4',
				'6',
				'2',
				'ADS1115 ADC Expansion Board',
				'0x49',
			],
			[
				'PT-108',
				'Users assign pressure 5',
				'6',
				'3',
				'ADS1115 ADC Expansion Board',
				'0x49',
			],
			...makeSpareRows(7, 0, 3, 'ADS1115 ADC Expansion Board', '0x4A'),
		],
	},
];

export function getIoLabel(code) {
	if (code === 'LLS-01') return 'low level switch';
	if (code === 'ALS-01') return 'alarm level switch';
	if (code === 'HLS-01') return 'high level switch';
	if (code === 'LLS-02') return 'low level switch';
	if (code === 'ALS-02') return 'alarm level switch';
	if (code === 'HLS-02') return 'high level switch';
	if (code === 'FTQ-03') return 'flow pulse';
	if (code === 'FTQ-04') return 'outflow pulse';
	if (code === 'FTQ-05') return 'return flow pulse';
	if (code === 'PT-101') return 'upstream pressure';
	if (code === 'PT-102') return 'downstream pressure';
	if (code === 'PT-103') return 'return pressure';

	const psz = code.match(/^PSZ-(\d+)$/);
	if (psz) {
		const value = Number(psz[1]);
		if (value === 201) return 'dosing pump 1';
		if (value === 202) return 'dosing pump 2';
		if (value === 203) return 'effluent pump 1';
		if (value === 204) return 'effluent pump 2';
	}

	const bsz = code.match(/^BSZ-(\d+)$/);
	if (bsz) {
		return `blower ${Number(bsz[1]) - 204}`;
	}

	const ps = code.match(/^PS-(\d+)$/);
	if (ps) {
		return `blower pressure switch ${Number(ps[1]) - 5}`;
	}

	const vxy = code.match(/^VXY-(\d+)$/);
	if (vxy) {
		return `zone control valve ${Number(vxy[1]) - 212}`;
	}

	return 'field device';
}
