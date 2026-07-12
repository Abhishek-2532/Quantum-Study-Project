import React, { useMemo } from 'react';
import { generate1DLandscape } from '../utils/quantumMath';
import { motion } from 'motion/react';
import { HelpCircle, Star, Target } from 'lucide-react';

interface CostLandscapeProps {
  theta: number;
  setTheta: (val: number) => void;
  observable: 'PauliX' | 'PauliY' | 'PauliZ';
  phi: number;
}

export default function CostLandscape({
  theta,
  setTheta,
  observable,
  phi,
}: CostLandscapeProps) {
  // Generate 60 steps of the landscape for plotting
  const landscapePoints = useMemo(() => {
    return generate1DLandscape(observable, phi, 60);
  }, [observable, phi]);

  // Width and height of our SVG viewport
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Find minimum and maximum of the cost to scale correctly
  // Cost runs from -1 to 1 exactly for single qubits
  const minY = -1;
  const maxY = 1;

  // Mapping coordinate functions
  const mapX = (t: number) => {
    return paddingX + (t / (2 * Math.PI)) * (width - 2 * paddingX);
  };

  const mapY = (c: number) => {
    // Map -1 to height - paddingY, and 1 to paddingY
    const scale = (height - 2 * paddingY) / (maxY - minY);
    return height - paddingY - (c - minY) * scale;
  };

  // Convert points to SVG Path
  const pathD = useMemo(() => {
    if (landscapePoints.length === 0) return '';
    const points = landscapePoints.map((pt) => `${mapX(pt.theta).toFixed(1)},${mapY(pt.cost).toFixed(1)}`);
    return `M ${points.join(' L ')}`;
  }, [landscapePoints]);

  // Calculate current cost value
  const currentCost = useMemo(() => {
    // For single-qubit with current parameters:
    // we can use standard analytic formula: cos(theta) for PauliZ when phi=0
    // but we can compute it dynamically:
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    const alpha = { re: cos, im: 0 };
    const beta = { re: Math.cos(phi) * sin, im: Math.sin(phi) * sin };
    const state = { alpha, beta };

    if (observable === 'PauliZ') {
      return state.alpha.re ** 2 + state.alpha.im ** 2 - (state.beta.re ** 2 + state.beta.im ** 2);
    } else if (observable === 'PauliX') {
      return 2 * (state.alpha.re * state.beta.re + state.alpha.im * state.beta.im);
    } else {
      return 2 * (state.alpha.im * state.beta.re - state.alpha.re * state.beta.im);
    }
  }, [theta, observable, phi]);

  const currentX = mapX(theta);
  const currentY = mapY(currentCost);

  // Identify global minimum
  const globalMin = useMemo(() => {
    let minPt = { theta: 0, cost: 999 };
    landscapePoints.forEach((pt) => {
      if (pt.cost < minPt.cost) {
        minPt = pt;
      }
    });
    return minPt;
  }, [landscapePoints]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual Canvas Panel */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
            1D Cost Surface Landscape
          </h3>
          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
            H = {observable}
          </span>
        </div>

        {/* SVG Plot */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible select-none"
          >
            {/* Grid lines */}
            {/* Y = 0 center axis */}
            <line
              x1={paddingX}
              y1={mapY(0)}
              x2={width - paddingX}
              y2={mapY(0)}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Y = -1 bottom bound */}
            <line
              x1={paddingX}
              y1={mapY(-1)}
              x2={width - paddingX}
              y2={mapY(-1)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            {/* Y = 1 top bound */}
            <line
              x1={paddingX}
              y1={mapY(1)}
              x2={width - paddingX}
              y2={mapY(1)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />

            {/* Axes Labels */}
            {/* Y-Axis scale */}
            <text x={paddingX - 10} y={mapY(1) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">+1.0</text>
            <text x={paddingX - 10} y={mapY(0) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">0.0</text>
            <text x={paddingX - 10} y={mapY(-1) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">-1.0</text>

            {/* X-Axis labels */}
            <text x={mapX(0)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">0</text>
            <text x={mapX(Math.PI / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π/2</text>
            <text x={mapX(Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π</text>
            <text x={mapX((3 * Math.PI) / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">3π/2</text>
            <text x={mapX(2 * Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">2π</text>

            {/* X-Axis Title */}
            <text x={width / 2} y={height - 4} textAnchor="middle" className="text-[10px] font-sans font-bold fill-slate-500 uppercase tracking-widest">
              Parameter angle (θ)
            </text>

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90 ${12} ${height / 2})`}
              x={12}
              y={height / 2}
              textAnchor="middle"
              className="text-[10px] font-sans font-bold fill-slate-500 uppercase tracking-widest"
            >
              Energy Cost C(θ)
            </text>

            {/* Global Minimum Indicator Target */}
            <g transform={`translate(${mapX(globalMin.theta)}, ${mapY(globalMin.cost)})`}>
              <circle r="12" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2,2" className="animate-spin-slow" />
              <circle r="4" fill="#22c55e" />
            </g>

            {/* Smooth curve line */}
            <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />

            {/* Current point tracking line */}
            <line
              x1={currentX}
              y1={paddingY}
              x2={currentX}
              y2={height - paddingY}
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.4"
            />

            {/* Current parameters point (big red dot) */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r="7.5"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="shadow-md cursor-pointer"
              animate={{ r: [7.5, 9, 7.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        {/* Dynamic coordinate card */}
        <div className="flex bg-slate-50 p-4 rounded-xl border border-slate-100 justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-500 font-medium">Your Current State Location:</span>
          </div>
          <div className="font-mono space-x-4">
            <span>θ = <b className="text-slate-900">{theta.toFixed(4)} rad</b></span>
            <span>Cost = <b className="text-sky-600">{currentCost.toFixed(4)}</b></span>
          </div>
        </div>
      </div>

      {/* Explanation Side Panel */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Landscape Explorer</h3>
          <p className="text-slate-500 text-xs mt-1">
            Understanding optimization terrain.
          </p>
        </div>

        {/* Interactive parameter slider */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Manually Adjust θ (Rotate)
          </label>
          <input
            type="range"
            id="landscape-theta"
            min="0"
            max={2 * Math.PI}
            step="0.01"
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
          />
          <span className="text-[10px] text-slate-400 block leading-tight">
            Slide left/right to move the red dot along the curve. Your goal is to reach the green minimum target.
          </span>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Global Minimum</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                The lowest point of the valley, representing the ground state or solution. Located at <b>θ = {globalMin.theta.toFixed(3)} rad</b> with cost <b>{globalMin.cost.toFixed(3)}</b>.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">The Variational Principle</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Any parameter choice θ yields an energy cost C(θ) which is strictly greater than or equal to the true minimum. Find the absolute minimum parameters to solve!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
