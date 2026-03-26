import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const STAGE_SEQUENCE = [
  {
    id: 'trash',
    name: 'Trash Tank',
    alias: 'Pre-treatment',
    summary: 'Gravity inlet hold and gravity pass-through',
    position: [-14, 0, 0],
    radius: 1.9,
    height: 2.2,
    bodyColor: '#4f46e5',
    waterColor: '#60a5fa',
    rlTop: 245,
    rlBottom: 239,
    rlBands: [
      { rl: 245, label: 'Top level' },
      { rl: 243, label: 'Outlet port' },
      { rl: 239, label: 'Bottom' },
    ],
    ports: {
      inlet: 244.7,
      outlet: 243.3,
    },
    io: [
      { label: 'Influent inlet', alias: 'Inlet / building drain' },
      { label: 'Outlet', alias: 'Gravity transfer to Dosing / Equalization' },
    ],
    floatPorts: [],
  },
  {
    id: 'dosing',
    name: 'Dosing / Equalization',
    alias: 'Pump-on and dose conditioning',
    summary: 'Collects transfer from trash tank and conditions dosage',
    position: [-3, 0, 0],
    radius: 2.05,
    height: 2.35,
    bodyColor: '#f59e0b',
    waterColor: '#fef08a',
    rlTop: 243,
    rlBottom: 239.1,
    rlBands: [
      { rl: 243, label: 'Post tank RL (~243)' },
      { rl: 241.5, label: 'Pump-on float band' },
      { rl: 239.1, label: 'Bottom' },
    ],
    ports: {
      inlet: 243,
      outlet: 241.8,
    },
    io: [
      { label: 'Influent', alias: 'From Trash Tank gravity port' },
      { label: 'Effluent', alias: 'To ATU / Aeration' },
      { label: 'Dose pumps', alias: 'PSZ-201 / PSZ-202' },
      { label: 'Flow pulse', alias: 'FTQ-03' },
    ],
    floatPorts: [
      { key: 'lls', label: 'LLS-02', alias: 'Pump-on float', rl: 241.2 },
      { key: 'als', label: 'ALS-02', alias: 'Alarm level switch', rl: 242.1 },
      { key: 'hls', label: 'HLS-02', alias: 'High level float', rl: 242.9 },
    ],
  },
  {
    id: 'atu',
    name: 'ATU / Aeration',
    alias: 'Aeration and biological treatment',
    summary: 'Treatment train with blower set + pressure check',
    position: [8, 0, 0],
    radius: 2.0,
    height: 2.25,
    bodyColor: '#8b5cf6',
    waterColor: '#a78bfa',
    rlTop: 242,
    rlBottom: 239.2,
    rlBands: [
      { rl: 242, label: 'Post dose RL (~242)' },
      { rl: 240.4, label: 'Aeration level band' },
      { rl: 239.2, label: 'Bottom' },
    ],
    ports: {
      inlet: 242,
      outlet: 241,
    },
    io: [
      { label: 'Influent', alias: 'From Dosing / Equalization' },
      { label: 'Effluent', alias: 'To Pump + Chlorination' },
      { label: 'Blowers', alias: 'BSZ-205..212' },
      { label: 'Pressure switches', alias: 'PS-06..13' },
    ],
    floatPorts: [],
  },
  {
    id: 'pump',
    name: 'Pump + Chlorination',
    alias: 'Final tank and discharge booster',
    summary: 'Checks pump and clear-down conditions before discharge',
    position: [20.5, 0, 0],
    radius: 2.05,
    height: 2.3,
    bodyColor: '#10b981',
    waterColor: '#6ee7b7',
    rlTop: 241,
    rlBottom: 239,
    rlBands: [
      { rl: 241, label: 'Pump tank top (~241)' },
      { rl: 240.1, label: 'Pump-on float band' },
      { rl: 239, label: 'Bottom (~239)' },
    ],
    ports: {
      inlet: 240.5,
      outlet: 239.3,
    },
    io: [
      { label: 'Influent', alias: 'From ATU / Aeration' },
      { label: 'Discharge', alias: 'Pump discharge to disposal field' },
      { label: 'Pump pair', alias: 'PSZ-203 / PSZ-204' },
      { label: 'Return pulse', alias: 'FTQ-05' },
    ],
    floatPorts: [
      { key: 'lls', label: 'LLS-01', alias: 'Pump-on float', rl: 239.4 },
      { key: 'als', label: 'ALS-01', alias: 'Alarm level switch', rl: 240.1 },
      { key: 'hls', label: 'HLS-01', alias: 'High level float', rl: 240.8 },
    ],
  },
  {
    id: 'hold',
    name: 'Holding / Distribution',
    alias: 'Optional terminal vessel',
    summary: 'Optional terminal holding/distribution stage (not core yet)',
    position: [31, 0.1, -0.4],
    radius: 1.5,
    height: 1.8,
    bodyColor: '#64748b',
    waterColor: '#94a3b8',
    rlTop: 240,
    rlBottom: 238,
    rlBands: [
      { rl: 240, label: 'Holding RL (approx)' },
      { rl: 239, label: 'Bottom' },
    ],
    ports: {
      inlet: 240,
      outlet: 239.2,
    },
    io: [
      { label: 'Optional inlet', alias: 'From Pump + Chlorination' },
      { label: 'Optional outlet', alias: 'Distribution branch / field loop' },
    ],
    floatPorts: [],
  },
]

