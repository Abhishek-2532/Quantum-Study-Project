import React, { useState } from 'react';
import { DiagnosticQuestion, LearnerProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Award, BookOpen } from 'lucide-react';

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'math_01',
    topic: 'Complex Numbers',
    question: 'What is the magnitude (absolute value) of the complex number c = 0.6 + 0.8i?',
    options: ['1.0', '1.4', '0.48', '0.14'],
    answerIdx: 0,
    explanation: 'The magnitude of a complex number a + bi is calculated as sqrt(a² + b²). Here, sqrt(0.6² + 0.8²) = sqrt(0.36 + 0.64) = sqrt(1.0) = 1.0.',
  },
  {
    id: 'vec_02',
    topic: '2D Coordinates',
    question: 'If you rotate the vector |v⟩ = [1, 0]ᵀ (pointing along the x-axis) by 90 degrees counter-clockwise in the 2D plane, what vector do you get?',
    options: ['[0, 1]ᵀ', '[1, 1]ᵀ', '[0, 0]ᵀ', '[-1, 0]ᵀ'],
    answerIdx: 0,
    explanation: 'A 90-degree counter-clockwise rotation maps the x-axis [1, 0]ᵀ directly onto the y-axis [0, 1]ᵀ.',
  },
  {
    id: 'prob_03',
    topic: 'Probability Foundations',
    question: 'If a quantum measurement yields state |0⟩ with a probability of 0.75, what is the probability of obtaining the state |1⟩?',
    options: ['0.25', '0.50', '0.75', '1.00'],
    answerIdx: 0,
    explanation: 'The sum of all possible mutually exclusive outcomes must equal 1.0. Therefore, P(|1⟩) = 1.0 - P(|0⟩) = 1.0 - 0.75 = 0.25.',
  },
  {
    id: 'mat_04',
    topic: 'Matrix Vector Multiplication',
    question: 'If the matrix X = [[0, 1], [1, 0]] acts on the state vector |v⟩ = [1, 0]ᵀ, what is the resulting vector?',
    options: ['[0, 1]ᵀ', '[1, 0]ᵀ', '[1, 1]ᵀ', '[0, 0]ᵀ'],
    answerIdx: 0,
    explanation: 'Multiplying the row [0, 1] by the column vector [1, 0]ᵀ gives 0, and row [1, 0] by [1, 0]ᵀ gives 1, resulting in [0, 1]ᵀ. This is the NOT gate!',
  },
  {
    id: 'quant_05',
    topic: 'Superposition Normalization',
    question: 'In quantum mechanics, a qubit state is |ψ⟩ = α|0⟩ + β|1⟩. What mathematical condition must the complex coefficients α and β always satisfy?',
    options: ['|α|² + |β|² = 1', '|α| + |β| = 1', 'α = β', 'α² + β² = 0'],
    answerIdx: 0,
    explanation: 'Since |α|² is the probability of measuring |0⟩ and |β|² is the probability of measuring |1⟩, their sum must equal 1.0 due to probability normalization.',
  },
  {
    id: 'trig_06',
    topic: 'Trigonometry',
    question: 'What is the value of cos(π/2) and sin(π/2)?',
    options: ['cos(π/2) = 0, sin(π/2) = 1', 'cos(π/2) = 1, sin(π/2) = 0', 'cos(π/2) = 0.5, sin(π/2) = 0.5', 'cos(π/2) = -1, sin(π/2) = 0'],
    answerIdx: 0,
    explanation: 'At an angle of 90 degrees (π/2 radians), the cosine (x-coordinate on unit circle) is 0, and the sine (y-coordinate) is 1.',
  },
  {
    id: 'mat_07',
    topic: 'Identity Matrix',
    question: 'Which of the following describes the Identity Matrix I, which leaves any vector unchanged?',
    options: ['[[1, 0], [0, 1]]', '[[0, 1], [1, 0]]', '[[0, 0], [0, 0]]', '[[1, 1], [1, 1]]'],
    answerIdx: 0,
    explanation: 'The identity matrix has 1s on its main diagonal and 0s elsewhere: I * |v⟩ = |v⟩.',
  },
  {
    id: 'space_08',
    topic: 'State Space',
    question: 'Unlike a classical bit which can only be in state 0 or 1, what is the state space of a single qubit?',
    options: ['A continuous sphere of superpositions', 'A continuous line segment', 'Two extra states (2 and 3)', 'Four discrete values'],
    answerIdx: 0,
    explanation: 'A qubit can be in an infinite number of superpositions, geometrically mapped onto the surface of a three-dimensional Bloch Sphere.',
  },
];

