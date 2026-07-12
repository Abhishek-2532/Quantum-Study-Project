import React, { useState, useMemo } from 'react';
import { generate1DLandscape } from '../utils/quantumMath';
import { motion, AnimatePresence } from 'motion/react';
import { Play, TrendingDown, RefreshCw, Info } from 'lucide-react';

interface GradientVisualizerProps {
  theta: number;
  setTheta: (val: number) => void;
  observable: 'PauliX' | 'PauliY' | 'PauliZ';
  phi: number;
}

export default function GradientVisualizer({
  theta,
  setTheta,
  observable,
  phi,
}: GradientVisualizerProps) {
  const [eta, setEta] = useState<number>(0.4); // Learning Rate
  const [stepLog, setStepLog] = useState<{ from: number; to: number; grad: number; cost: number }[]>([]);

  // Generate 60 steps of the landscape for plotting
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

  // Calculate current cost & exact analytical gradient
  // For RY(theta)|0> with PauliZ measurement: cost = cos(theta), gradient = -sin(theta)
  // For other observables and phase: let's compute gradient using infinitesimal step h (finite difference as exact proxy)
  const stats = useMemo(() => {
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
    // Gradient via precise infinitesimal step h
    const h = 0.0001;
    const costPlus = getCostForAngle(theta + h);
    const gradient = (costPlus - cost0) / h;

    return { cost: cost0, gradient };
  }, [theta, observable, phi]);

  const currentX = mapX(theta);
  const currentY = mapY(stats.cost);

  // Tangent line coordinates
  // Equation: y_coord = cost + gradient * (theta_val - theta)
  // We can choose a small delta around theta for plotting: delta_theta = 0.5
  const tangentLine = useMemo(() => {
    const delta = 0.6;
    const tStart = Math.max(0, theta - delta);
    const tEnd = Math.min(2 * Math.PI, theta + delta);

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

    const costStart = stats.cost + stats.gradient * (tStart - theta);
    const costEnd = stats.cost + stats.gradient * (tEnd - theta);

    return {
      x1: mapX(tStart),
      y1: mapY(costStart),
      x2: mapX(tEnd),
      y2: mapY(costEnd),
    };
  }, [theta, stats, observable, phi]);

  // Execute optimization step: θ_new = θ_old - η * gradient
  const takeOptimizationStep = () => {
    let newTheta = theta - eta * stats.gradient;
    // Map to [0, 2*PI] boundary
    if (newTheta < 0) newTheta = 0;
    if (newTheta > 2 * Math.PI) newTheta = 2 * Math.PI;

    setStepLog((prev) => [
      { from: theta, to: newTheta, grad: stats.gradient, cost: stats.cost },
      ...prev.slice(0, 3),
    ]);
    setTheta(newTheta);
  };

  const resetExperiment = () => {
    setTheta(0.5); // starting angle
    setStepLog([]);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Controls panel */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gradient Configuration</h3>
          <p className="text-slate-500 text-xs mt-1">
            Configure learning rate steps to observe how they affect the descent.
          </p>
        </div>

        {/* Learning Rate Preset Panel */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Learning Rate (η / Step Size)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Small', value: 0.05 },
              { label: 'Balanced', value: 0.4 },
              { label: 'Too Large', value: 2.5 },
            ].map((preset) => (
              <button
                key={preset.label}
                id={`preset-${preset.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => setEta(preset.value)}
                className={`py-2 text-center text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                  eta === preset.value
                    ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {eta === 0.05 && 'η = 0.05. Safe and precise, but will take many steps to reach the bottom.'}
            {eta === 0.4 && 'η = 0.40. Optimal step size. Efficiently glides directly to the global minimum.'}
            {eta === 2.5 && 'η = 2.50. Chaotic. Overshoots the valley, oscillating wildly or flying up the hill!'}
          </span>
        </div>

        {/* Dynamic update action */}
        <div className="space-y-2">
          <button
            onClick={takeOptimizationStep}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Take Optimizer Step</span>
          </button>
          <button
            onClick={resetExperiment}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold transition-all py-1 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Experiment
          </button>
        </div>

        {/* Step updates log */}
        {stepLog.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-[11px] font-mono">
            <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">descent log:</span>
            <div className="space-y-1.5 text-slate-600 divide-y divide-slate-200/50">
              {stepLog.map((log, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Step #{stepLog.length - idx}</span>
                    <span className="text-rose-600">Cost: {log.cost.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-0.5">
                    <span>θ: {log.from.toFixed(3)} → {log.to.toFixed(3)}</span>
                    <span>Grad: {log.grad.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vis Canvas Panel */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          descent slope visualizer
        </h3>

        {/* SVG Plot */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible select-none"
          >
            {/* Horizontal line */}
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

            {/* Projected tangent line showing the derivative slope! */}
            <line
              x1={tangentLine.x1}
              y1={tangentLine.y1}
              x2={tangentLine.x2}
              y2={tangentLine.y2}
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="4,2"
              className="shadow"
            />

            {/* X-Axis labels */}
            <text x={mapX(0)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">0</text>
            <text x={mapX(Math.PI / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π/2</text>
            <text x={mapX(Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">π</text>
            <text x={mapX((3 * Math.PI) / 2)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">3π/2</text>
            <text x={mapX(2 * Math.PI)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">2π</text>

            {/* Current coordinate node */}
            <circle
              cx={currentX}
              cy={currentY}
              r="7"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Slope direction arrow indicator */}
            {Math.abs(stats.gradient) > 0.05 && (
              <g transform={`translate(${currentX}, ${currentY - 18})`}>
                <line
                  x1="0"
                  y1="0"
                  x2={stats.gradient > 0 ? -16 : 16}
                  y2="0"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="1"
                />
                <polygon
                  points={stats.gradient > 0 ? '-16,-3 -22,0 -16,3' : '16,-3 22,0 16,3'}
                  fill="#ef4444"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic coordinate stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Angle (θ)</span>
            <span className="text-sm font-extrabold text-slate-900 block mt-0.5">{theta.toFixed(3)}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Slope (dC/dθ)</span>
            <span className={`text-sm font-extrabold block mt-0.5 ${stats.gradient > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.gradient.toFixed(3)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Descent Force</span>
            <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
              {(eta * stats.gradient).toFixed(3)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">direction</span>
            <span className="text-xs font-bold text-slate-700 block mt-1 uppercase">
              {stats.gradient > 0 ? '← Shift Left' : 'Shift Right →'}
            </span>
          </div>
        </div>

        {/* Formula Display Panel */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-mono leading-normal text-slate-300">
            <div className="text-rose-400 font-bold uppercase text-[9px] tracking-wider">the classic mathematical update rule:</div>
            <div className="text-xs mt-0.5">θ_new = θ_old - (η * dC/dθ)</div>
            <p className="text-slate-400 mt-1 font-sans text-[10px]">
              The gradient (dC/dθ) represents the slope at your point. We subtract it multiplied by learning rate (η) to automatically slide down towards the minimum cost valley.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
