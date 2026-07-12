import { QuantumState } from '../types';

// Statevector representation for single qubit
// |psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>
export function getQubitState(theta: number, phi: number): QuantumState {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    alpha: { re: cos, im: 0 },
    beta: { re: Math.cos(phi) * sin, im: Math.sin(phi) * sin },
  };
}

// Complex conjugate multiplication helper
// Re(a * b*)
export function getReConjugateProduct(
  a: { re: number; im: number },
  b: { re: number; im: number }
): number {
  // a * b* = (a_re + i a_im) * (b_re - i b_im)
  //        = (a_re * b_re + a_im * b_im) + i (a_im * b_re - a_re * b_im)
  return a.re * b.re + a.im * b.im;
}

// Im(a * b*)
export function getImConjugateProduct(
  a: { re: number; im: number },
  b: { re: number; im: number }
): number {
  return a.im * b.re - a.re * b.im;
}

// Expectation value for X, Y, Z
export function getExpectation(
  state: QuantumState,
  observable: 'PauliX' | 'PauliY' | 'PauliZ'
): number {
  const p0 = state.alpha.re ** 2 + state.alpha.im ** 2;
  const p1 = state.beta.re ** 2 + state.beta.im ** 2;

  if (observable === 'PauliZ') {
    return p0 - p1;
  } else if (observable === 'PauliX') {
    return 2 * getReConjugateProduct(state.alpha, state.beta);
  } else if (observable === 'PauliY') {
    // Note: Y = [[0, -i], [i, 0]]
    // <psi|Y|psi> = 2 * Im(alpha * beta*)
    return 2 * getImConjugateProduct(state.alpha, state.beta);
  }
  return 0;
}

// Simulate single measurement outcome (returns +1 or -1)
export function runSingleMeasurement(state: QuantumState): number {
  const p0 = state.alpha.re ** 2 + state.alpha.im ** 2;
  return Math.random() < p0 ? 1 : -1;
}

// Simulated expectation value with specified shots
export function getShotBasedExpectation(
  state: QuantumState,
  observable: 'PauliX' | 'PauliY' | 'PauliZ',
  shots: number
): { expectation: number; counts: { [key: string]: number } } {
  // To perform measurement in the corresponding basis, we apply base rotations
  // For PauliZ: measure in computational basis directly
  // For PauliX: apply H (Hadamard) before Z measurement
  // For PauliY: apply HS* (or Rx(pi/2)) before Z measurement
  // Equivalent: get the transformed state or map outcomes directly using probability of finding +1 or -1
  
  let pPlus = 0; // Probability of getting +1 eigenvalue
  
  if (observable === 'PauliZ') {
    pPlus = state.alpha.re ** 2 + state.alpha.im ** 2;
  } else if (observable === 'PauliX') {
    // Under Hadamard: |0> -> ( |0> + |1> ) / sqrt(2), |1> -> ( |0> - |1> ) / sqrt(2)
    // Transformed state coefficients:
    // alpha' = (alpha + beta) / sqrt(2)
    // pPlus = |alpha'|^2
    const re = (state.alpha.re + state.beta.re) / Math.sqrt(2);
    const im = (state.alpha.im + state.beta.im) / Math.sqrt(2);
    pPlus = re ** 2 + im ** 2;
  } else if (observable === 'PauliY') {
    // Under Y basis rotation (rotation by Rx(pi/2)):
    // alpha' = (alpha - i * beta) / sqrt(2)
    // pPlus = |alpha'|^2
    // alpha - i * beta = (alpha_re + i alpha_im) - i * (beta_re + i beta_im)
    //                  = (alpha_re + beta_im) + i * (alpha_im - beta_re)
    const re = (state.alpha.re + state.beta.im) / Math.sqrt(2);
    const im = (state.alpha.im - state.beta.re) / Math.sqrt(2);
    pPlus = re ** 2 + im ** 2;
  }

  let plusCounts = 0;
  for (let i = 0; i < shots; i++) {
    if (Math.random() < pPlus) {
      plusCounts++;
    }
  }

  const minusCounts = shots - plusCounts;
  const expectation = (plusCounts * 1 + minusCounts * (-1)) / shots;

  return {
    expectation,
    counts: {
      '+1': plusCounts,
      '-1': minusCounts,
    },
  };
}

// Generate 1D cost landscape points
export function generate1DLandscape(
  observable: 'PauliX' | 'PauliY' | 'PauliZ',
  phi: number,
  resolution: number = 60
): { theta: number; cost: number }[] {
  const data = [];
  for (let i = 0; i <= resolution; i++) {
    const theta = (i / resolution) * 2 * Math.PI;
    const state = getQubitState(theta, phi);
    const cost = getExpectation(state, observable);
    data.push({ theta, cost });
  }
  return data;
}

