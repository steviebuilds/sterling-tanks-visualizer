import './App.css'

const STAGES = [
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
    inputs: ['PS-06', 'PS-07', 'PS-08', 'PS-09', 'PS-10', 'PS-11', 'PS-12', 'PS-13'],
    outputs: ['BSZ-205', 'BSZ-206', 'BSZ-207', 'BSZ-208', 'BSZ-209', 'BSZ-210', 'BSZ-211', 'BSZ-212'],
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
    outputs: ['VXY-213', 'VXY-214', 'VXY-215', 'VXY-216', 'VXY-217', 'VXY-218', 'VXY-219', 'VXY-220', 'VXY-221', 'VXY-222', 'VXY-223', 'VXY-224'],
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
]

const RULES = [
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
]

const CLARIFYING_QUESTIONS = [
  'What is the control scan rate for the ESP32: how often should digital inputs, analog pressures, and pulse counters be sampled and evaluated?',
  'What is the exact time-dose schedule for PSZ-201 / PSZ-202 and PSZ-203 / PSZ-204: interval, run duration, quiet hours, and any seasonal or operator-adjustable settings?',
  'For each float input (LLS, ALS, HLS), what electrical state means normal vs active, and which specific output actions should each state trigger?',
  'When a high-level input goes active, what exact forced-clear-down behavior is required: run lead pump only, run both pumps, ignore schedule, latch alarm, and when does that mode exit?',
  'How long after commanding a pump or blower on should the controller wait for FTQ flow proof or PS airflow proof before declaring fault?',
  'Should the paired pumps alternate lead / lag on each cycle, on each day, or only after a fault, and what should happen if the lead unit fails proof?',
  'Does the 2000 GALLON HOLDING/DOSING TANK remain a passive buffer stage, or will it eventually have dedicated floats and pump logic?',
  'What exact condition commands each BSZ blower output on in the ATU stage, and are BSZ-205..212 truly outputs or mislabeled pressure-switch points?',
  'What startup, reboot, and power-fail behavior is required: which outputs must default off, what permissives must be re-proven, and should alarms latch across restart?',
  'What final disposal / zoning behavior is required when the chlorinator and disposal area are active, including zone-selection rules and any chlorinator enable interlock?',
  'What telemetry does the dashboard actually need from the ESP32: raw inputs, output states, calculated states, alarm events, runtime counters, pressure readings, and flow totals?',
  'Which values should be sent as live state versus periodic summaries versus event logs, and what update frequency is required for each?',
  'What historical data needs to be retained locally on the controller if the API is unavailable, and how long should it buffer before replay?',
  'What are the required identifiers in the API payload: site, controller, tank / ATU / pump instance, alarm code, timestamp, and firmware version?',
  'Which values are for operator visibility only versus values that must drive dashboard alarms, trends, and maintenance warnings?',
  'What payload contract does the dashboard expect: units, enum names, boolean conventions, quality flags, retry behavior, and acknowledgement fields?',
]

const makeSpareRows = (slot, start, end, board, address = '-') =>
  Array.from({ length: end - start + 1 }, (_, index) => [
    'spare',
    'spare',
    String(slot),
    String(start + index),
    board,
    address,
  ])