const SCENARIOS = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'Nominal staged flow with actuators available and no protection lockouts.',
    tankStates: {
      trash: {
        level: 0.52,
        mode: 'pass-through',
        actor: ['Flow', 'Ready'],
      },
      dosing: {
        level: 0.52,
        mode: 'Demand dosing',
        floats: { lls: true, als: false, hls: false },
        actuators: [
          { name: 'Dosing pumps', state: 'RUNNING', tech: 'PSZ-201 / PSZ-202' },
        ],
      },
      atu: {
        level: 0.55,
        mode: 'Aeration active',
        actuators: [
          { name: 'Blowers', state: 'RUNNING', tech: 'BSZ-205..212' },
        ],
      },
      pump: {
        level: 0.5,
        mode: 'Discharge cycle',
        floats: { lls: true, als: false, hls: false },
        actuators: [
          { name: 'Effluent pumps', state: 'RUNNING', tech: 'PSZ-203 / PSZ-204' },
        ],
      },
      hold: {
        level: 0.38,
        mode: 'Optional storage',
      },
    },
  },
  {
    id: 'low',
    label: 'Low level',
    description: 'Pump-on floats deasserted. Demonstrates lockout rule.',
    tankStates: {
      trash: {
        level: 0.26,
        mode: 'pass-through only',
        actor: ['Flow', 'Low'],
      },
      dosing: {
        level: 0.2,
        mode: 'Under-run hold',
        floats: { lls: false, als: false, hls: false },
        actuators: [
          { name: 'Dosing pumps', state: 'BLOCKED', reason: 'Pump-on float OFF', tech: 'PSZ-201 / PSZ-202' },
        ],
      },
      atu: {
        level: 0.18,
        mode: 'Demand suppressed upstream',
        actuators: [
          { name: 'Blowers', state: 'IDLE', reason: 'No safe feed window', tech: 'BSZ-205..212' },
        ],
      },
      pump: {
        level: 0.19,
        mode: 'Demand suppressed',
        floats: { lls: false, als: false, hls: false },
        actuators: [
          { name: 'Effluent pumps', state: 'BLOCKED', reason: 'Pump-on float OFF', tech: 'PSZ-203 / PSZ-204' },
        ],
      },
      hold: {
        level: 0.22,
        mode: 'Optional storage',
      },
    },
  },
  {
    id: 'high',
    label: 'High level / Forced clear-down',
    description: 'High float active. Clear-down logic takes precedence over normal dosing/pumping.',
    tankStates: {
      trash: {
        level: 0.74,
        mode: 'Surge accepted',
        actor: ['Flow', 'High'],
      },
      dosing: {
        level: 0.88,
        mode: 'Overflow prevention',
        floats: { lls: true, als: true, hls: true },
        actuators: [
          { name: 'Dosing pumps', state: 'FORCED CLEAR-DOWN', reason: 'High float active', tech: 'PSZ-201 / PSZ-202' },
        ],
      },
      atu: {
        level: 0.85,
        mode: 'Clear-down support',
        actuators: [
          { name: 'Blowers', state: 'HOLD', reason: 'Upstream high-level priority', tech: 'BSZ-205..212' },
        ],
      },
      pump: {
        level: 0.9,
        mode: 'Forced clear-down',
        floats: { lls: false, als: true, hls: true },
        actuators: [
          { name: 'Effluent pumps', state: 'FORCED CLEAR-DOWN', reason: 'High float active', tech: 'PSZ-203 / PSZ-204' },
        ],
      },
      hold: {
        level: 0.6,
        mode: 'Optional storage fill',
      },
    },
  },
]

