import React from 'react';

// 🧠 ABACUS ENGINE (inside same file)

const fromDigits = (digits) => {
  return Number([...digits].reverse().join(''));
};

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

const LEVELS = {
  beginner: { digits: 1, allowed: ['direct'], maxSteps: 10, subtraction: false },
  easy: { digits: 1, allowed: ['direct', 'friends5'], maxSteps: 12, subtraction: true },
  medium: { digits: 2, allowed: ['direct', 'friends5', 'friends10'], maxSteps: 15, subtraction: true },
  hard: { digits: 2, allowed: ['direct', 'friends5', 'friends10', 'complex'], maxSteps: 20, subtraction: true },
  expert: { digits: 3, allowed: ['direct', 'friends5', 'friends10', 'complex'], maxSteps: 25, subtraction: true }
};

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

const generateTrainingSet = ({ level = 'medium', count = 5 }) => {
  const questions = [];

  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(level));
  }

  return questions;
};

// ✅ THIS FIXES YOUR ERROR (default export component)
const AutoGenerate = () => {
  const questions = generateTrainingSet({
    level: 'medium',
    count: 5
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>Abacus Generator</h1>

      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <strong>Question {i + 1}</strong>

          <div>
            {q.steps.map((step, idx) => (
              <div key={idx}>
                {step.op} {step.val} ({step.moveType})
              </div>
            ))}
          </div>

          <div><b>Answer:</b> {q.answer}</div>
        </div>
      ))}
    </div>
  );
};

export default AutoGenerate;