const PINOUT_GROUPS = [
  {
    type: 'DI',
    rows: [
      ['LLS-01', 'Low level switch dosing', '0', '1', 'ESP32 digital input bus', '-'],
      ['ALS-01', 'Alarm level switch dosing', '0', '2', 'ESP32 digital input bus', '-'],
      ['HLS-01', 'High level switch dosing', '0', '3', 'ESP32 digital input bus', '-'],
      ['LLS-02', 'Low level switch pump', '0', '4', 'ESP32 digital input bus', '-'],
      ['ALS-02', 'Alarm level switch pump', '0', '5', 'ESP32 digital input bus', '-'],
      ['HLS-02', 'High level switch pump', '0', '6', 'ESP32 digital input bus', '-'],
      ...makeSpareRows(0, 7, 8, 'ESP32 digital input bus'),
      ['FTQ-03', 'Dosing flow pulse', '1', '0', 'MCP23017 IO Expansion Board', '0x20'],
      ['FTQ-04', 'Effluent out flow pulse', '1', '1', 'MCP23017 IO Expansion Board', '0x20'],
      ['FTQ-05', 'Effluent return flow pulse', '1', '2', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-06', 'Blower 1 pressure switch', '1', '3', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-07', 'Blower 2 pressure switch', '1', '4', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-08', 'Blower 3 pressure switch', '1', '5', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-09', 'Blower 4 pressure switch', '1', '6', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-10', 'Blower 5 pressure switch', '1', '7', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-11', 'Blower 6 pressure switch', '1', '8', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-12', 'Blower 7 pressure switch', '1', '9', 'MCP23017 IO Expansion Board', '0x20'],
      ['PS-13', 'Blower 8 pressure switch', '1', '10', 'MCP23017 IO Expansion Board', '0x20'],
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
      ['BSZ-205', 'Blower Pressure Switch 1', '3', '0', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-206', 'Blower Pressure Switch 2', '3', '1', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-207', 'Blower Pressure Switch 3', '3', '2', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-208', 'Blower Pressure Switch 4', '3', '3', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-209', 'Blower Pressure Switch 5', '3', '4', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-210', 'Blower Pressure Switch 6', '3', '5', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-211', 'Blower Pressure Switch 7', '3', '6', 'MCP23017 IO Expansion Board', '0x21'],
      ['BSZ-212', 'Blower Pressure Switch 8', '3', '7', 'MCP23017 IO Expansion Board', '0x21'],
      ...makeSpareRows(3, 8, 15, 'MCP23017 IO Expansion Board', '0x21'),
      ['VXY-213', 'Zone Control Valve 1', '4', '0', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-214', 'Zone Control Valve 2', '4', '1', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-215', 'Zone Control Valve 3', '4', '2', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-216', 'Zone Control Valve 4', '4', '3', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-217', 'Zone Control Valve 5', '4', '4', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-218', 'Zone Control Valve 6', '4', '5', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-219', 'Zone Control Valve 7', '4', '6', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-220', 'Zone Control Valve 8', '4', '7', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-221', 'Zone Control Valve 9', '4', '8', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-222', 'Zone Control Valve 10', '4', '9', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-223', 'Zone Control Valve 11', '4', '10', 'MCP23017 IO Expansion Board', '0x22'],
      ['VXY-224', 'Zone Control Valve 12', '4', '11', 'MCP23017 IO Expansion Board', '0x22'],
      ...makeSpareRows(4, 12, 15, 'MCP23017 IO Expansion Board', '0x22'),
    ],
  },
  {
    type: 'AI',
    rows: [
      ['PT-101', 'Effluent upstream pressure', '5', '0', 'ADS1115 ADC Expansion Board', '0x48'],
      ['PT-102', 'Effluent downstream pressure', '5', '1', 'ADS1115 ADC Expansion Board', '0x48'],
      ['PT-103', 'Effluent return pressure', '5', '2', 'ADS1115 ADC Expansion Board', '0x48'],
      ['PT-104', 'Users assign pressure 1', '5', '3', 'ADS1115 ADC Expansion Board', '0x48'],
      ['PT-105', 'Users assign pressure 2', '6', '0', 'ADS1115 ADC Expansion Board', '0x49'],
      ['PT-106', 'Users assign pressure 3', '6', '1', 'ADS1115 ADC Expansion Board', '0x49'],
      ['PT-107', 'Users assign pressure 4', '6', '2', 'ADS1115 ADC Expansion Board', '0x49'],
      ['PT-108', 'Users assign pressure 5', '6', '3', 'ADS1115 ADC Expansion Board', '0x49'],
      ...makeSpareRows(7, 0, 3, 'ADS1115 ADC Expansion Board', '0x4A'),
    ],
  },
]

function getIoLabel(code) {
  if (code === 'LLS-01') return 'low level switch'
  if (code === 'ALS-01') return 'alarm level switch'
  if (code === 'HLS-01') return 'high level switch'
  if (code === 'LLS-02') return 'low level switch'
  if (code === 'ALS-02') return 'alarm level switch'
  if (code === 'HLS-02') return 'high level switch'
  if (code === 'FTQ-03') return 'flow pulse'
  if (code === 'FTQ-04') return 'outflow pulse'
  if (code === 'FTQ-05') return 'return flow pulse'
  if (code === 'PT-101') return 'upstream pressure'
  if (code === 'PT-102') return 'downstream pressure'
  if (code === 'PT-103') return 'return pressure'

  const psz = code.match(/^PSZ-(\d+)$/)
  if (psz) {
    const value = Number(psz[1])
    if (value === 201) return 'dosing pump 1'
    if (value === 202) return 'dosing pump 2'
    if (value === 203) return 'effluent pump 1'
    if (value === 204) return 'effluent pump 2'
  }

  const bsz = code.match(/^BSZ-(\d+)$/)
  if (bsz) {
    return `blower ${Number(bsz[1]) - 204}`
  }

  const ps = code.match(/^PS-(\d+)$/)
  if (ps) {
    return `blower pressure switch ${Number(ps[1]) - 5}`
  }

  const vxy = code.match(/^VXY-(\d+)$/)
  if (vxy) {
    return `zone control valve ${Number(vxy[1]) - 212}`
  }

  return 'field device'
}

function CodeTag({ code }) {
  const label = getIoLabel(code)
  return (
    <span className="code-tag">
      {code}
      <span className="code-tag-detail">({label})</span>
    </span>
  )
}

function TagList({ items }) {
  if (!items?.length) return <span className="muted-copy">None shown in current pin list.</span>
  return (
    <div className="tag-list">
      {items.map((item) => (
        <CodeTag key={item} code={item} />
      ))}
    </div>
  )
}

function StageDiagram({ kind }) {
  if (kind === 'pretreatment' || kind === 'buffer' || kind === 'pump-tank-1' || kind === 'pump-tank-2') {
    const colorMap = {
      pretreatment: '#4759d7',
      buffer: '#64748b',
      'pump-tank-1': '#a46a1e',
      'pump-tank-2': '#0f766e',
    }
    const fillMap = {
      pretreatment: '#8bb7f1',
      buffer: '#b8c2d1',
      'pump-tank-1': '#ffd85c',
      'pump-tank-2': '#73d8b4',
    }
    const showFloats = kind === 'pump-tank-1' || kind === 'pump-tank-2'
    const labels = kind === 'pump-tank-1'
      ? ['Inlet', 'High float', 'Alarm float', 'Outlet', 'Pump-on float']
      : kind === 'pump-tank-2'
        ? ['Inlet', 'High float', 'Alarm float', 'Outlet', 'Pump-on float']
        : ['Inlet', 'Outlet']

    return (
      <svg className="diagram-svg" viewBox="0 0 280 180" role="img" aria-label={`${kind} diagram`}>
        <rect x="28" y="24" width="88" height="130" rx="30" className="tank-shape" style={{ '--tank-stroke': colorMap[kind] }} />
        <rect x="42" y="98" width="60" height="44" rx="18" className="tank-liquid" style={{ '--tank-fill': fillMap[kind] }} />
        <line x1="114" y1="56" x2="152" y2="56" className="diagram-line" />
        <line x1="114" y1="95" x2="152" y2="95" className="diagram-line" />
        <circle cx="114" cy="56" r="5" className="diagram-node" />
        <circle cx="114" cy="95" r="5" className="diagram-node" />
        <text x="168" y="61" className="diagram-label">{labels[0]}</text>
        <text x="168" y="100" className="diagram-label">{labels[showFloats ? 3 : 1]}</text>

        {showFloats ? (
          <>
            <line x1="114" y1="46" x2="152" y2="32" className="diagram-line" />
            <line x1="114" y1="80" x2="152" y2="70" className="diagram-line" />
            <line x1="114" y1="110" x2="152" y2="110" className="diagram-line" />
            <circle cx="114" cy="46" r="5" className="diagram-node muted" />
            <circle cx="114" cy="80" r="5" className="diagram-node muted" />
            <circle cx="114" cy="110" r="5" className="diagram-node active" />
            <text x="168" y="36" className="diagram-label muted">{labels[1]}</text>
            <text x="168" y="75" className="diagram-label muted">{labels[2]}</text>
            <text x="168" y="115" className="diagram-label">{labels[4]}</text>
          </>
        ) : null}
      </svg>
    )
  }

  if (kind === 'atu') {
    return (
      <svg className="diagram-svg" viewBox="0 0 340 180" role="img" aria-label="ATU diagram">
        <rect x="28" y="38" width="120" height="92" rx="22" className="atu-box" />
        <circle cx="74" cy="84" r="18" className="blower-ring" />
        <circle cx="110" cy="84" r="18" className="blower-ring" />
        <line x1="148" y1="70" x2="210" y2="70" className="diagram-line" />
        <line x1="148" y1="98" x2="210" y2="98" className="diagram-line" />
        <text x="220" y="74" className="diagram-label">Blower outputs</text>
        <text x="220" y="102" className="diagram-label muted">Pressure proof</text>
      </svg>
    )
  }

  if (kind === 'chlorinator') {
    return (
      <svg className="diagram-svg" viewBox="0 0 280 180" role="img" aria-label="chlorinator diagram">
        <line x1="20" y1="92" x2="68" y2="92" className="diagram-line thick" />
        <rect x="68" y="66" width="132" height="52" rx="24" className="chlorinator-box" />
        <line x1="200" y1="92" x2="252" y2="92" className="diagram-line thick" />
        <text x="94" y="90" className="diagram-label dark">
          <tspan x="94" dy="0">Liquid</tspan>
          <tspan x="94" dy="12">chlorinator</tspan>
        </text>
        <text x="68" y="132" className="diagram-label muted">Zone valves and pressure checks downstream</text>
      </svg>
    )
  }

  return (
    <svg className="diagram-svg" viewBox="0 0 280 180" role="img" aria-label="disposal diagram">
      <rect x="34" y="58" width="188" height="76" rx="18" className="disposal-box" />
      <line x1="64" y1="88" x2="192" y2="88" className="field-line" />
      <line x1="84" y1="76" x2="64" y2="100" className="field-line" />
      <line x1="128" y1="76" x2="108" y2="100" className="field-line" />
      <line x1="172" y1="76" x2="152" y2="100" className="field-line" />
      <text x="64" y="126" className="diagram-label dark">Effluent disposal area</text>
    </svg>
  )
}

function StageCard({ stage }) {
  return (
    <article className="stage-card">
      <div className="stage-card-head">
        <div className="stage-card-title-row">
          <h3>{stage.title}</h3>
          {stage.countChip ? <span className="stage-count-chip">{stage.countChip}</span> : null}
        </div>
        <div>
          <p>{stage.summary}</p>
        </div>
      </div>

      <div className="stage-card-body">
        <StageDiagram kind={stage.kind} />

        <div className="stage-card-copy">
          <div className="copy-block">
            <span className="label">Inputs</span>
            <TagList items={stage.inputs} />
          </div>

          <div className="copy-block">
            <span className="label">Outputs</span>
            <TagList items={stage.outputs} />
          </div>

          {stage.pressures?.length ? (
            <div className="copy-block">
              <span className="label">Pressures</span>
              <TagList items={stage.pressures} />
            </div>
          ) : null}

          <div className="copy-block">
            <span className="label">How it works</span>
            <ul className="bullet-list">
              {stage.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </article>
  )
}

function StageSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="eyebrow">Control logic by stage</span>
      </div>
      <div className="stage-grid">
        {STAGES.map((stage, index) => (
          <div key={stage.id} className="stage-sequence-item">
            <StageCard stage={stage} />
            {index < STAGES.length - 1 ? (
              <div className="stage-sequence-arrow" aria-hidden="true">
                <div className="stage-sequence-line" />
                <span>{stage.transfer}</span>
                <div className="stage-sequence-glyph">↓</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function LogicSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="eyebrow">Simple if / then logic</span>
      </div>
      <div className="logic-table">
        <div className="logic-row logic-head">
          <div>Stage</div>
          <div>If this happens</div>
          <div>Then do this</div>
        </div>
        {RULES.map((rule) => (
          <div key={`${rule.stage}-${rule.when}`} className="logic-row">
            <div>{rule.stage}</div>
            <div>{rule.when}</div>
            <div>{rule.then}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PinoutSection() {
  return (
    <section className="section">
      <div className="section-head">
        <span className="eyebrow">Pinout table</span>
      </div>

      <div className="pinout-stack">
        {PINOUT_GROUPS.map((group) => (
          <div key={group.type} className="pinout-block">
            <div className="pinout-group-head">
              <span className="eyebrow">{group.type}</span>
            </div>

            <div className="pinout-scroll">
              <table className="pinout-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Slot</th>
                    <th>Channel</th>
                    <th>Board</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map(([id, description, slot, channel, board, address], index) => (
                    <tr key={`${group.type}-${id}-${slot}-${channel}-${index}`}>
                      <td><span className="pinout-id">{id}</span></td>
                      <td>{description}</td>
                      <td>{slot}</td>
                      <td>{channel}</td>
                      <td>{board}</td>
                      <td>{address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Simple tank flow</h1>
        <p>The best current description of the system flow and control logic, using the plan labels exactly as shown.</p>
      </header>

      <StageSection />
      <LogicSection />
      <PinoutSection />

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Clarifying questions</span>
        </div>
        <div className="note-box">
          <ul className="bullet-list">
            {CLARIFYING_QUESTIONS.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default App