const LINKS = [
  { from: 'trash', to: 'dosing', optional: false },
  { from: 'dosing', to: 'atu', optional: false },
  { from: 'atu', to: 'pump', optional: false },
  { from: 'pump', to: 'hold', optional: true },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function rlToY(rl, stage) {
  const span = stage.rlTop - stage.rlBottom
  if (span === 0) return 0
  const ratio = clamp((rl - stage.rlBottom) / span, 0, 1)
  return -stage.height / 2 + ratio * stage.height
}

function getPortPosition(stage, key) {
  if (!stage.ports || !stage.ports[key]) {
    return new THREE.Vector3(...stage.position)
  }
  return new THREE.Vector3(stage.position[0], rlToY(stage.ports[key], stage), stage.position[2])
}

function TankNode({ stage, state }) {
  const fill = clamp(state?.level ?? 0.35, 0.02, 0.98)
  const floatState = state?.floats || null

  return (
    <group position={stage.position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[stage.radius, stage.radius * 1.08, stage.height, 42]} />
        <meshPhysicalMaterial
          color={stage.bodyColor}
          metalness={0.05}
          roughness={0.45}
          transparent
          opacity={0.38}
        />
      </mesh>

      <mesh position={[0, -stage.height / 2 + fill * stage.height / 2, 0]}>
        <cylinderGeometry args={[stage.radius * 0.95, stage.radius * 0.95, fill * stage.height * 0.98, 38]} />
        <meshPhysicalMaterial
          color={stage.waterColor}
          metalness={0.05}
          roughness={0.3}
          transparent
          opacity={0.72}
        />
      </mesh>

      {stage.rlBands.map((band) => {
        const y = rlToY(band.rl, stage)
        return (
          <group key={`${stage.id}-${band.rl}`}>
            <mesh position={[0, y, 0]}>
              <cylinderGeometry args={[stage.radius * 1.01, stage.radius * 1.01, 0.075, 40]} />
              <meshStandardMaterial
                color={band.label.includes('Top') ? '#fcd34d' : '#e2e8f0'}
                transparent
                opacity={band.label.includes('Top') ? 0.85 : 0.55}
              />
            </mesh>
            <Html position={[stage.radius * 1.28, y + 0.08, 0]} center>
              <div className="rl-badge" title={`Reference level from source docs${stage.id !== 'hold' ? ' (approx where not explicit)' : ''}`}>
                +RL {band.rl.toFixed(1)}
                <span className="muted">{band.label}</span>
              </div>
            </Html>
          </group>
        )
      })}

      {stage.floatPorts.map((floatPoint) => {
        const value = floatState ? floatState[floatPoint.key] : false
        const y = rlToY(floatPoint.rl, stage)
        return (
          <group key={floatPoint.key} position={[0, y, -stage.radius * 0.58]}>
            <mesh>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial
                color={value ? '#22c55e' : '#94a3b8'}
                emissive={value ? '#052e16' : '#1f2937'}
              />
            </mesh>
            <Html center distanceFactor={16} position={[-0.03, -0.22, stage.radius * 0.35]}>
              <span className={value ? 'float-chip on' : 'float-chip off'} title={floatPoint.alias}>
                {floatPoint.label}: {value ? 'ON' : 'OFF'}
              </span>
            </Html>
          </group>
        )
      })}

      {(state?.actuators || []).map((actuator, idx) => {
        const y = stage.height / 2 + 0.36 + idx * 0.28
        return (
          <group key={`${stage.id}-act-${idx}`} position={[stage.radius * 0.22, y, stage.radius * 0.42]}>
            <mesh>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial
                color={actuator.state.includes('RUNNING') ? '#34d399' : actuator.state.includes('IDLE') ? '#64748b' : '#f97316'}
              />
            </mesh>
            <Html center distanceFactor={18} position={[0, 0.12, stage.radius * 0.28]}>
              <span
                className={`actuator-chip ${actuator.state.includes('RUNNING') ? 'on' : actuator.state.includes('IDLE') ? 'idle' : 'force'}`}
                title={actuator.tech}
              >
                {actuator.name}: {actuator.state}
                {actuator.reason ? ` (${actuator.reason})` : ''}
              </span>
            </Html>
          </group>
        )
      })}

      <Html center distanceFactor={14} position={[0, stage.height * 0.65, 0]}>
        <div className="tank-label">
          <div className="tank-title">{stage.name}</div>
          <div>{stage.alias}</div>
          <div className="tank-sub">{state?.mode || stage.summary}</div>
          <div className="tank-meta">Level: {Math.round(fill * 100)}%</div>
        </div>
      </Html>
    </group>
  )
}

function Link({ from, to, color = '#94a3b8', opacity = 1, dashed = false, cone = true, width = 0.12 }) {
  const delta = useMemo(() => to.clone().sub(from), [to, from])
  const length = delta.length()
  const midpoint = from.clone().add(to).multiplyScalar(0.5)
  const quat = useMemo(() => {
    const quat = new THREE.Quaternion()
    const sourceUp = new THREE.Vector3(0, 1, 0)
    const targetDir = delta.clone().normalize()
    quat.setFromUnitVectors(sourceUp, targetDir)
    return quat
  }, [delta])

  return (
    <group position={midpoint} quaternion={quat}>
      <mesh>
        <cylinderGeometry args={[width, width, length, 18]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {cone ? (
        <>
          <mesh position={[0, length / 2 - 0.07, 0]}>
            <coneGeometry args={[width * 0.8, 0.22, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, -length / 2 + 0.07, 0]}>
            <coneGeometry args={[width * 0.8, 0.22, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      ) : null}
      {dashed ? (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[width * 0.3, width * 0.3, length, 12]} />
          <meshStandardMaterial color={color} transparent opacity={Math.max(0.18, opacity - 0.3)} />
        </mesh>
      ) : null}
    </group>
  )
}

function StageScene({ showOptional, selectedScenario }) {
  const visibleStages = useMemo(
    () => STAGE_SEQUENCE.filter((stage) => showOptional || stage.id !== 'hold'),
    [showOptional],
  )
  const scenario = useMemo(
    () => SCENARIOS.find((scenarioItem) => scenarioItem.id === selectedScenario),
    [selectedScenario],
  )
  const stageMap = useMemo(() => {
    const map = {}
    visibleStages.forEach((stage) => {
      map[stage.id] = stage
    })
    return map
  }, [visibleStages])

  const entryStage = stageMap.trash
  const outletStage = stageMap.pump
  const externalInlet = entryStage ? getPortPosition(entryStage, 'inlet').add(new THREE.Vector3(-6, 0, 0)) : null
  const disposalPoint = outletStage
    ? new THREE.Vector3(
        outletStage.position[0] + 8,
        rlToY(outletStage.ports?.outlet ?? 239.2, outletStage),
        outletStage.position[2] + 1,
      )
    : null

  return (
    <Canvas
      camera={{ position: [4, 10, 32], fov: 44 }}
      dpr={[1, 2]}
      shadows
      style={{ borderRadius: 14 }}
    >
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.0} castShadow />
      <hemisphereLight skyColor="#7dd3fc" groundColor="#0f172a" intensity={0.35} />

      {visibleStages.map((stage) => (
        <TankNode key={stage.id} stage={stage} state={scenario?.tankStates?.[stage.id]} />
      ))}

      {externalInlet && entryStage ? (
        <Link
          from={externalInlet}
          to={getPortPosition(entryStage, 'inlet')}
          color="#60a5fa"
          width={0.12}
          cone={true}
          opacity={0.88}
        />
      ) : null}

      {disposalPoint && outletStage ? (
        <>
          <Link
            from={getPortPosition(outletStage, 'outlet')}
            to={disposalPoint}
            color="#38bdf8"
            width={0.11}
            cone={true}
            opacity={0.9}
          />
          <Link
            from={disposalPoint.clone().add(new THREE.Vector3(3.2, -0.24, 0.4))}
            to={new THREE.Vector3(outletStage.position[0] + 6, rlToY(239.0, outletStage), outletStage.position[2] - 1)}
            color="#fb923c"
            width={0.08}
            dashed
            cone={false}
            opacity={0.7}
          />
        </>
      ) : null}

      {LINKS.filter((link) => showOptional || !link.optional).map((link) => {
        const fromStage = stageMap[link.from]
        const toStage = stageMap[link.to]
        if (!fromStage || !toStage) return null

        return (
          <Link
            key={`${link.from}-${link.to}`}
            from={getPortPosition(fromStage, 'outlet')}
            to={getPortPosition(toStage, 'inlet')}
            color="#94a3b8"
            width={link.optional ? 0.09 : 0.11}
            opacity={link.optional ? 0.7 : 1}
          />
        )
      })}

      {visibleStages.every((stage) => stage.id !== 'hold') ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.5, -1.06, 0]}>
          <planeGeometry args={[86, 26]} />
          <meshStandardMaterial color="#0f172a" metalness={0.08} roughness={0.98} />
        </mesh>
      ) : null}

      <OrbitControls enablePan={false} enableRotate enableZoom maxDistance={34} minDistance={10} />
    </Canvas>
  )
}

