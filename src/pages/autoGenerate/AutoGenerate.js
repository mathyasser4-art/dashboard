// ─────────────────────────────────────────────
// 🧠 PRO ABACUS TRAINING ENGINE
// Multi-level | Difficulty curves | True rod logic
// ─────────────────────────────────────────────

// Each number is represented as array of rods (right → left)
// Example: 47 → [7,4]

const toDigits = (num, maxDigits) => {
  const digits = String(num).padStart(maxDigits, '0').split('').map(Number);
  return digits.reverse(); // rightmost first
};

const fromDigits = (digits) => {
  return Number(digits.reverse().join(''));
};

// ─────────────────────────────────────────────
// 🔹 MOVE TYPE (TRUE SOROBAN PER ROD)
// ─────────────────────────────────────────────

const getMoveType = (digit, val) => {
  const isAdding = val > 0;
  const absVal = Math.abs(val);

  if (isAdding) {
    if (digit + absVal <= 9) {
      if (digit < 5 && digit + absVal <= 4) return 'direct';
      if (digit >= 5) return 'direct';
      if (digit < 5 && digit + absVal >= 5) return 'friends5';
    }
    if (digit + absVal >= 10) return 'friends10';
  } else {
    if (digit - absVal >= 0) {
      if (digit >= 5 && digit - absVal >= 5) return 'direct';
      if (digit < 5) return 'direct';
      if (digit >= 5 && digit - absVal < 5) return 'friends5';
    }
    if (digit - absVal < 0) return 'friends10';
  }

  return 'complex';
};

// ─────────────────────────────────────────────
// 🔹 APPLY MOVE WITH CARRY / BORROW
// ─────────────────────────────────────────────

const applyMove = (digits, val) => {
  let carry = val;
  let i = 0;

  while (carry !== 0) {
    if (!digits[i]) digits[i] = 0;

    let sum = digits[i] + carry;

    if (sum >= 10) {
      digits[i] = sum - 10;
      carry = 1;
    } else if (sum < 0) {
      digits[i] = sum + 10;
      carry = -1;
    } else {
      digits[i] = sum;
      carry = 0;
    }

    i++;
  }

  return digits;
};

// ─────────────────────────────────────────────
// 🔹 DIFFICULTY CONFIG
// ─────────────────────────────────────────────

const LEVELS = {
  beginner: {
    digits: 1,
    allowed: ['direct'],
    maxSteps: 10,
    subtraction: false
  },
  easy: {
    digits: 1,
    allowed: ['direct', 'friends5'],
    maxSteps: 12,
    subtraction: true
  },
  medium: {
    digits: 2,
    allowed: ['direct', 'friends5', 'friends10'],
    maxSteps: 15,
    subtraction: true
  },
  hard: {
    digits: 2,
    allowed: ['direct', 'friends5', 'friends10', 'complex'],
    maxSteps: 20,
    subtraction: true
  },
  expert: {
    digits: 3,
    allowed: ['direct', 'friends5', 'friends10', 'complex'],
    maxSteps: 25,
    subtraction: true
  }
};

// ─────────────────────────────────────────────
// 🔹 GENERATE SINGLE QUESTION
// ─────────────────────────────────────────────

const generateQuestion = (levelKey) => {
  const config = LEVELS[levelKey];
  const rows = [];

  let digits = new Array(config.digits).fill(0);
  let attempts = 0;

  while (rows.length < config.maxSteps && attempts < 1000) {
    attempts++;

    let val = Math.floor(Math.random() * 9) + 1;

    if (config.subtraction && Math.random() > 0.6) {
      val *= -1;
    }

    const testDigits = [...digits];
    const newDigits = applyMove([...testDigits], val);

    const moveType = getMoveType(testDigits[0], val);

    if (!config.allowed.includes(moveType)) continue;

    // Bounds check
    const result = fromDigits([...newDigits]);
    const max = Math.pow(10, config.digits) - 1;

    if (result < 0 || result > max) continue;

    digits = newDigits;

    rows.push({
      op: val > 0 ? '+' : '-',
      val: Math.abs(val),
      moveType
    });
  }

  return {
    steps: rows,
    answer: fromDigits(digits)
  };
};

// ─────────────────────────────────────────────
// 🔹 BATCH GENERATOR
// ─────────────────────────────────────────────

export const generateTrainingSet = ({
  level = 'beginner',
  count = 10,
  questionType = 'MCQ'
}) => {
  const questions = [];

  for (let i = 0; i < count; i++) {
    const q = generateQuestion(level);

    const base = {
      steps: q.steps,
      question: JSON.stringify(q.steps)
    };

    if (questionType === 'MCQ') {
      const correct = q.answer;
      const wrongs = new Set();

      while (wrongs.size < 3) {
        const offset = Math.floor(Math.random() * 10) + 1;
        const val = Math.random() > 0.5 ? correct + offset : correct - offset;
        if (val >= 0 && val !== correct) wrongs.add(val);
      }

      base.correctAnswer = String(correct);
      base.wrongAnswer = [...wrongs].map(String);
    } else {
      base.answer = [String(q.answer)];
    }

    questions.push(base);
  }

  return questions;
};

// ─────────────────────────────────────────────
// 🔹 OPTIONAL: PERFORMANCE TRACKING HOOK
// ─────────────────────────────────────────────

export const evaluatePerformance = (results) => {
  const total = results.length;
  const correct = results.filter(r => r.correct).length;

  const accuracy = (correct / total) * 100;

  let nextLevel = 'beginner';

  if (accuracy > 90) nextLevel = 'expert';
  else if (accuracy > 75) nextLevel = 'hard';
  else if (accuracy > 60) nextLevel = 'medium';
  else if (accuracy > 40) nextLevel = 'easy';

  return {
    accuracy,
    nextLevel
  };
};
