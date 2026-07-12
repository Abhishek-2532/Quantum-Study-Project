import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Compass,
  Sliders,
  BarChart3,
  TrendingDown,
  Activity,
  Award,
  BookMarked,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  HelpCircle,
  HelpCircleIcon
} from 'lucide-react';

// Custom component imports
import DiagnosticQuiz from './components/DiagnosticQuiz';
import BlochSphere from './components/BlochSphere';
import CircuitVisualizer from './components/CircuitVisualizer';
import OutcomeHistogram from './components/OutcomeHistogram';
import CostLandscape from './components/CostLandscape';
import GradientVisualizer from './components/GradientVisualizer';
import ParameterShiftVisualizer from './components/ParameterShiftVisualizer';
import HybridLoopDiagram from './components/HybridLoopDiagram';
import OptimizerRace from './components/OptimizerRace';
import VqeCapstone from './components/VqeCapstone';

import { getQubitState } from './utils/quantumMath';
import { QuantumState } from './types';

export default function App() {
  const [activeModule, setActiveModule] = useState<number>(0);
  const [theta, setTheta] = useState<number>(0.8);
  const [phi, setPhi] = useState<number>(0.0);
  const [gateType, setGateType] = useState<'RX' | 'RY' | 'RZ'>('RY');
  const [observable, setObservable] = useState<'PauliX' | 'PauliY' | 'PauliZ'>('PauliZ');
  const [completedModules, setCompletedModules] = useState<number[]>([0]); // diagnostics pre-unlocked
  const [learnerPoints, setLearnerPoints] = useState<number>(0);

  // Synchronize statevector based on polar parameters
  const state: QuantumState = React.useMemo(() => {
    return getQubitState(theta, phi);
  }, [theta, phi]);

  const modules = [
    { id: 0, title: 'Prerequisite Diagnosis', icon: BookMarked, badge: 'P0 Entrance' },
    { id: 1, title: 'Qubit & Bloch Sphere', icon: Compass, badge: 'Quantum State' },
    { id: 2, title: 'Parameterized Circuits', icon: Sliders, badge: 'Ansatz Setup' },
    { id: 3, title: 'Measurement & Shots', icon: BarChart3, badge: 'Finite Shots' },
    { id: 4, title: 'Cost Landscapes', icon: Activity, badge: '1D Landscapes' },
    { id: 5, title: 'Gradient Descent Slopes', icon: TrendingDown, badge: 'Update Rules' },
    { id: 6, title: 'Parameter-Shift Rule', icon: Layers, badge: 'Quantum Gradient' },
    { id: 7, title: 'Closed Hybrid Loop', icon: RefreshCw, badge: 'Flagship Loop' },
    { id: 8, title: 'Optimizer Comparison', icon: Sliders, badge: 'GD vs. Adam' },
    { id: 9, title: 'VQE Capstone Lab', icon: Award, badge: 'Level A/B' },
  ];

  // Load persistence
  useEffect(() => {
    const savedProgress = localStorage.getItem('vqa_lab_progress');
    const savedPoints = localStorage.getItem('vqa_lab_points');
    if (savedProgress) {
      setCompletedModules(JSON.parse(savedProgress));
    }
    if (savedPoints) {
      setLearnerPoints(parseInt(savedPoints));
    }
  }, []);

  const completeModule = (id: number, points: number) => {
    if (!completedModules.includes(id)) {
      const nextProgress = [...completedModules, id];
      setCompletedModules(nextProgress);
      localStorage.setItem('vqa_lab_progress', JSON.stringify(nextProgress));
    }
    const nextPoints = learnerPoints + points;
    setLearnerPoints(nextPoints);
    localStorage.setItem('vqa_lab_points', nextPoints.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white py-5 px-6 shadow-md border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/30 to-purple-900/30 opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              VQA-Lab
              <span className="text-xs bg-cyan-500 text-slate-950 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Quantum EdChallenge
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Interactive Variational Quantum Algorithm Laboratory. Bridging mathematical intuition with quantum execution.
            </p>
          </div>

          {/* User profile persistence statistics */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Learner Score</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono">
                {learnerPoints} XP
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Labs Unlocked</span>
              <span className="text-base font-extrabold text-purple-400">
                {completedModules.length} / 10
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-start">
        {/* Left Hand Modular Nav Sidebar */}
        <nav className="lg:col-span-3 space-y-2 lg:sticky lg:top-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-4 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            VQA Learning Cycle
          </h2>

          <div className="space-y-1">
            {modules.map((m) => {
              const isCurrent = activeModule === m.id;
              const isCompleted = completedModules.includes(m.id);
              const Icon = m.icon;

              return (
                <button
                  key={m.id}
                  id={`nav-module-${m.id}`}
                  onClick={() => setActiveModule(m.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                    isCurrent
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold leading-none">{m.title}</h3>
                      <span className={`text-[9px] font-mono mt-1 block uppercase tracking-wider ${
                        isCurrent ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                        {m.badge}
                      </span>
                    </div>
                  </div>
                  {isCompleted && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Core Laboratory Workspace Panels */}
        <main className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* MODULE 0: DIAGNOSTIC QUIZ */}
              {activeModule === 0 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Diagnostic Entrance Exam</h2>
                    <p className="text-slate-500 text-xs mt-1.5">
                      Assess your pre-requisite knowledge in linear algebra and complex amplitudes before entering the quantum landscape. Correct answers yield XP points.
                    </p>
                  </div>
                  <DiagnosticQuiz onComplete={() => completeModule(0, 100)} />
                </div>
              )}

              {/* MODULE 1: QUBIT & BLOCH SPHERE */}
              {activeModule === 1 && (
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Lab 1: Qubit & Bloch Sphere</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      A quantum bit (qubit) statevector is represented as |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. It is plotted as coordinates on a 3D unit sphere called the Bloch Sphere. Drag the sliders to see coordinates, amplitudes, and polar angles map dynamically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bloch sphere rendering widget */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Interactive Bloch Sphere</span>
                      <BlochSphere theta={theta} phi={phi} />
                    </div>

                    {/* Numerical State Vector card */}
                    <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">Quantum State Vector |ψ⟩</span>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-center">
                          <span className="text-sm text-slate-400">|ψ⟩ = </span>
                          <span className="text-lg font-black text-white">
                            ({state.alpha.re.toFixed(3)})|0⟩ + ({state.beta.re.toFixed(3)} {state.beta.im >= 0 ? '+' : '-'} {Math.abs(state.beta.im).toFixed(3)}i)|1⟩
                          </span>
                        </div>

                        {/* Probabilities indicators */}
                        <div className="space-y-3 font-mono text-xs">
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Probability P(|0⟩)</span>
                              <span className="text-cyan-400 font-bold">{( (state.alpha.re**2 + state.alpha.im**2) * 100 ).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-400" style={{ width: `${(state.alpha.re**2 + state.alpha.im**2) * 100}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Probability P(|1⟩)</span>
                              <span className="text-purple-400 font-bold">{( (state.beta.re**2 + state.beta.im**2) * 100 ).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400" style={{ width: `${(state.beta.re**2 + state.beta.im**2) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manual control sliders */}
                      <div className="space-y-4 pt-4 border-t border-slate-900">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <label className="text-slate-400 uppercase font-bold">Polar Angle (θ)</label>
                            <span className="text-cyan-400 font-mono">{(theta).toFixed(3)} rad</span>
                          </div>
                          <input
                            type="range"
                            id="polar-theta"
                            min="0"
                            max={Math.PI}
                            step="0.01"
                            value={theta}
                            onChange={(e) => setTheta(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <label className="text-slate-400 uppercase font-bold">Azimuthal Phase (φ)</label>
                            <span className="text-purple-400 font-mono">{(phi).toFixed(3)} rad</span>
                          </div>
                          <input
                            type="range"
                            id="azimuthal-phi"
                            min="0"
                            max={2 * Math.PI}
                            step="0.01"
                            value={phi}
                            onChange={(e) => setPhi(parseFloat(e.target.value))}
                            className="w-full accent-purple-400 cursor-pointer"
                          />
                        </div>

                        <button
                          onClick={() => completeModule(1, 100)}
                          className="w-full py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Unlock Next Module (+100 XP)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: PARAMETERIZED CIRCUITS */}
              {activeModule === 2 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 2: Parameterized Circuits</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      We model quantum gates as unitary matrices U(θ) applied to statevectors. Switch between RX, RY, or RZ rotation gates and see how the mathematical unitary changes.
                    </p>
                  </div>
                  <CircuitVisualizer
                    theta={theta}
                    setTheta={setTheta}
                    gateType={gateType}
                    setGateType={setGateType}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(2, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 3: MEASUREMENT & SHOTS */}
              {activeModule === 3 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Lab 3: Exact vs. Shot-Based Measurement</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Contrast continuous analytical expectation values with discrete, binary measurement outcomes. Select an observable, configure shot numbers (N), and run experiments.
                    </p>
                    <div className="flex gap-2">
                      {(['PauliX', 'PauliY', 'PauliZ'] as const).map((obs) => (
                        <button
                          key={obs}
                          onClick={() => setObservable(obs)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                            observable === obs
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {obs}
                        </button>
                      ))}
                    </div>
                  </div>
                  <OutcomeHistogram state={state} observable={observable} />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(3, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 4: COST LANDSCAPES */}
              {activeModule === 4 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 4: Cost Landscapes</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Evaluating continuous expectation values as a function of theta maps a 1D cost landscape. Your task is to adjust theta to guide the state (red dot) to the global energy minimum (green target).
                    </p>
                  </div>
                  <CostLandscape
                    theta={theta}
                    setTheta={setTheta}
                    observable={observable}
                    phi={phi}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(4, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 5: GRADIENT DESCENT SLOPES */}
              {activeModule === 5 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 5: Gradient Descent & Learning Rates</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Trace tangents on the landscape representing slope derivatives. Choose high/low step sizes and take optimizer steps to descend down hills and valleys.
                    </p>
                  </div>
                  <GradientVisualizer
                    theta={theta}
                    setTheta={setTheta}
                    observable={observable}
                    phi={phi}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(5, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 6: PARAMETER-SHIFT RULE */}
              {activeModule === 6 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 6: The Parameter-Shift Rule</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      How can quantum computers evaluate exact derivatives without mathematical approximations? By measuring expectations at shifted angles θ ± π/2, we calculate analytical slopes exactly.
                    </p>
                  </div>
                  <ParameterShiftVisualizer
                    theta={theta}
                    setTheta={setTheta}
                    observable={observable}
                    phi={phi}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(6, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 7: CLOSED HYBRID LOOP */}
              {activeModule === 7 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 7: The Hybrid Loop Closed Cycle</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Bridge the fundamental educational gap. Observe the circular feedback loop between quantum processors measuring shots and classical machines running gradient-shift updates.
                    </p>
                  </div>
                  <HybridLoopDiagram initialTheta={0.8} />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(7, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 8: OPTIMIZER COMPARISON */}
              {activeModule === 8 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 8: Optimizer Race Tracker</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Compare standard Gradient Descent, Momentum-based acceleration, and advanced adaptive Adam side-by-side to solve physical state energies.
                    </p>
                  </div>
                  <OptimizerRace observable={observable} phi={phi} />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(8, 100)}
                      className="py-3 px-6 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Unlock Next Module (+100 XP)
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 9: VQE CAPSTONE LAB */}
              {activeModule === 9 && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Lab 9: VQE Capstone Laboratory</h2>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Bring all your skills together. Run full closed-loop variational optimization on a single-qubit toy molecule or scale up to multi-qubit entangled states to meet chemical accuracy targets!
                    </p>
                  </div>
                  <VqeCapstone />
                  <div className="flex justify-end">
                    <button
                      onClick={() => completeModule(9, 200)}
                      className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                      <Award className="w-5 h-5" />
                      Complete Challenge & Graduate!
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Humble educational footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          VQA-Lab • Developed for the WISER Global Quantum+AI Program 2026 Quantum Education Challenge. Open source and validated against exact analytical physical metrics.
        </div>
      </footer>
    </div>
  );
}
