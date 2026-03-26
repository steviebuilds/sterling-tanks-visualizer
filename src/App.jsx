import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const STAGE_SEQUENCE = [
  {
    id: 'pre',
    name: 'Pre-treatment',
    note: 'Gravity inlet stage',
    position: [-9, 0, 0],
    size: 1.6,
    height: 1.5,
    color: '#7ed3ff',
    io: {
      inputs: ['Inlet / building drain'],
      outputs: ['to Dosing/EQ'],
    },
  },
  {
    id: 'dosing',
    name: 'Dosing / EQ',
    note: 'Pre-process hold + dose',
    position: [-3, 0, 0],
    size: 2.0,
    height: 2.1,
    color: '#f5b93c',
    io: {
      inputs: ['LLS-02', 'ALS-02', 'HLS-02', 'FTQ-03'],
      outputs: ['PSZ-201', 'PSZ-202'],
    },
  },
  {
    id: 'atu',
    name: 'ATU / Aeration',
    note: 'Fine treatment train',
    position: [3, 0.2, 0.4],
    size: 2.1,
    height: 2.0,
    color: '#9b8cff',
    io: {
      inputs: ['PS-06', 'PS-07', 'PS-08', 'PS-09', 'PS-10', 'PS-11', 'PS-12', 'PS-13'],
      outputs: ['BSZ-205', 'BSZ-206', 'BSZ-207', 'BSZ-208', 'BSZ-209', 'BSZ-210', 'BSZ-211', 'BSZ-212'],
    },
  },
  {
    id: 'pump',
    name: 'Pump / Chlorination',
    note: 'Final tank and pressure hold',
    position: [9, 0, 0],
    size: 2.2,
    height: 2.1,
    color: '#7ce5b8',
    io: {
      inputs: ['LLS-01', 'ALS-01', 'HLS-01', 'FTQ-04', 'FTQ-05'],
      outputs: ['PSZ-203', 'PSZ-204', 'VXY-213..224', 'PS/BSZ/VXY'],
    },
  },
  {
    id: 'hold',
    name: 'Holding / Distribution',
    note: 'Optional terminal vessel',
    position: [14, 0.1, -0.5],
    size: 1.9,
    height: 1.8,
    color: '#3f90ff',
    io: {
      inputs: ['optional field line return'],
      outputs: ['PS-05', 'Distribution branch'],
    },
  },
]

const LINKS = [
  { from: 'pre', to: 'dosing', size: 0.18 },
  { from: 'dosing', to: 'atu', size: 0.2 },
  { from: 'atu', to: 'pump', size: 0.2 },
  { from: 'pump', to: 'hold', size: 0.16, optional: true },
  { from: 'pump', to: 'disposal', dashed: true, optional: true, returnStyle: true },
]

function TankNode({ stage, index, alarmActive, flowPulse }) {
  const meshRef = useRef(null)
  const labelRef = useRef(null)

  const baseColor = alarmActive ? '#ff5252' : stage.color
  const pulseColor = alarmActive ? '#ffd6d6' : '#f3ffdb'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    if (flowPulse) {
      const glow = 0.08 + 0.06 * Math.sin(clock.getElapsedTime() * 4 + index)
      meshRef.current.scale.setScalar(1 + glow)
    } else {
      meshRef.current.scale.setScalar(1)
    }

    if (labelRef.current) {
      labelRef.current.style.borderColor = alarmActive ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.18)'
      labelRef.current.style.background = alarmActive
        ? 'rgba(127, 29, 29, 0.7)'
        : 'rgba(15, 23, 42, 0.75)'
    }
  })

  return (
    <group position={stage.position}>
      <mesh ref={meshRef} receiveShadow castShadow>
        <cylinderGeometry args={[stage.size, stage.size * 1.08, stage.height, 28]} />
        <meshPhysicalMaterial
          color={baseColor}
          emissive={pulseColor}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, stage.height / 2 + 0.22, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={alarmActive ? '#ff8888' : '#94a3b8'} />
      </mesh>

      <Html center distanceFactor={14}>
        <div className="tank-label" ref={labelRef}>
          <div className="tank-title">{stage.name}</div>
          <div>{stage.note}</div>
          <div className="tank-sub">{alarmActive ? 'ALARM STATE' : flowPulse ? 'FLOW PULSE ON' : 'IDLE'}</div>
        </div>
      </Html>
    </group>
  )
}

function FlowArrow({ a, b, color, running }) {
  const markerRefs = useRef([])
  const phase = useRef(0)
  const length = useMemo(() => a.distanceTo(b), [a, b])
  const half = length / 2

  useFrame((_, delta) => {
    if (!running) {
      return
    }
    phase.current = (phase.current + delta * 0.9) % 1
    markerRefs.current.forEach((marker, idx) => {
      if (!marker) return
      const t = (phase.current + idx * 0.32) % 1
      marker.position.y = -half + t * length
    })
  })

  return (
    <group>
      {[0, 1, 2].map((idx) => (
        <mesh key={idx} ref={(el) => (markerRefs.current[idx] = el)}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color={color} emissive={color} />
        </mesh>
      ))}
    </group>
  )
}

