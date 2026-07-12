import React, { useState, useEffect, useRef } from 'react';
import { QuantumState } from '../types';
import { getQubitState, getExpectation, getParameterShiftGradient } from '../utils/quantumMath';
import { Play, Pause, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HybridLoopDiagramProps {
  initialTheta?: number;
}

export default function HybridLoopDiagram({ initialTheta = 0.8 }: HybridLoopDiagramProps) {
  const [theta, setTheta] = useState<number>(initialTheta);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [eta] = useState<number>(0.2); // fixed learning rate for simple loop
  const [loopLog, setLoopLog] = useState<{ step: string; type: 'qp' | 'cc'; text: string }[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { id: 0, title: 'State Preparation', desc: 'Prepare RY(θ) |0⟩ state vector', type: 'qp' },
    { id: 1, title: 'Shot Measurement', desc: 'Perform finite trials on the qubit', type: 'qp' },
    { id: 2, title: 'Expectation Estimate', desc: 'Average counts to find C(θ)', type: 'qp' },
    { id: 3, title: 'Shift Evaluations', desc: 'Measure shifts at θ ± π/2', type: 'qp' },
    { id: 4, title: 'Gradient Shift Compute', desc: 'Classical formula for slope dC/dθ', type: 'cc' },
    { id: 5, title: 'Parameter Update', desc: 'Step θ_new = θ_old - η * Gradient', type: 'cc' },
  ];

  // Advancing loop sequence
  const advanceStep = () => {
    setActiveStep((prevStep) => {
      const nextStep = (prevStep + 1) % 6;

      // Handle calculations and log outputs at specific steps
      if (nextStep === 0) {
        setLoopLog((prev) => [
          { step: '0', type: 'qp', text: `[Quantum] Preparing ansatz state: RY(${theta.toFixed(3)})|0⟩` },
          ...prev.slice(0, 5),
        ]);
      } else if (nextStep === 1) {
        setLoopLog((prev) => [
          { step: '1', type: 'qp', text: `[Quantum] Measuring 1,000 shots in Z-basis...` },
          ...prev.slice(0, 5),
        ]);
      } else if (nextStep === 2) {
        const state = getQubitState(theta, 0);
        const expVal = getExpectation(state, 'PauliZ');
        setLoopLog((prev) => [
          { step: '2', type: 'qp', text: `[Quantum] Estimated expectation value ⟨Z⟩: ${expVal.toFixed(4)}` },
          ...prev.slice(0, 5),
        ]);
      } else if (nextStep === 3) {
        const shift = getParameterShiftGradient(theta, 0, 'PauliZ');
        setLoopLog((prev) => [
          { step: '3', type: 'qp', text: `[Quantum] Evaluated shift points: C⁺ = ${shift.costPlus.toFixed(3)}, C⁻ = ${shift.costMinus.toFixed(3)}` },
          ...prev.slice(0, 5),
        ]);
      } else if (nextStep === 4) {
        const shift = getParameterShiftGradient(theta, 0, 'PauliZ');
        setLoopLog((prev) => [
          { step: '4', type: 'cc', text: `[Classical] Computed parameter-shift gradient: ${shift.gradient.toFixed(4)}` },
          ...prev.slice(0, 5),
        ]);
      } else if (nextStep === 5) {
        const shift = getParameterShiftGradient(theta, 0, 'PauliZ');
        const updateAmount = eta * shift.gradient;
        const nextTheta = Math.max(0, Math.min(2 * Math.PI, theta - updateAmount));

        setLoopLog((prev) => [
          { step: '5', type: 'cc', text: `[Classical] Applied update: θ = ${theta.toFixed(3)} → ${nextTheta.toFixed(3)}` },
          ...prev.slice(0, 5),
        ]);
        setTheta(nextTheta); // perform update
      }

      return nextStep;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(advanceStep, 1200); // 1.2s step cycle
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, theta]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const manualStep = () => {
    setIsPlaying(false);
    advanceStep();
  };

  const resetLoop = () => {
    setIsPlaying(false);
    setTheta(0.8);
    setActiveStep(0);
    setLoopLog([]);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Loop control & console logs */}
      <div className="lg:col-span-5 bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-mono font-bold text-cyan-400 tracking-wider uppercase">
            Hybrid Loop Command Center
          </h3>
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
            Active State
          </span>
        </div>

        {/* Current State Info */}
        <div className="bg-slate-900/60 p-4 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 uppercase block tracking-wider text-[9px]">Parameter (θ)</span>
            <span className="text-lg font-mono font-black text-slate-100">{theta.toFixed(4)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 uppercase block tracking-wider text-[9px]">Status</span>
            <span className={`text-xs font-bold uppercase ${isPlaying ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isPlaying ? '● Running' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Playback Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={togglePlayback}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Loop'}</span>
          </button>

          <button
            onClick={manualStep}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>Single Step</span>
          </button>

          <button
            onClick={resetLoop}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Loop Log Console */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Loop Console Logs</span>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-48 overflow-y-auto space-y-2 font-mono text-xs">
            <AnimatePresence>
              {loopLog.length === 0 ? (
                <div className="text-slate-500 italic h-full flex items-center justify-center text-center">
                  Click 'Play Loop' or 'Single Step' to start execution flow...
                </div>
              ) : (
                loopLog.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`leading-normal border-l-2 pl-2 py-0.5 ${
                      log.type === 'qp' ? 'text-cyan-400 border-cyan-500' : 'text-purple-400 border-purple-500'
                    }`}
                  >
                    {log.text}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Synchronized visual chain flowchart */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          Synchronized Visual Loop Flowchart
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantum Processor Section */}
          <div className="bg-cyan-50/40 border border-cyan-100 p-4 rounded-xl space-y-3">
            <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-wider block">Quantum Processor (QP)</span>
            <div className="space-y-2">
              {steps.filter(s => s.type === 'qp').map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-cyan-500 border-cyan-600 text-white shadow shadow-cyan-200 scale-[1.02]'
                        : 'bg-white border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold font-mono flex items-center justify-center ${
                      isActive ? 'bg-white text-cyan-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.id + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{step.title}</h4>
                      <p className={`text-[10px] ${isActive ? 'text-cyan-100' : 'text-slate-400'} mt-0.5`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Classical Processor Section */}
          <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-xl space-y-3">
            <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">Classical Computer (CC)</span>
            <div className="space-y-2">
              {steps.filter(s => s.type === 'cc').map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-purple-500 border-purple-600 text-white shadow shadow-purple-200 scale-[1.02]'
                        : 'bg-white border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold font-mono flex items-center justify-center ${
                      isActive ? 'bg-white text-purple-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.id + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{step.title}</h4>
                      <p className={`text-[10px] ${isActive ? 'text-purple-100' : 'text-slate-400'} mt-0.5`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic central loop message */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs flex gap-2.5 items-center">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Dynamic Synchronization In Action</h4>
            <p className="text-slate-500 leading-normal mt-0.5">
              Notice how <b>θ</b> acts as the feedback hook: it gets updated by the classical computer, prepared in the quantum simulator, evaluated to estimate expectation values, and back again to continuous optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
