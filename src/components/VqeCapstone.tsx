import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getSingleQubitVQE,
  getSingleQubitVQEExact,
  getTwoQubitVQE,
  getTwoQubitGradients,
} from '../utils/quantumMath';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function VqeCapstone() {
  const [level, setLevel] = useState<'Level A' | 'Level B'>('Level A');
  const [params, setParams] = useState<{ t1: number; t2: number }>({ t1: 0.8, t2: 0.5 });
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [energyHistory, setEnergyHistory] = useState<number[]>([]);
  const [stepCounter, setStepCounter] = useState<number>(0);

  const animationRef = useRef<number | null>(null);

  // Level characteristics
  const levelInfo = {
    'Level A': {
      title: 'Single-Qubit Toy Hamiltonian',
      formula: 'H = 0.5 Z + 0.8 X',
      exact: getSingleQubitVQEExact(0.5, 0.8, 0),
      desc: 'Master basic variational principles by adjusting polar angle θ (theta) and relative phase φ (phi) on a single qubit to find the lowest energy.',
    },
    'Level B': {
      title: 'Two-Qubit Educational Hamiltonian',
      formula: 'H = Z₀Z₁ + X₀ + X₁',
      exact: -2.4142135,
      desc: 'Explore multi-qubit entanglement. This Hamiltonian is solved by prepares a CNOT entangled statevector and tuning parameters θ₁ and θ₂.',
    },
  };

  const exactEnergy = levelInfo[level].exact;

  // Reset variables when switching levels
  useEffect(() => {
    cancelAnimationFrame(animationRef.current || 0);
    setIsOptimizing(false);
    setEnergyHistory([]);
    setStepCounter(0);
    if (level === 'Level A') {
      setParams({ t1: 0.8, t2: 0.0 }); // theta, phi
    } else {
      setParams({ t1: 0.8, t2: 0.5 }); // theta1, theta2
    }
  }, [level]);

  // Compute energy dynamically
  const currentEnergy = useMemo(() => {
    if (level === 'Level A') {
      return getSingleQubitVQE(params.t1, params.t2, 0.5, 0.8, 0);
    } else {
      return getTwoQubitVQE(params.t1, params.t2).energy;
    }
  }, [params, level]);

  // Automated VQE Optimization Loop using Adam
  const startOptimization = () => {
    if (isOptimizing) {
      setIsOptimizing(false);
      return;
    }

    setIsOptimizing(true);
    setEnergyHistory([currentEnergy]);
    setStepCounter(0);

    // Optimization hyperparameters
    let t1 = params.t1;
    let t2 = params.t2;

    const eta = 0.08;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;

    let m1 = 0, v1 = 0;
    let m2 = 0, v2 = 0;
    let iteration = 0;

    const optimizeStep = () => {
      iteration++;

      let g1 = 0;
      let g2 = 0;

      // Calculate gradients using parameter shift or finite difference
      if (level === 'Level A') {
        const shift = Math.PI / 2;
        const ePlus1 = getSingleQubitVQE(t1 + shift, t2, 0.5, 0.8, 0);
        const eMinus1 = getSingleQubitVQE(t1 - shift, t2, 0.5, 0.8, 0);
        g1 = 0.5 * (ePlus1 - eMinus1);

        const ePlus2 = getSingleQubitVQE(t1, t2 + shift, 0.5, 0.8, 0);
        const eMinus2 = getSingleQubitVQE(t1, t2 - shift, 0.5, 0.8, 0);
        g2 = 0.5 * (ePlus2 - eMinus2);
      } else {
        const grads = getTwoQubitGradients(t1, t2);
        g1 = grads.grad1;
        g2 = grads.grad2;
      }

      // Adam updater for param 1
      m1 = beta1 * m1 + (1 - beta1) * g1;
      v1 = beta2 * v1 + (1 - beta2) * (g1 ** 2);
      const m1Hat = m1 / (1 - beta1 ** iteration);
      const v1Hat = v1 / (1 - beta2 ** iteration);
      t1 = Math.max(0, Math.min(2 * Math.PI, t1 - (eta / (Math.sqrt(v1Hat) + eps)) * m1Hat));

      // Adam updater for param 2
      m2 = beta1 * m2 + (1 - beta1) * g2;
      v2 = beta2 * v2 + (1 - beta2) * (g2 ** 2);
      const m2Hat = m2 / (1 - beta1 ** iteration);
      const v2Hat = v2 / (1 - beta2 ** iteration);
      t2 = Math.max(0, Math.min(2 * Math.PI, t2 - (eta / (Math.sqrt(v2Hat) + eps)) * m2Hat));

      setParams({ t1, t2 });

      const newEnergy = level === 'Level A'
        ? getSingleQubitVQE(t1, t2, 0.5, 0.8, 0)
        : getTwoQubitVQE(t1, t2).energy;

      setEnergyHistory((prev) => [...prev, newEnergy]);
      setStepCounter(iteration);

      const error = Math.abs(newEnergy - exactEnergy);
      if (iteration < 40 && error > 0.0001) {
        animationRef.current = requestAnimationFrame(optimizeStep);
      } else {
        setIsOptimizing(false);
      }
    };

    animationRef.current = requestAnimationFrame(optimizeStep);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current || 0);
  }, []);

  const errorVal = Math.abs(currentEnergy - exactEnergy);
  const reachedChemicalAccuracy = errorVal < 0.01;

  // Custom SVG line chart scaling for convergence history
  const chartWidth = 480;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const mapX = (idx: number, total: number) => {
    if (total <= 1) return paddingX;
    return paddingX + (idx / (total - 1)) * (chartWidth - 2 * paddingX);
  };

  const mapY = (val: number) => {
    // scale from level exact to start energy or slightly above
    const maxHist = Math.max(...energyHistory, currentEnergy, 0.5);
    const minHist = Math.min(...energyHistory, currentEnergy, exactEnergy - 0.2);
    const scale = (chartHeight - 2 * paddingY) / (maxHist - minHist);
    return chartHeight - paddingY - (val - minHist) * scale;
  };

  const historyPath = useMemo(() => {
    if (energyHistory.length <= 1) return '';
    const points = energyHistory.map((val, idx) => `${mapX(idx, energyHistory.length).toFixed(1)},${mapY(val).toFixed(1)}`);
    return `M ${points.join(' L ')}`;
  }, [energyHistory]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* VQE Config column */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">VQE Configurer</h3>
          <p className="text-slate-500 text-xs mt-1">
            Toggle between educational systems and tune variational knobs.
          </p>
        </div>

        {/* Level Toggles */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['Level A', 'Level B'] as const).map((l) => (
            <button
              key={l}
              id={`lvl-btn-${l.toLowerCase().replace(' ', '-')}`}
              onClick={() => setLevel(l)}
              className={`flex-1 text-center py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                level === l ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {l === 'Level A' ? 'Single-Qubit' : 'Two-Qubit'}
            </button>
          ))}
        </div>

        {/* Level description */}
        <p className="text-xs text-slate-500 leading-normal bg-slate-50 border border-slate-100/50 p-4 rounded-xl">
          <b>{levelInfo[level].title}:</b> {levelInfo[level].desc}
        </p>

        {/* Parameter knobs */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-bold text-slate-500 uppercase">
                {level === 'Level A' ? 'Polar Rotation (θ)' : 'First Rotation (θ₁)'}
              </label>
              <span className="font-mono text-cyan-600 font-extrabold">{params.t1.toFixed(3)} rad</span>
            </div>
            <input
              type="range"
              id="vqe-t1-slider"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={params.t1}
              onChange={(e) => setParams((p) => ({ ...p, t1: parseFloat(e.target.value) }))}
              className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-bold text-slate-500 uppercase">
                {level === 'Level A' ? 'Azimuthal Phase (φ)' : 'Second Rotation (θ₂)'}
              </label>
              <span className="font-mono text-cyan-600 font-extrabold">{params.t2.toFixed(3)} rad</span>
            </div>
            <input
              type="range"
              id="vqe-t2-slider"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={params.t2}
              onChange={(e) => setParams((p) => ({ ...p, t2: parseFloat(e.target.value) }))}
              className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Optimize Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={startOptimization}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isOptimizing
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-100'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-100'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isOptimizing ? 'Stop Optimization' : 'Optimize via VQE'}</span>
          </button>
        </div>
      </div>

      {/* Trajectory and target comparison */}
      <div className="lg:col-span-7 space-y-6">
        {/* Comparison grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Theoretical Ground State</span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {exactEnergy.toFixed(6)}
            </div>
          </div>

          <div className="p-4 bg-cyan-50/50 border border-cyan-100 rounded-2xl">
            <span className="text-[9px] font-bold text-cyan-600 block uppercase">VQE Ansatz Energy</span>
            <div className="text-xl font-black text-cyan-700 mt-1">
              {currentEnergy.toFixed(6)}
            </div>
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
            <span className="text-[9px] font-bold text-purple-600 block uppercase">Energy Error</span>
            <div className="text-xl font-black text-purple-700 mt-1">
              {errorVal.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Energy convergence chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              VQE Energy Convergence History
            </h4>
            {energyHistory.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                Steps: {stepCounter}
              </span>
            )}
          </div>

          {/* SVG Plot */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
            <svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="overflow-visible select-none"
            >
              {/* Ground State target horizontal line */}
              <line
                x1={paddingX}
                y1={mapY(exactEnergy)}
                x2={chartWidth - paddingX}
                y2={mapY(exactEnergy)}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <text
                x={chartWidth - paddingX + 5}
                y={mapY(exactEnergy) + 3}
                className="text-[8px] font-mono fill-emerald-600 font-bold"
              >
                Exact Ground Energy
              </text>

              {/* History trail */}
              {energyHistory.length > 1 ? (
                <>
                  <path d={historyPath} fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" />
                  {energyHistory.map((val, idx) => (
                    <circle key={idx} cx={mapX(idx, energyHistory.length)} cy={mapY(val)} r="3" fill="#06b6d4" />
                  ))}
                </>
              ) : (
                <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" className="text-xs font-mono fill-slate-400 italic">
                  Run VQE Optimization to plot convergence trace...
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Accuracy and Master Badge banner */}
        <AnimatePresence>
          {reachedChemicalAccuracy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-500 text-white p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-emerald-600"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  Chemical Accuracy Met!
                  <CheckCircle2 className="w-4 h-4 fill-white text-emerald-500" />
                </h4>
                <p className="text-emerald-100 text-xs leading-normal mt-0.5">
                  Congratulations! Your variational parameter ansatz has optimized to within chemical accuracy of the true physical ground state energy. You have mastered VQAs!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