interface DiagnosticQuizProps {
  onComplete: (profile: LearnerProfile, score: number) => void;
}

export default function DiagnosticQuiz({ onComplete }: DiagnosticQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentIdx];

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOpt(idx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null || isSubmitted) return;
    setIsSubmitted(true);
    if (selectedOpt === currentQuestion.answerIdx) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setIsSubmitted(false);
    if (currentIdx < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const getProfile = (finalScore: number): LearnerProfile => {
    if (finalScore >= 7) return 'Advanced';
    if (finalScore >= 5) return 'Ready';
    if (finalScore >= 3) return 'Developing';
    return 'Foundation';
  };

  const handleFinish = () => {
    const profile = getProfile(score);
    onComplete(profile, score);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Module 0: Prerequisite Diagnostic</h2>
          <p className="text-slate-400 text-xs mt-1">Evaluating your mathematical & quantum foundations</p>
        </div>
        {!quizFinished && (
          <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
            Question {currentIdx + 1} of {DIAGNOSTIC_QUESTIONS.length}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!quizFinished ? (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Topic label */}
            <div className="inline-block px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full mb-3">
              {currentQuestion.topic}
            </div>

            {/* Question */}
            <h3 className="text-lg font-semibold text-slate-950 leading-snug mb-6">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, idx) => {
                let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                if (selectedOpt === idx) {
                  btnStyle = 'border-cyan-500 bg-cyan-50 text-cyan-900 font-medium';
                }
                if (isSubmitted) {
                  if (idx === currentQuestion.answerIdx) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                  } else if (selectedOpt === idx) {
                    btnStyle = 'border-rose-300 bg-rose-50 text-rose-900';
                  } else {
                    btnStyle = 'border-slate-100 text-slate-400 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={idx}
                    id={`opt-btn-${idx}`}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isSubmitted && idx === currentQuestion.answerIdx && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                    {isSubmitted && selectedOpt === idx && idx !== currentQuestion.answerIdx && (
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions & Explanations */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 text-sm text-slate-700 leading-relaxed"
                >
                  <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    {selectedOpt === currentQuestion.answerIdx ? (
                      <span className="text-emerald-700 flex items-center gap-1">Correct!</span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">Incorrect</span>
                    )}
                  </p>
                  <p>{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              {!isSubmitted ? (
                <button
                  id="submit-diagnostic"
                  onClick={handleSubmit}
                  disabled={selectedOpt === null}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  id="next-diagnostic"
                  onClick={handleNext}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentIdx < DIAGNOSTIC_QUESTIONS.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Diagnostic Completed!</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              You correctly answered <b>{score} out of {DIAGNOSTIC_QUESTIONS.length}</b> questions.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 max-w-md mx-auto mb-8">
              <div className="text-xs text-slate-400 uppercase font-mono tracking-wider mb-1">Your Diagnostic Placement</div>
              <div className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                {getProfile(score)} Learner
              </div>
              <div className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
                {score >= 7 && 'Exceptional baseline. You are fully ready to master Variational Quantum Algorithms with high math proficiency.'}
                {score >= 5 && score < 7 && 'Solid background. You possess the essential prerequisites and will transition smoothly into our active lab modules.'}
                {score >= 3 && score < 5 && 'Developing background. We recommend spending extra time on Module 1 and 2 theory before moving to landscapes.'}
                {score < 3 && 'Foundations track. VQA-Lab will provide rich step-by-step intuitive tools to build your conceptual math models from scratch.'}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                id="retry-diagnostic"
                onClick={() => {
                  setCurrentIdx(0);
                  setSelectedOpt(null);
                  setIsSubmitted(false);
                  setScore(0);
                  setQuizFinished(false);
                }}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Quiz
              </button>
              <button
                id="finish-diagnostic"
                onClick={handleFinish}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-100 flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Enter the VQA Lab
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
