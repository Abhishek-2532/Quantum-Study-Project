import React from 'react';

interface BlochSphereProps {
  theta: number; // 0 to PI
  phi: number;   // 0 to 2*PI
  size?: number;
}

export default function BlochSphere({ theta, phi, size = 260 }: BlochSphereProps) {
  const center = size / 2;
  const radius = size * 0.4;

  // Projection parameters (Elevation = 20 degrees, Azimuth = 45 degrees)
  const el = 20 * (Math.PI / 180);
  const az = 45 * (Math.PI / 180);

  const cosEl = Math.cos(el);
  const sinEl = Math.sin(el);
  const cosAz = Math.cos(az);
  const sinAz = Math.sin(az);

  // Convert 3D Cartesian coordinates to 2D Screen coordinates
  // standard right-handed coordinate system:
  // Z points Up (Computational basis |0> is +Z, |1> is -Z)
  // X points forward-right
  // Y points backward-right
  const project = (x: number, y: number, z: number) => {
    // Rotate around Z (azimuth)
    const xRot = x * cosAz - y * sinAz;
    const yRot = x * sinAz + y * cosAz;

    // Project with elevation
    const u = center + radius * xRot;
    const v = center - radius * (yRot * sinEl + z * cosEl);
    return { x: u, y: v };
  };

  // State vector on the sphere:
  // x = sin(theta) * cos(phi)
  // y = sin(theta) * sin(phi)
  // z = cos(theta)
  const svX = Math.sin(theta) * Math.cos(phi);
  const svY = Math.sin(theta) * Math.sin(phi);
  const svZ = Math.cos(theta);

  const statePos = project(svX, svY, svZ);
  const centerPos = { x: center, y: center };

  // Generate Ellipse Paths for Grid lines
  // Equatorial line (Z = 0)
  const getEquatorPath = () => {
    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const pt = project(Math.cos(angle), Math.sin(angle), 0);
      points.push(`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  };

  // Longitudinal line (Y = 0)
  const getLongitudeYPath = () => {
    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const pt = project(Math.cos(angle), 0, Math.sin(angle));
      points.push(`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  };

  // Endpoints of axes
  const axisXPlus = project(1.2, 0, 0);
  const axisXMinus = project(-1.1, 0, 0);
  const axisYPlus = project(0, 1.2, 0);
  const axisYMinus = project(0, -1.1, 0);
  const axisZPlus = project(0, 0, 1.2);
  const axisZMinus = project(0, 0, -1.1);

  // States
  const state0 = project(0, 0, 1);    // |0>
  const state1 = project(0, 0, -1);   // |1>
  const statePlus = project(1, 0, 0); // |+>
  const stateMinus = project(-1, 0, 0);// |->

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-[340px] mx-auto text-white">
      <div className="text-xs font-mono text-cyan-400 mb-2 font-semibold tracking-wider uppercase">Bloch Sphere Projection</div>
      
      <svg width={size} height={size} className="overflow-visible select-none">
        <defs>
          <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Sphere Backside Shading */}
        <circle cx={center} cy={center} r={radius} fill="url(#sphereGrad)" stroke="#334155" strokeWidth="1" />

        {/* Equatorial Plane Grid Line (Z=0, dashed) */}
        <path d={getEquatorPath()} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />

        {/* Longitudinal Plane Grid Line (Y=0, dashed) */}
        <path d={getLongitudeYPath()} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,3" />

        {/* Axes lines */}
        {/* X Axis */}
        <line x1={axisXMinus.x} y1={axisXMinus.y} x2={axisXPlus.x} y2={axisXPlus.y} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="1,2" opacity="0.6" />
        {/* Y Axis */}
        <line x1={axisYMinus.x} y1={axisYMinus.y} x2={axisYPlus.x} y2={axisYPlus.y} stroke="#10b981" strokeWidth="1.5" strokeDasharray="1,2" opacity="0.6" />
        {/* Z Axis */}
        <line x1={axisZMinus.x} y1={axisZMinus.y} x2={axisZPlus.x} y2={axisZPlus.y} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="1,2" opacity="0.6" />

        {/* Axes Labels */}
        <text x={axisXPlus.x + 5} y={axisXPlus.y + 4} fill="#f43f5e" className="text-[10px] font-mono font-bold">x (|+⟩)</text>
        <text x={axisYPlus.x + 5} y={axisYPlus.y + 4} fill="#10b981" className="text-[10px] font-mono font-bold">y</text>
        <text x={axisZPlus.x - 5} y={axisZPlus.y - 8} fill="#3b82f6" className="text-[10px] font-mono font-bold">z (|0⟩)</text>

        {/* State Labels */}
        {/* |0> label */}
        <text x={state0.x - 14} y={state0.y - 8} fill="#60a5fa" className="text-xs font-mono font-extrabold">|0⟩</text>
        {/* |1> label */}
        <text x={state1.x - 14} y={state1.y + 14} fill="#60a5fa" className="text-xs font-mono font-extrabold">|1⟩</text>
        {/* |+> label */}
        <text x={statePlus.x - 10} y={statePlus.y - 8} fill="#f87171" className="text-[10px] font-mono font-semibold">|+⟩</text>
        {/* |-> label */}
        <text x={stateMinus.x - 10} y={stateMinus.y + 12} fill="#f87171" className="text-[10px] font-mono font-semibold">|-⟩</text>

        {/* Center node */}
        <circle cx={center} cy={center} r="2.5" fill="#94a3b8" />

        {/* Current Statevector Line */}
        <line 
          x1={center} 
          y1={center} 
          x2={statePos.x} 
          y2={statePos.y} 
          stroke="#06b6d4" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Statevector Arrow Head */}
        <circle 
          cx={statePos.x} 
          cy={statePos.y} 
          r="6.5" 
          fill="#06b6d4" 
          stroke="#ffffff" 
          strokeWidth="2" 
          className="animate-pulse"
        />
      </svg>

      <div className="mt-2 text-center text-xs font-mono bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 w-full">
        <div>Vector Coordinates:</div>
        <div className="grid grid-cols-3 gap-1 mt-1 text-slate-300">
          <span>x: <b className="text-rose-400">{svX.toFixed(3)}</b></span>
          <span>y: <b className="text-emerald-400">{svY.toFixed(3)}</b></span>
          <span>z: <b className="text-blue-400">{svZ.toFixed(3)}</b></span>
        </div>
      </div>
    </div>
  );
}