function Link({ from, to, stageId, showFlow, alarm, isReturn = false, isOptional = false }) {
  const fromStage = from
  const toStage = to

  const start = new THREE.Vector3(...fromStage.position)
  const end = new THREE.Vector3(...toStage.position)
  const center = start.clone().add(end).multiplyScalar(0.5)
  const dir = end.clone().sub(start)
  const length = dir.length()
  const midpoint = center
  const yAxis = new THREE.Vector3(0, 1, 0)
  const q = new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize())

  const color = isReturn
    ? '#f97316'
    : alarm
      ? '#f43f5e'
      : isOptional
        ? '#93c5fd'
        : '#94a3b8'

  return (
    <group position={midpoint} quaternion={q}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, length, 12]} />
        <meshStandardMaterial color={color} transparent={alarm} opacity={isReturn && !alarm ? 0.82 : 1} />
      </mesh>
      {!isReturn && (
        <FlowArrow
          a={new THREE.Vector3(0, -length / 2, 0)}
          b={new THREE.Vector3(0, length / 2, 0)}
          color={color}
          running={showFlow}
        />
      )}
      <mesh position={[0, length / 2 + 0.15, 0]}>
        <coneGeometry args={[0.17, 0.35, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -length / 2 - 0.15, 0]}>
        <coneGeometry args={[0.17, 0.35, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {stageId === 'return' && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.55, 0.08, 0.55]} />
          <meshStandardMaterial color="#fecaca" emissive="#c2410c" />
        </mesh>
      )}
    </group>
  )
}

function StageScene({ showOptional, showFlow, showAlarm }) {
  const visibleStages = useMemo(
    () => STAGE_SEQUENCE.filter((stage) => showOptional || stage.id !== 'hold'),
    [showOptional],
  )

  const stageMap = useMemo(() => {
    const map = {}
    visibleStages.forEach((stage) => {
      map[stage.id] = stage
    })
    return map
  }, [visibleStages])

  const stageColor = (id) => {
    const activeAlarm = showAlarm && ['dosing', 'atu', 'pump', 'hold'].includes(id)
    if (!visibleStages.some((stage) => stage.id === id)) return false
    return activeAlarm
  }

  return (
    <Canvas
      camera={{ position: [0, 7, 14], fov: 48 }}
      dpr={[1, 2]}
      shadows
    >
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow />
      <hemisphereLight skyColor="#7dd3fc" groundColor="#172554" intensity={0.45} />

      {visibleStages.map((stage, index) => (
        <TankNode
          key={stage.id}
          stage={stage}
          index={index}
          alarmActive={showAlarm && stageColor(stage.id)}
          flowPulse={showFlow}
        />
      ))}

      {LINKS.filter((link) => showOptional || !link.optional).map((link) => {
        const from = stageMap[link.from]
        const to = link.to === 'disposal' ? null : stageMap[link.to]
        if (!from || (link.to !== 'disposal' && !to)) return null

        if (link.to === 'disposal') {
          const sink = new THREE.Vector3(20, -2.4, 2.1)
          const start = new THREE.Vector3(...from.position)
          const center = start.clone().add(sink).multiplyScalar(0.5)
          const dir = sink.clone().sub(start)
          const len = dir.length()
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
          const color = showAlarm ? '#f43f5e' : '#fb923c'

          return (
            <group key={`${link.from}->disposal`} position={center} quaternion={q}>
              <mesh>
                <cylinderGeometry args={[0.11, 0.11, len, 10]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <mesh position={[0, len / 2 + 0.2, 0]}>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial color="#f59e0b" emissive="#7c2d12" />
              </mesh>
              <mesh position={[0, -len / 2 - 0.2, 0]}>
                <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" />
              </mesh>
            </group>
          )
        }

        return (
          <Link
            key={`${link.from}->${link.to}`}
            from={from}
            to={to}
            stageId={link.to}
            showFlow={showFlow}
            alarm={showAlarm && link.from !== 'pre' && link.to !== 'dosing'}
            isReturn={!!link.returnStyle}
            isOptional={!!link.optional}
          />
        )
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -1, 0]}>
        <planeGeometry args={[80, 28]} />
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.8} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -1.02, 0]}>
        <planeGeometry args={[80, 28]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={24}
        makeDefault
      />
    </Canvas>
  )
}

