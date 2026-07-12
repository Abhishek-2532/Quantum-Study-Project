import React, { useMemo } from 'react';
import { generate1DLandscape, getParameterShiftGradient } from '../utils/quantumMath';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw, Layers } from 'lucide-react';

interface ParameterShiftVisualizerProps {
  theta: number;
  setTheta: (val: number) => void;
  observable: 'PauliX' | 'PauliY' | 'PauliZ';
  phi: number;
}

export default function ParameterShiftVisualizer({
  theta,
  setTheta,
  observable,
  phi,
}: ParameterShiftVisualizerProps) {
  // Generate landscape
  const landscapePoints = useMemo(() => {
    return generate1DLandscape(observable, phi, 60);
  }, [observable, phi]);

  // Width and height of our SVG viewport
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 35;

  const minY = -1;
  const maxY = 1;

  // Mapping coordinates
  const mapX = (t: number) => {
    return paddingX + (t / (2 * Math.PI)) * (width - 2 * paddingX);
  };

  const mapY = (c: number) => {
    const scale = (height - 2 * paddingY) / (maxY - minY);
    return height - paddingY - (c - minY) * scale;
  };

  // Convert points to SVG Path
  const pathD = useMemo(() => {
    if (landscapePoints.length === 0) return '';
    const points = landscapePoints.map((pt) => `${mapX(pt.theta).toFixed(1)},${mapY(pt.cost).toFixed(1)}`);
    return `M ${points.join(' L ')}`;
  }, [landscapePoints]);

  // Retrieve exact shifts
  const shiftData = useMemo(() => {
    return getParameterShiftGradient(theta, phi, observable);
  }, [theta, phi, observable]);

  // Also compute finite difference for comparison
  const fdData = useMemo(() => {
    const h = 0.001;
    const getCostForAngle = (angle: number) => {
      const cos = Math.cos(angle / 2);
      const sin = Math.sin(angle / 2);
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
    };

    const cost0 = getCostForAngle(theta);
    const costPlus = getCostForAngle(theta + h);
    return (costPlus - cost0) / h;
  }, [theta, observable, phi]);

  const currentX = mapX(theta);
  const currentY = mapY(shiftData.costPlus + (shiftData.costMinus - shiftData.costPlus) / 2); // approximate point

  const xPlus = mapX(shiftData.thetaPlus);
  const yPlus = mapY(shiftData.costPlus);

  const xMinus = mapX(shiftData.thetaMinus);
  const yMinus = mapY(shiftData.costMinus);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual Canvas Panel */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          Parameter Shift Points Visualization
        </h3>

        {/* SVG Plot */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible select-none"
          >
            {/* Center line axis */}
            <line
              x1={paddingX}
              y1={mapY(0)}
              x2={width - paddingX}
              y2={mapY(0)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />

            {/* Smooth landscape curve */}
            <path d={pathD} fill="none" stroke="#e2e8f0" strokeWidth="4" />

            {/* X-Axis labels */}
            <text x={mapX(0)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">0</text>
            <text x={mapX(Math.PI / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π/2</text>
            <text x={mapX(Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π</text>
            <text x={mapX((3 * Math.PI) / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">3π/2</text>
            <text x={mapX(2 * Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">2π</text>

            {/* Shift endpoints */}
            {/* Plus Shift point */}
            {shiftData.thetaPlus <= 2 * Math.PI && (
              <>
                <line
                  x1={xPlus}
                  y1={paddingY}
                  x2={xPlus}
                  y2={height - paddingY}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="2,3"
                />
                <circle cx={xPlus} cy={yPlus} r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                <text x={xPlus} y={yPlus - 12} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-600">θ + π/2</text>
              </>
            )}

            {/* Minus Shift point */}
            {shiftData.thetaMinus >= 0 && (
              <>
                <line
                  x1={xMinus}
                  y1={paddingY}
                  x2={xMinus}
                  y2={height - paddingY}
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeDasharray="2,3"
                />
                <circle cx={xMinus} cy={yMinus} r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                <text x={xMinus} y={yMinus - 12} textAnchor="middle" className="text-[9px] font-mono font-bold fill-purple-600">θ - π/2</text>
              </>
            )}

            {/* Reference connecting line between shifts */}
            {shiftData.thetaPlus <= 2 * Math.PI && shiftData.thetaMinus >= 0 && (
              <line
                x1={xMinus}
                y1={yMinus}
                x2={xPlus}
                y2={yPlus}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3,1"
              />
            )}

            {/* Current coordinate node */}
            <circle
              cx={currentX}
              cy={mapY(getParameterShiftGradient(theta, phi, observable).costPlus + (getParameterShiftGradient(theta, phi, observable).costMinus - getParameterShiftGradient(theta, phi, observable).costPlus) / 2)} // estimated center
              r="4"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Draw current true coordinate on curve */}
            <circle
              cx={currentX}
              cy={mapY(getParameterShiftGradient(theta, phi, observable).costPlus + (getParameterShiftGradient(theta, phi, observable).costMinus - getParameterShiftGradient(theta, phi, observable).costPlus) / 2)} // exact placement proxy
              r="7"
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Dynamic numerical validation comparisons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Parameter-Shift Gradient</span>
            <div className="text-xl font-black text-blue-600 mt-1">
              {shiftData.gradient.toFixed(6)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Finite Difference Gradient</span>
            <div className="text-xl font-black text-slate-700 mt-1">
              {fdData.toFixed(6)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Difference (Precision Loss)</span>
            <div className="text-xl font-black text-purple-600 mt-1">
              {Math.abs(shiftData.gradient - fdData).toExponential(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation side panel */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Quantum Gradient Method</h3>
          <p className="text-slate-500 text-xs mt-1">
            Why parameter shift is a quantum breakthrough.
          </p>
        </div>

        {/* Parameter Slider */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Manually Adjust θ
          </label>
          <input
            type="range"
            id="ps-theta-slider"
            min="1.6" // range to keep both shifts inside [0, 2*PI] bounds
            max="4.6"
            step="0.01"
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
          />
          <span className="text-[10px] text-slate-400 block leading-tight">
            Slide to shift points in real-time. The parameter shift rule calculates exact analytical gradients without approximations.
          </span>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Exact vs. Finite Difference</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Classical computers use infinitesimal steps (h) to estimate gradients. However, on noisy quantum hardware, taking a tiny step is impossible because noise overpowers the signal.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Robustness to Noise</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                By shifting parameter angles by a massive step (<b>±π/2</b>), the signal remains highly distinguishable even in noisy hardware, making parameter-shift exact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
