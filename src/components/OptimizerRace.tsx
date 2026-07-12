import React, { useState, useMemo } from 'react';
import { Play, RotateCcw, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface OptimizerRaceProps {
  observable: 'PauliX' | 'PauliY' | 'PauliZ';
  phi: number;
}

export default function OptimizerRace({ observable, phi }: OptimizerRaceProps) {
  const [eta, setEta] = useState<number>(0.1);
  const [startTheta, setStartTheta] = useState<number>(0.5);
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [trajectories, setTrajectories] = useState<{
    gd: { step: number; cost: number; theta: number }[];
    momentum: { step: number; cost: number; theta: number }[];
    adam: { step: number; cost: number; theta: number }[];
  } | null>(null);

  const stepsLimit = 25;

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

  const getGradientForAngle = (angle: number) => {
    const h = 0.0001;
    return (getCostForAngle(angle + h) - getCostForAngle(angle)) / h;
  };

  const triggerRace = () => {
    setIsRacing(true);

    // 1. Simple Gradient Descent
    const gdHistory = [];
    let tGd = startTheta;
    for (let step = 0; step <= stepsLimit; step++) {
      const cost = getCostForAngle(tGd);
      gdHistory.push({ step, cost, theta: tGd });
      const grad = getGradientForAngle(tGd);
      tGd = Math.max(0, Math.min(2 * Math.PI, tGd - eta * grad));
    }

    // 2. Momentum
    const momentumHistory = [];
    let tMom = startTheta;
    let v = 0;
    const gamma = 0.9;
    for (let step = 0; step <= stepsLimit; step++) {
      const cost = getCostForAngle(tMom);
      momentumHistory.push({ step, cost, theta: tMom });
      const grad = getGradientForAngle(tMom);
      v = gamma * v + eta * grad;
      tMom = Math.max(0, Math.min(2 * Math.PI, tMom - v));
    }

    // 3. Adam
    const adamHistory = [];
    let tAdam = startTheta;
    let m = 0;
    let s = 0;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;
    for (let step = 0; step <= stepsLimit; step++) {
      const cost = getCostForAngle(tAdam);
      adamHistory.push({ step, cost, theta: tAdam });
      const grad = getGradientForAngle(tAdam);

      // Adam step
      const k = step + 1;
      m = beta1 * m + (1 - beta1) * grad;
      s = beta2 * s + (1 - beta2) * (grad ** 2);

      const mHat = m / (1 - beta1 ** k);
      const sHat = s / (1 - beta2 ** k);

      tAdam = Math.max(0, Math.min(2 * Math.PI, tAdam - (eta / (Math.sqrt(sHat) + eps)) * mHat));
    }

    setTrajectories({ gd: gdHistory, momentum: momentumHistory, adam: adamHistory });
    setIsRacing(false);
  };

  // Plot scaling
  const width = 500;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const mapX = (step: number) => {
    return paddingX + (step / stepsLimit) * (width - 2 * paddingX);
  };

  const mapY = (cost: number) => {
    // scale from -1 to 1
    const scale = (height - 2 * paddingY) / 2;
    return height - paddingY - (cost - (-1)) * scale;
  };

  const generatePathD = (history: { step: number; cost: number }[]) => {
    const points = history.map((pt) => `${mapX(pt.step).toFixed(1)},${mapY(pt.cost).toFixed(1)}`);
    return `M ${points.join(' L ')}`;
  };

  const paths = useMemo(() => {
    if (!trajectories) return null;
    return {
      gd: generatePathD(trajectories.gd),
      momentum: generatePathD(trajectories.momentum),
      adam: generatePathD(trajectories.adam),
    };
  }, [trajectories]);

  const resetRace = () => {
    setTrajectories(null);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration column */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Optimizer Setup</h3>
          <p className="text-slate-500 text-xs mt-1">
            Tune parameters and trigger the race to see convergence speed!
          </p>
        </div>

        {/* Global Learning Rate slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="font-bold text-slate-500 uppercase">Learning Rate (η)</label>
            <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{eta.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.8"
            step="0.01"
            value={eta}
            onChange={(e) => setEta(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
          />
        </div>

        {/* Starting parameters slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="font-bold text-slate-500 uppercase">Start Angle (θ₀)</label>
            <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{startTheta.toFixed(3)} rad</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="6.0"
            step="0.1"
            value={startTheta}
            onChange={(e) => setStartTheta(parseFloat(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
          />
        </div>

        {/* Start button */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={triggerRace}
            disabled={isRacing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Race! 🏁</span>
          </button>
          <button
            onClick={resetRace}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Legend description cards */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="text-slate-600 leading-normal">
              <b>Gradient Descent (GD)</b>: Direct step down the slope. Highly stable but can get stuck in flat regions or take too long.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
            <div className="text-slate-600 leading-normal">
              <b>Momentum</b>: Adds inertia. Accumulates velocity in direction of descent to pass over flat plateaus.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
            <div className="text-slate-600 leading-normal">
              <b>Adam Optimizer</b>: Adaptive. Calculates learning rates per-step using statistical moving moments. Extremely rapid.
            </div>
          </div>
        </div>
      </div>

      {/* Trajectories visualization canvas */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          convergence trace plot (cost vs. iteration)
        </h3>

        {/* SVG Plot */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible select-none"
          >
            {/* Grid borders and bounds */}
            <line x1={paddingX} y1={mapY(-1)} x2={width - paddingX} y2={mapY(-1)} stroke="#e2e8f0" strokeWidth="1" />
            <line x1={paddingX} y1={mapY(0)} x2={width - paddingX} y2={mapY(0)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={paddingX} y1={mapY(1)} x2={width - paddingX} y2={mapY(1)} stroke="#e2e8f0" strokeWidth="1" />

            {/* Y Axis Labels */}
            <text x={paddingX - 10} y={mapY(1) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">+1.0</text>
            <text x={paddingX - 10} y={mapY(0) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">0.0</text>
            <text x={paddingX - 10} y={mapY(-1) + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">-1.0</text>

            {/* X Axis Labels */}
            <text x={mapX(0)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 0</text>
            <text x={mapX(5)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 5</text>
            <text x={mapX(10)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 10</text>
            <text x={mapX(15)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 15</text>
            <text x={mapX(20)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 20</text>
            <text x={mapX(25)} y={height - paddingY + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Step 25</text>

            {/* Trajectory multi-paths */}
            {trajectories && paths ? (
              <>
                {/* GD path */}
                <path d={paths.gd} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                {trajectories.gd.map((pt, idx) => (
                  <circle key={`gd-${idx}`} cx={mapX(pt.step)} cy={mapY(pt.cost)} r="3" fill="#3b82f6" />
                ))}

                {/* Momentum path */}
                <path d={paths.momentum} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                {trajectories.momentum.map((pt, idx) => (
                  <circle key={`mom-${idx}`} cx={mapX(pt.step)} cy={mapY(pt.cost)} r="3" fill="#a855f7" />
                ))}

                {/* Adam path */}
                <path d={paths.adam} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                {trajectories.adam.map((pt, idx) => (
                  <circle key={`adam-${idx}`} cx={mapX(pt.step)} cy={mapY(pt.cost)} r="3" fill="#f59e0b" />
                ))}
              </>
            ) : (
              <text x={width / 2} y={height / 2} textAnchor="middle" className="text-xs font-mono fill-slate-400 italic">
                Click "Race!" to trace optimizer runs...
              </text>
            )}
          </svg>
        </div>

        {/* Dynamic final comparative leaderboard */}
        {trajectories && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">comparative leaderboard (final cost):</span>
            <div className="grid grid-cols-3 gap-4 font-mono text-center">
              <div className="p-2 border border-blue-100 bg-blue-50/20 rounded-lg">
                <span className="text-[10px] text-blue-500 font-bold block uppercase">Gradient Descent</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {trajectories.gd[stepsLimit].cost.toFixed(5)}
                </div>
              </div>
              <div className="p-2 border border-purple-100 bg-purple-50/20 rounded-lg">
                <span className="text-[10px] text-purple-500 font-bold block uppercase">Momentum</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {trajectories.momentum[stepsLimit].cost.toFixed(5)}
                </div>
              </div>
              <div className="p-2 border border-amber-100 bg-amber-50/20 rounded-lg">
                <span className="text-[10px] text-amber-500 font-bold block uppercase">Adam</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {trajectories.adam[stepsLimit].cost.toFixed(5)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
