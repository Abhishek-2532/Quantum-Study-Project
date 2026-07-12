import React, { useState, useEffect } from 'react';
import { QuantumState } from '../types';
import { getShotBasedExpectation, getExpectation } from '../utils/quantumMath';
import { motion } from 'motion/react';
import { Play, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';

interface OutcomeHistogramProps {
  state: QuantumState;
  observable: 'PauliX' | 'PauliY' | 'PauliZ';
}

export default function OutcomeHistogram({ state, observable }: OutcomeHistogramProps) {
  const [shots, setShots] = useState<number>(100);
  const [exactExpectation, setExactExpectation] = useState<number>(0);
  const [estimatedExpectation, setEstimatedExpectation] = useState<number | null>(null);
  const [counts, setCounts] = useState<{ '+1': number; '-1': number } | null>(null);
  const [runHistory, setRunHistory] = useState<{ shots: number; estimate: number; error: number }[]>([]);

  const calculateExact = () => {
    const exp = getExpectation(state, observable);
    setExactExpectation(exp);
  };

  useEffect(() => {
    calculateExact();
    setEstimatedExpectation(null);
    setCounts(null);
  }, [state, observable]);

  const runExperiment = () => {
    const res = getShotBasedExpectation(state, observable, shots);
    setEstimatedExpectation(res.expectation);
    setCounts(res.counts as { '+1': number; '-1': number });

    const error = Math.abs(exactExpectation - res.expectation);
    setRunHistory((prev) => [
      { shots, estimate: res.expectation, error },
      ...prev.slice(0, 4), // keep last 5
    ]);
  };

  const pPlusTheory = observable === 'PauliZ'
    ? state.alpha.re ** 2 + state.alpha.im ** 2
    : observable === 'PauliX'
    ? ((state.alpha.re + state.beta.re) / Math.sqrt(2)) ** 2 + ((state.alpha.im + state.beta.im) / Math.sqrt(2)) ** 2
    : ((state.alpha.re + state.beta.im) / Math.sqrt(2)) ** 2 + ((state.alpha.im - state.beta.re) / Math.sqrt(2)) ** 2;

  const pMinusTheory = 1 - pPlusTheory;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Simulation Controls Panel */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Shot Configuration</h3>
          <p className="text-slate-500 text-xs mt-1">
            Choose the number of measurement shots (N) to perform on the circuit.
          </p>
        </div>

        {/* Shot Count Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Shots (N)</label>
          <div className="grid grid-cols-2 gap-2">
            {[10, 100, 1000, 10000].map((n) => (
              <button
                key={n}
                onClick={() => setShots(n)}
                className={`py-2 px-3 text-center text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                  shots === n
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n.toLocaleString()} Shots
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={runExperiment}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Execute Measurement</span>
        </button>

        {/* Info Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            The Quantum Principle
          </div>
          <p className="leading-relaxed">
            Quantum mechanics is inherently probabilistic. Real quantum computers must repeat (shot) the circuit <b>N times</b> to build statistics and estimate expectation values.
          </p>
        </div>
      </div>

      {/* Visualizer Panel */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Outcome Distribution
          </h3>

          {/* Histogram Chart */}
          <div className="grid grid-cols-2 gap-8 items-end min-h-[180px] bg-slate-50 p-6 rounded-xl border border-slate-100 relative">
            {/* Legend / Y-Axis indicator */}
            <div className="absolute left-3 top-3 text-[10px] font-mono text-slate-400">
              Probability Distribution
            </div>

            {/* Outcome +1 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full bg-slate-200/50 rounded-lg h-32 relative overflow-hidden flex items-end">
                {/* Theoretical background bar (light pink/cyan) */}
                <div
                  className="w-1/2 bg-slate-300 absolute left-0 bottom-0 transition-all duration-300"
                  style={{ height: `${pPlusTheory * 100}%` }}
                />
                {/* Empirical foreground bar (bold cyan) */}
                {counts && (
                  <motion.div
                    className="w-1/2 bg-cyan-500 absolute right-0 bottom-0 rounded-t shadow-inner"
                    initial={{ height: 0 }}
                    animate={{ height: `${(counts['+1'] / shots) * 100}%` }}
                    transition={{ duration: 0.4, type: 'spring' }}
                  />
                )}
              </div>
              <div className="text-center font-mono text-xs">
                <div className="font-extrabold text-slate-950">Outcome: +1</div>
                <div className="text-[10px] text-slate-400">Theoretical: {(pPlusTheory * 100).toFixed(1)}%</div>
                {counts && (
                  <div className="text-[10px] text-cyan-600 font-bold mt-1">
                    Empirical: {((counts['+1'] / shots) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Outcome -1 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full bg-slate-200/50 rounded-lg h-32 relative overflow-hidden flex items-end">
                {/* Theoretical background bar */}
                <div
                  className="w-1/2 bg-slate-300 absolute left-0 bottom-0 transition-all duration-300"
                  style={{ height: `${pMinusTheory * 100}%` }}
                />
                {/* Empirical foreground bar */}
                {counts && (
                  <motion.div
                    className="w-1/2 bg-purple-500 absolute right-0 bottom-0 rounded-t shadow-inner"
                    initial={{ height: 0 }}
                    animate={{ height: `${(counts['-1'] / shots) * 100}%` }}
                    transition={{ duration: 0.4, type: 'spring' }}
                  />
                )}
              </div>
              <div className="text-center font-mono text-xs">
                <div className="font-extrabold text-slate-950">Outcome: -1</div>
                <div className="text-[10px] text-slate-400">Theoretical: {(pMinusTheory * 100).toFixed(1)}%</div>
                {counts && (
                  <div className="text-[10px] text-purple-600 font-bold mt-1">
                    Empirical: {((counts['-1'] / shots) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Value Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exact Analytical</span>
              <div className="text-2xl font-mono font-black text-slate-950 mt-1">
                {exactExpectation.toFixed(4)}
              </div>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Calculated exactly from statevector</span>
            </div>

            <div className="p-4 bg-cyan-50/50 border border-cyan-100 rounded-xl">
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block">Estimated (N Shots)</span>
              <div className="text-2xl font-mono font-black text-cyan-700 mt-1">
                {estimatedExpectation !== null ? estimatedExpectation.toFixed(4) : '----'}
              </div>
              <span className="text-[9px] text-cyan-500 font-mono block mt-0.5">Average value from empirical shots</span>
            </div>

            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Statistical Error</span>
              <div className="text-2xl font-mono font-black text-purple-700 mt-1">
                {estimatedExpectation !== null ? Math.abs(exactExpectation - estimatedExpectation).toFixed(5) : '----'}
              </div>
              <span className="text-[9px] text-purple-500 font-mono block mt-0.5">Discrepancy (decreases with N)</span>
            </div>
          </div>
        </div>

        {/* Convergence History Table */}
        {runHistory.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Experimental Log (Last 5 Runs)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-2">Run</th>
                    <th className="pb-2">Shots (N)</th>
                    <th className="pb-2">Analytical expectation</th>
                    <th className="pb-2">Empirical estimate</th>
                    <th className="pb-2 text-right">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {runHistory.map((run, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2.5">#{runHistory.length - idx}</td>
                      <td className="py-2.5 font-bold">{run.shots.toLocaleString()}</td>
                      <td className="py-2.5">{exactExpectation.toFixed(4)}</td>
                      <td className="py-2.5 text-cyan-600 font-semibold">{run.estimate.toFixed(4)}</td>
                      <td className="py-2.5 text-right text-purple-600 font-bold">
                        {run.error.toFixed(5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