// Parameter-Shift Rule calculation
export function getParameterShiftGradient(
  theta: number,
  phi: number,
  observable: 'PauliX' | 'PauliY' | 'PauliZ'
): {
  gradient: number;
  thetaPlus: number;
  costPlus: number;
  thetaMinus: number;
  costMinus: number;
} {
  const thetaPlus = theta + Math.PI / 2;
  const thetaMinus = theta - Math.PI / 2;

  const statePlus = getQubitState(thetaPlus, phi);
  const stateMinus = getQubitState(thetaMinus, phi);

  const costPlus = getExpectation(statePlus, observable);
  const costMinus = getExpectation(stateMinus, observable);

  // grad = 0.5 * (C(theta + pi/2) - C(theta - pi/2))
  const gradient = 0.5 * (costPlus - costMinus);

  return {
    gradient,
    thetaPlus,
    costPlus,
    thetaMinus,
    costMinus,
  };
}

// Gate Matrix elements for RY, RX, RZ
export function getGateMatrix(
  gateType: 'RX' | 'RY' | 'RZ',
  theta: number
): { re: number; im: number }[][] {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);

  if (gateType === 'RY') {
    return [
      [{ re: cos, im: 0 }, { re: -sin, im: 0 }],
      [{ re: sin, im: 0 }, { re: cos, im: 0 }],
    ];
  } else if (gateType === 'RX') {
    return [
      [{ re: cos, im: 0 }, { re: 0, im: -sin }],
      [{ re: 0, im: -sin }, { re: cos, im: 0 }],
    ];
  } else {
    // RZ
    const cosHalf = Math.cos(theta / 2);
    const sinHalf = Math.sin(theta / 2);
    return [
      [{ re: cosHalf, im: -sinHalf }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: cosHalf, im: sinHalf }],
    ];
  }
}

// VQE Capstone calculations
// Level A: Hamiltonian H = c_Z * Z + c_X * X + c_Y * Y
export function getSingleQubitVQE(
  theta: number,
  phi: number,
  c_Z: number = 0.5,
  c_X: number = 0.8,
  c_Y: number = 0.0
): number {
  const state = getQubitState(theta, phi);
  const expZ = getExpectation(state, 'PauliZ');
  const expX = getExpectation(state, 'PauliX');
  const expY = getExpectation(state, 'PauliY');

  return c_Z * expZ + c_X * expX + c_Y * expY;
}

// Exact Ground State Energy for Level A
export function getSingleQubitVQEExact(
  c_Z: number = 0.5,
  c_X: number = 0.8,
  c_Y: number = 0.0
): number {
  // Matrix H = [[c_Z, c_X - i c_Y], [c_X + i c_Y, -c_Z]]
  // Eigenvalues: +/- sqrt(c_Z^2 + c_X^2 + c_Y^2)
  return -Math.sqrt(c_Z ** 2 + c_X ** 2 + c_Y ** 2);
}

// Level B: Hamiltonian H = Z0 Z1 + X0 + X1
// Ansatz: CNOT * (RY(theta1) \otimes RY(theta2)) |00>
export function getTwoQubitVQE(theta1: number, theta2: number): {
  energy: number;
  statevector: number[];
  p00: number;
  p01: number;
  p10: number;
  p11: number;
  expZZ: number;
  expX0: number;
  expX1: number;
} {
  // Elements of statevector:
  const s0 = Math.cos(theta1 / 2) * Math.cos(theta2 / 2);
  const s1 = Math.cos(theta1 / 2) * Math.sin(theta2 / 2);
  const s2 = Math.sin(theta1 / 2) * Math.sin(theta2 / 2);
  const s3 = Math.sin(theta1 / 2) * Math.cos(theta2 / 2);

  const p00 = s0 ** 2;
  const p01 = s1 ** 2;
  const p10 = s2 ** 2; // binary indices after CNOT mapping: |10> index 2
  const p11 = s3 ** 2; // binary indices after CNOT mapping: |11> index 3

  const expZZ = p00 - p01 - p10 + p11;
  const expX0 = 2 * (s0 * s2 + s1 * s3);
  const expX1 = 2 * (s0 * s1 + s2 * s3);

  const energy = expZZ + expX0 + expX1;

  return {
    energy,
    statevector: [s0, s1, s2, s3],
    p00,
    p01,
    p10,
    p11,
    expZZ,
    expX0,
    expX1,
  };
}

// Two-Qubit Parameter-Shift Rule gradients
export function getTwoQubitGradients(
  theta1: number,
  theta2: number
): { grad1: number; grad2: number } {
  const shift = Math.PI / 2;

  // For t1:
  const energyPlus1 = getTwoQubitVQE(theta1 + shift, theta2).energy;
  const energyMinus1 = getTwoQubitVQE(theta1 - shift, theta2).energy;
  const grad1 = 0.5 * (energyPlus1 - energyMinus1);

  // For t2:
  const energyPlus2 = getTwoQubitVQE(theta1, theta2 + shift).energy;
  const energyMinus2 = getTwoQubitVQE(theta1, theta2 - shift).energy;
  const grad2 = 0.5 * (energyPlus2 - energyMinus2);

  return { grad1, grad2 };
}