function MiniMap({ showOptional, selectedScenario }) {
  const visibleStages = STAGE_SEQUENCE.filter((stage) => showOptional || stage.id !== 'hold')
  const scenario = SCENARIOS.find((scenarioItem) => scenarioItem.id === selectedScenario)
  const xStep = 155
  const width = 36 + visibleStages.length * xStep
  const height = 190

  return (
    <section className="sidebar-card map-card" aria-label="2D map fallback">
      <div className="card-title">2D fallback logic map</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="map-svg" role="img" aria-label="Sterling flow map">
        {visibleStages.map((stage, i) => {
          const x = 24 + i * xStep
          const y = 70
          const w = 110
          const h = 62
          const level = Math.round((scenario?.tankStates?.[stage.id]?.level ?? 0.4) * 100)
          const alarm = scenario?.id === 'high'
          const tankLabelY = y - 20

          return (
            <g key={stage.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="8"
                fill={alarm && ['dosing', 'pump'].includes(stage.id) ? '#7f1d1d' : '#1e293b'}
                stroke={alarm && ['dosing', 'pump'].includes(stage.id) ? '#fca5a5' : '#94a3b8'}
                strokeWidth="2"
              />
              <rect
                x={x + 6}
                y={y + h - 11 - (h - 22) * (level / 100)}
                width={w - 12}
                height={(h - 22) * (level / 100)}
                fill={stage.id === 'hold' ? '#94a3b8' : '#3b82f6'}
              />
              <text x={x + 8} y={tankLabelY + 18} fill="#f8fafc" fontSize="13" fontWeight="700">
                {stage.name}
              </text>
              <text x={x + 8} y={tankLabelY + 34} fill="#cbd5e1" fontSize="10">
                {stage.alias}
              </text>
              <text x={x + 8} y={y + 18} fill="#86efac" fontSize="10">
                RL {stage.rlTop.toFixed(1)} to {stage.rlBottom.toFixed(1)}
              </text>
              <text x={x + 8} y={y + h - 8} fill="#f8fafc" fontSize="10">
                {scenario?.id === 'normal' ? 'Nominal' : scenario?.id === 'low' ? 'Lockout' : 'Clear-down'}
                {' | '}
                Fill {level}%
              </text>
            </g>
          )
        })}

        {visibleStages.slice(0, -1).map((stage, index) => {
          const fromX = 24 + index * xStep + 110
          const toX = 24 + (index + 1) * xStep
          const midY = 105
          return (
            <g key={`${stage.id}-line`}>
              <line
                x1={fromX}
                y1={midY}
                x2={toX}
                y2={midY}
                stroke={scenario?.id === 'low' ? '#cbd5e1' : '#34d399'}
                strokeWidth="3"
                strokeDasharray={scenario?.id === 'high' ? '7 4' : undefined}
              />
              <polygon
                points={`${toX - 8},${midY - 5} ${toX - 8},${midY + 5} ${toX},${midY}`}
                fill={scenario?.id === 'low' ? '#cbd5e1' : '#34d399'}
              />
            </g>
          )
        })}
      </svg>
      <div className="mini-key">
        <div><strong>Fill-state scenario</strong> {scenario?.description}</div>
        <div>
          <strong>Key rules</strong>
          {' '}
          LLS OFF = no run, HLS ON = forced clear-down, Return mismatch = maintenance check.
        </div>
      </div>
    </section>
  )
}

function useMediaBreakpoint(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(query)
    const update = (event) => setMatches(event.matches)
    mq.addEventListener('change', update)

    return () => mq.removeEventListener('change', update)
  }, [query])

  return matches
}