function MiniMap({ showOptional, flowPulse, alarmState, ioData }) {
  const stages = STAGE_SEQUENCE.filter((stage) => showOptional || stage.id !== 'hold')

  const xStep = 140
  const width = 36 + stages.length * xStep
  const height = 170

  return (
    <section className="sidebar-card map-card" aria-label="2D map fallback">
      <div className="card-title">2D fallback map</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="map-svg" role="img" aria-label="Sterling flow map">
        {stages.map((stage, i) => {
          const x = 28 + i * xStep
          const y = 70
          const w = 88
          const h = 58
          const alarm = alarmState && ['dosing', 'atu', 'pump', 'hold'].includes(stage.id)

          return (
            <g key={stage.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="8"
                fill={alarm ? '#7f1d1d' : '#1e293b'}
                stroke={alarm ? '#fda4af' : '#94a3b8'}
                strokeWidth="2"
              />
              <text x={x + 10} y={y + 20} fill="#f8fafc" fontSize="12" fontWeight="600">
                {stage.name}
              </text>
              <text x={x + 10} y={y + 36} fill="#cbd5e1" fontSize="10">
                {stage.id.toUpperCase()}
              </text>
              <text x={x + 10} y={y + 48} fill={flowPulse ? '#86efac' : '#38bdf8'} fontSize="10">
                {flowPulse ? 'FLOW' : 'OFF'}
              </text>
            </g>
          )
        })}

        {stages
          .slice(0, -1)
          .map((stage, i) => {
            const fromX = 28 + i * xStep + 88
            const toX = 28 + (i + 1) * xStep
            const midY = 99

            return (
              <g key={`${stage.id}-line`}>
                <line
                  x1={fromX}
                  y1={midY}
                  x2={toX}
                  y2={midY}
                  stroke={flowPulse ? '#34d399' : '#94a3b8'}
                  strokeWidth="3"
                  strokeDasharray={alarmState ? '6 4' : 'none'}
                />
                <polygon
                  points={`${toX - 8},${midY - 6} ${toX - 8},${midY + 6} ${toX},${midY}`}
                  fill={flowPulse ? '#34d399' : '#94a3b8'}
                />
              </g>
            )
          })}
      </svg>

      <div className="mini-key">
        {ioData.map((line) => (
          <div key={line.label}>
            <strong>{line.label}</strong> {line.value}
          </div>
        ))}
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

function App() {
  const [showFlowPulse, setShowFlowPulse] = useState(true)
  const [alarmState, setAlarmState] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const isSmall = useMediaBreakpoint('(max-width: 900px)')

  const ioData = [
    {
      label: 'IO',
      value:
        'LLS / ALS / HLS, FTQ-03 / FTQ-04 / FTQ-05, PS / BSZ / PSZ / VXY',
    },
    {
      label: 'Preset status',
      value: showFlowPulse ? 'Pump flow pulses active' : 'Pump flow pulses paused',
    },
    {
      label: 'Optional hold node',
      value: showOptional ? 'Enabled (Visible)' : 'Hidden',
    },
  ]

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Sterling Septic 3D System Visualizer</h1>
          <p>Mobile-first, touch-gesture controls with 3D flow logic</p>
        </div>
      </header>

      <section className="controls" aria-label="animation controls">
        <button
          type="button"
          onClick={() => setShowFlowPulse((v) => !v)}
          className={showFlowPulse ? 'active' : ''}
          aria-pressed={showFlowPulse}
        >
          Pump/Flow Pulse: {showFlowPulse ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => setAlarmState((v) => !v)}
          className={alarmState ? 'active alarm' : ''}
          aria-pressed={alarmState}
        >
          Alarm Highlight: {alarmState ? 'ON' : 'OFF'}
        </button>
        <button type="button" onClick={() => setShowOptional((v) => !v)} className={showOptional ? 'active' : ''}>
          Holding / Distribution: {showOptional ? 'Enabled' : 'Disabled'}
        </button>
      </section>

      <section className="layout-grid">
        <div className="scene-card">
          <StageScene
            showOptional={showOptional}
            showFlow={showFlowPulse}
            showAlarm={alarmState}
          />
        </div>

        <MiniMap
          showOptional={showOptional}
          flowPulse={showFlowPulse}
          alarmState={alarmState}
          ioData={ioData}
        />
      </section>

      <section className="overlay-card">
        <div className="card-title">Key IO labels</div>
        <div className="overlay-grid">
          <div>
            <strong>Pre-treatment</strong>
            <p>Inlet drain / gravity pass-through</p>
          </div>
          <div>
            <strong>Dosing / EQ</strong>
            <p>LLS-02, ALS-02, HLS-02, FTQ-03, PSZ-201, PSZ-202, PT-104</p>
          </div>
          <div>
            <strong>ATU</strong>
            <p>PS-06..13, BSZ-205..212, PT-105..108</p>
          </div>
          <div>
            <strong>Pump / Chlorination</strong>
            <p>LLS-01, ALS-01, HLS-01, FTQ-04, FTQ-05, PSZ-203, PSZ-204, VXY-213..224</p>
          </div>
          <div className={showOptional ? '' : 'hide'}>
            <strong>Holding / Distribution (optional)</strong>
            <p>FS-OUT, Field return loop, return check alarms</p>
          </div>
        </div>
      </section>

      {isSmall ? null : (
        <p className="mobile-note">
          On small screens, the compact sidebar map remains the quick-view fallback if you hide/close the 3D view.
        </p>
      )}
    </div>
  )
}

export default App
