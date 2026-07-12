export type LearnerProfile = 'Foundation' | 'Developing' | 'Ready' | 'Advanced' | null;

export interface ModuleProgress {
  completed: boolean;
  score: number; // For quiz
  attempts: number;
  unlocked: boolean;
}

export interface AppProgress {
  profile: LearnerProfile;
  modules: { [key: number]: ModuleProgress };
  detectedMisconceptions: number[]; // Set of ID integers
}

export interface DiagnosticQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answerIdx: number;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { text: string; misconceptionId?: number; isCorrect?: boolean }[];
  explanation: string;
}

export interface QuantumState {
  alpha: { re: number; im: number };
  beta: { re: number; im: number };
}

export interface Point {
  x: number;
  y: number;
}
