import React, { useState, useEffect } from 'react';
import { getGateMatrix } from '../utils/quantumMath';
import { motion } from 'motion/react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface CircuitVisualizerProps {
  theta: number;
  setTheta: (val: number) => void;
  gateType: 'RX' | 'RY' | 'RZ';
  setGateType: (val: 'RX' | 'RY' | 'RZ') => void;
}

export default function CircuitVisualizer({
  theta,
  setTheta,
  gateType,
  setGateType,
}: CircuitVisualizerProps) {
  const [matrix, setMatrix] = useState<{ re: number; im: number }[][]>([]);

  useEffect(() => {
    setMatrix(getGateMatrix(gateType, theta));
  }, [theta, gateType]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheta(parseFloat(e.target.value));
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Circuit Ansatz Panel */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Interactive Quantum Circuit
            <span className="text-xs font-mono bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full font-semibold">
              1 Qubit Ansatz
            </span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Drag the slider to apply the parameterized rotation to the initial state |0⟩.
          </p>
        </div>

        {/* SVG Circuit Diagram */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-center min-h-[140px]">
          <svg width="100%" height="100" viewBox="0 0 380 100" className="max-w-[380px] overflow-visible">
            {/* Qubit label */}
            <text x="10" y="54" fill="#1e293b" className="text-xs font-mono font-bold">q₀</text>

            {/* Wire */}
            <line x1="35" y1="50" x2="330" y2="50" stroke="#94a3b8" strokeWidth="2" strokeDasharray={gateType === 'RZ' ? '4,1' : '0'} />

            {/* State Preparation Input */}
            <g transform="translate(45, 30)">
              <rect x="0" y="0" width="36" height="40" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
              <text x="18" y="24" fill="#38bdf8" textAnchor="middle" className="text-xs font-mono font-bold">|0⟩</text>
            </g>

            {/* Wire Connection (Pulse particle animation) */}
            <motion.circle
              key={`${gateType}-${theta}`}
              cx="45"
              cy="50"
              r="4"
              fill="#06b6d4"
              animate={{ cx: [85, 140] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />

            {/* Parameterized Gate Box */}
            <g transform="translate(140, 20)">
              <motion.rect
                width="80"
                height="60"
                rx="10"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
                whileHover={{ scale: 1.03 }}
                className="shadow-md cursor-pointer"
              />
              <text x="40" y="32" fill="#ffffff" textAnchor="middle" className="text-xs font-mono font-extrabold tracking-wide">
                {gateType}(θ)
              </text>
              <text x="40" y="48" fill="#bae6fd" textAnchor="middle" className="text-[10px] font-mono">
                θ={theta.toFixed(2)}
              </text>
            </g>

            {/* Wire segment */}
            <motion.circle
              key={`pulse2-${gateType}-${theta}`}
              cx="220"
              cy="50"
              r="4"
              fill="#ec4899"
              animate={{ cx: [220, 275] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />

            {/* Measurement block */}
            <g transform="translate(275, 30)">
              <rect x="0" y="0" width="36" height="40" rx="6" fill="#475569" stroke="#334155" strokeWidth="1.5" />
              {/* Meter arc */}
              <path d="M 6 30 A 12 12 0 0 1 30 30" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              {/* Meter needle */}
              <line x1="18" y1="34" x2="26" y2="18" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              <text x="18" y="12" fill="#cbd5e1" textAnchor="middle" className="text-[7px] font-mono font-bold uppercase">Meas</text>
            </g>
          </svg>
        </div>

        {/* Interactive Sliders and Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gate Type</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['RX', 'RY', 'RZ'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGateType(g)}
                  className={`flex-1 text-center py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    gateType === g ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rotation Parameter (θ)
              </label>
              <span className="text-xs font-mono font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                {theta.toFixed(4)} rad
              </span>
            </div>
            <input
              type="range"
              id="theta-slider"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={theta}
              onChange={handleSliderChange}
              className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0 (0°)</span>
              <span>π/2 (90°)</span>
              <span>π (180°)</span>
              <span>3π/2 (270°)</span>
              <span>2π (360°)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Matrix Representation */}
      <div className="lg:col-span-5 bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-mono font-bold tracking-tight text-sky-400 uppercase">Unitary Operator Matrix U(θ)</h4>
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-400 font-mono">
            Complex Matrix
          </span>
        </div>

        <p className="text-slate-400 text-xs leading-normal">
          This matrix represents the physical rotation. Notice how changing the angle modifies the matrix values in real-time.
        </p>

        {/* Matrix display */}
        {matrix.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            {/* Elegant math brackets layout */}
            <div className="flex items-center justify-center font-mono text-xs sm:text-sm py-4 relative">
              {/* Left bracket */}
              <div className="w-2.5 h-16 border-l-2 border-t-2 border-b-2 border-slate-700 rounded-l flex-shrink-0" />

              {/* Elements grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-5 text-center flex-grow">
                {matrix.map((row, rIdx) =>
                  row.map((val, cIdx) => {
                    const absValRe = Math.abs(val.re);
                    const absValIm = Math.abs(val.im);
                    let displayStr = '';

                    if (absValRe < 1e-4 && absValIm < 1e-4) {
                      displayStr = '0';
                    } else if (absValIm < 1e-4) {
                      displayStr = val.re.toFixed(3);
                    } else if (absValRe < 1e-4) {
                      displayStr = `${val.im > 0 ? '' : '-'}${absValIm.toFixed(3)}i`;
                    } else {
                      displayStr = `${val.re.toFixed(3)} ${val.im > 0 ? '+' : '-'} ${absValIm.toFixed(3)}i`;
                    }

                    return (
                      <motion.div
                        key={`${rIdx}-${cIdx}`}
                        className="text-slate-100"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.2 }}
                      >
                        {displayStr}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Right bracket */}
              <div className="w-2.5 h-16 border-r-2 border-t-2 border-b-2 border-slate-700 rounded-r flex-shrink-0" />
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 italic bg-slate-900/40 p-3 rounded-lg border border-slate-900">
          {gateType === 'RY' && (
            <p>RY(θ) matrix elements are purely real, mapping cosine and sine coefficients. It rotates the statevector in the x-z meridian plane of the Bloch sphere.</p>
          )}
          {gateType === 'RX' && (
            <p>RX(θ) matrix elements contain imaginary elements (i). It introduces complex amplitudes, inducing rotation around the X-axis.</p>
          )}
          {gateType === 'RZ' && (
            <p>RZ(θ) is a phase rotation around the Z-axis, causing the relative phase of |1⟩ to rotate by e^(iθ) with no change to measurement probabilities.</p>
          )}
        </div>
      </div>
    </div>
  );
}