function OverlayLegend({ selectedScenario }) {
  const scenario = SCENARIOS.find((scenarioItem) => scenarioItem.id === selectedScenario)

  return (
    <section className="overlay-card">
      <div className="card-title">Operational logic notes</div>
      <div className="overlay-grid">
        <div>
          <strong>Scenario</strong>
          <p>{scenario?.label}</p>
          <small>{scenario?.description}</small>
        </div>
        <div>
          <strong>Core flow clarity</strong>
          <p>Trash Tank → Dosing / Equalization → ATU / Aeration → Pump + Chlorination</p>
        </div>
        <div>
          <strong>Flow stop rule</strong>
          <p>
            If <strong>Pump-on float</strong> is OFF, pumps/chlorination do not run even when scheduled.
          </p>
        </div>
        <div>
          <strong>High-level rule</strong>
          <p>High float ON forces clear-down behavior; normal dosing/pumping demand is overridden.</p>
        </div>
      </div>

      <div className="overlay-grid" style={{ marginTop: 8 }}>
        {STAGE_SEQUENCE.filter((stage) => stage.id !== 'hold').map((stage) => {
          const tankState = scenario?.tankStates?.[stage.id]
          return (
            <div key={stage.id}>
              <strong>{stage.name}</strong>
              <p>
                {tankState?.actuators?.map((act) => (
                  <span key={act.name} className="chip-line" title={act.tech}>
                    {act.name}: {act.state}
                    {act.reason ? ` (${act.reason})` : ''}
                    <br />
                  </span>
                ))}
                {!tankState?.actuators ? stage.alias : ''}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function IOOverview({ showOptional }) {
  const stages = STAGE_SEQUENCE.filter((stage) => showOptional || stage.id !== 'hold')

  return (
    <section className="overlay-card" style={{ marginBottom: 0 }}>
      <div className="card-title">I/O labels</div>
      <div className="overlay-grid">
        {stages.map((stage) => (
          <div key={stage.id}>
            <strong>{stage.name}</strong>
            {stage.io.map((item) => (
              <p key={item.label} className="io-row" title={item.alias}>
                {item.label}
                {' '}
                <span className="muted">({item.alias})</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function App() {
  const [selectedScenario, setSelectedScenario] = useState('normal')
  const [showOptional, setShowOptional] = useState(false)
  const isSmall = useMediaBreakpoint('(max-width: 900px)')

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Sterling Septic Logic Visualizer</h1>
          <p>Static engineering map with readable states, RL bands, and control semantics</p>
        </div>
      </header>

      <section className="controls" aria-label="scenario controls">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => setSelectedScenario(scenario.id)}
            className={selectedScenario === scenario.id ? 'active' : ''}
            aria-pressed={selectedScenario === scenario.id}
          >
            {scenario.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowOptional((value) => !value)}
          className={showOptional ? 'active' : ''}
          aria-pressed={showOptional}
        >
          Holding / Distribution: {showOptional ? 'Shown' : 'Hidden'}
        </button>
      </section>

      <section className="layout-grid">
        <div className="scene-card">
          <StageScene showOptional={showOptional} selectedScenario={selectedScenario} />
        </div>

        <MiniMap showOptional={showOptional} selectedScenario={selectedScenario} />
      </section>

      <OverlayLegend selectedScenario={selectedScenario} />
      <IOOverview showOptional={showOptional} />

      {isSmall ? null : (
        <p className="mobile-note">
          Desktop view keeps 3D + 2D fallback map together for quick comparison. On narrow screens, keep the scene compact and use
          fallback map as fast readout.
        </p>
      )}
    </div>
  )
}

export default App
