import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AiGenerate.css'

// ── Constants ────────────────────────────────────────────────────────────────

const OPERATIONS = [
    { symbol: '+', label: '+ Addition' },
    { symbol: '-', label: '− Subtraction' },
    { symbol: '×', label: '× Multiply' },
    { symbol: '÷', label: '÷ Divide' },
]

const LEVELS = [
    { id: 'basic',        label: 'Basic' },
    { id: 'friends5',     label: 'Friends of 5' },
    { id: 'friends10',    label: 'Friends of 10' },
    { id: 'bigFriends5',  label: 'Big Friends of 5' },
    { id: 'bigFriends10', label: 'Big Friends of 10' },
]

const DIGIT_OPTIONS = [1, 2, 3, 4]

// ── Generator helpers ────────────────────────────────────────────────────────

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const getMin = (digits) => digits === 1 ? 1 : Math.pow(10, digits - 1)
const getMax = (digits) => Math.pow(10, digits) - 1

// ── Abacus technique validators (c and d are single digits 0–9) ───────────────

// Friends-of-5 Addition: can't add d to c with free lower beads alone;
// must do +5 −(5−d). Requires: both in lower zone (c<5, d<5) and cross 5-boundary.
const f5Add = (c, d) => c >= 1 && c <= 4 && d >= 1 && d <= 4 && c + d >= 5

// Friends-of-5 Subtraction: can't remove d from c with lower beads alone;
// must do −5 +(5−d). Requires: c in upper zone (c≥5), result drops to lower zone.
const f5Sub = (c, d) => c >= 5 && d >= 1 && d <= 4 && c - d >= 0 && c - d <= 4

// Friends-of-10 Addition: adding d to c causes carry to next rod.
const f10Add = (c, d) => c + d >= 10

// Returns true if this step exercises the target technique for the chosen level.
const isGoodStepForLevel = (runningTotal, num, op, level) => {
    if (num < 1) return false
    if (op === '-' && runningTotal - num < 0) return false
    const uc = runningTotal % 10                    // unit digit of running total
    const un = num % 10                             // unit digit of num
    const tc = Math.floor(runningTotal / 10) % 10  // tens digit of running total
    const tn = Math.floor(num / 10) % 10           // tens digit of num
    switch (level) {
        case 'basic':
            // All bead moves are direct — no friends technique required at all
            return op === '+' ? !f5Add(uc, un) && !f10Add(uc, un) : !f5Sub(uc, un)
        case 'friends5':
            // Must trigger friends-of-5 in the unit column; no carry allowed
            return op === '+' ? f5Add(uc, un) && !f10Add(uc, un) : f5Sub(uc, un)
        case 'friends10':
            // Must trigger carry to next rod in unit column
            return op === '+' ? f10Add(uc, un) : false
        case 'bigFriends5':
            // Friends-of-5 in the tens column; no carry in tens
            return op === '+' ? f5Add(tc, tn) && !f10Add(tc, tn) : f5Sub(tc, tn)
        case 'bigFriends10':
            // Carry in the tens column (into hundreds rod)
            return op === '+' ? f10Add(tc, tn) : false
        default:
            return true
    }
}

// Try up to 60 random candidates to find one matching the level technique.
// Returns null if no match found (caller must fallback).
const tryPickForLevel = (digits, runningTotal, op, level) => {
    const maxVal = getMax(digits)
    const maxCand = op === '-' ? runningTotal : maxVal
    if (maxCand < 1) return null
    for (let i = 0; i < 60; i++) {
        const n = randomInt(1, maxCand)
        if (isGoodStepForLevel(runningTotal, n, op, level)) return n
    }
    return null
}

// Pick the opening number in a sequence, seeded for the target level.
const pickFirstNumber = (digits, level) => {
    const min = getMin(digits)
    const max = getMax(digits)
    switch (level) {
        case 'friends5':
            // Unit digit 1–4: positions f5Add is achievable on first step
            return digits === 1
                ? randomInt(1, 4)
                : Math.floor(randomInt(min, max) / 10) * 10 + randomInt(1, 4)
        case 'friends10':
            // Unit digit 1–9 so carry is reachable
            return digits === 1
                ? randomInt(1, 9)
                : Math.floor(randomInt(min, max) / 10) * 10 + randomInt(1, 9)
        case 'bigFriends5':
            // Tens digit 1–4
            return digits <= 1 ? randomInt(1, 4) : randomInt(1, 4) * 10 + randomInt(0, 9)
        case 'bigFriends10':
            // Tens digit 1–9
            return digits <= 1 ? randomInt(1, 9) : randomInt(1, 9) * 10 + randomInt(0, 9)
        case 'basic':
        default:
            // Start small: unit digit 1–4 (plenty of free lower beads)
            return digits === 1
                ? randomInt(1, 4)
                : Math.floor(randomInt(min, Math.max(min, Math.floor(max * 0.4))) / 10) * 10 + randomInt(1, 4)
    }
}

const generateAddSubQuestion = (digits, rows, ops, level) => {
    const canAdd = ops.includes('+')
    const canSubtract = ops.includes('-')

    const firstNum = pickFirstNumber(digits, level)
    const numbers = [firstNum]
    const operations = []
    let runningTotal = firstNum

    for (let i = 1; i < rows; i++) {
        const canSub = canSubtract && runningTotal > 0

        // Try both ops (in random order) to find one that exercises the right technique
        const opCandidates = []
        if (canAdd) opCandidates.push('+')
        if (canSub) opCandidates.push('-')
        if (opCandidates.length > 1 && Math.random() > 0.5) opCandidates.reverse()

        let finalOp = opCandidates[0] || '+'
        let finalNum = null

        for (const op of opCandidates) {
            const n = tryPickForLevel(digits, runningTotal, op, level)
            if (n !== null) { finalOp = op; finalNum = n; break }
        }

        // Fallback: safe arbitrary number (math stays correct, technique not guaranteed)
        if (finalNum === null) {
            finalOp = canSub && Math.random() > 0.5 ? '-' : '+'
            const safeMax = finalOp === '-'
                ? runningTotal
                : Math.max(1, Math.min(getMax(digits) - runningTotal, 4))
            finalNum = randomInt(1, Math.max(1, safeMax))
        }

        // Final guard: never allow negative running total
        if (finalOp === '-' && runningTotal - finalNum < 0) finalOp = '+'

        numbers.push(finalNum)
        operations.push(finalOp)
        runningTotal = finalOp === '+' ? runningTotal + finalNum : runningTotal - finalNum
    }

    const questionText = [
        String(numbers[0]),
        ...numbers.slice(1).map((n, i) => `${operations[i]} ${n}`)
    ].join('\n')

    return {
        question: questionText,
        answer: [String(runningTotal)],
        questionPoints: 1,
        type: 'Essay',
    }
}

const generateMultiplyQuestion = (digits) => {
    const a = randomInt(getMin(digits), getMax(digits))
    const b = randomInt(2, 9) // single-digit multiplier
    return {
        question: `${a} × ${b}`,
        answer: [String(a * b)],
        questionPoints: 1,
        type: 'Essay',
    }
}

const generateDivideQuestion = (digits) => {
    const divisor = randomInt(2, 9)
    const quotient = randomInt(getMin(digits), getMax(digits))
    const dividend = quotient * divisor
    return {
        question: `${dividend} ÷ ${divisor}`,
        answer: [String(quotient)],
        questionPoints: 1,
        type: 'Essay',
    }
}

const generateAllQuestions = (selectedOps, digits, rows, level, count) => {
    const addSubOps = selectedOps.filter(o => o === '+' || o === '-')
    const hasMultiply = selectedOps.includes('×')
    const hasDivide = selectedOps.includes('÷')

    // Build a pool of generator types to randomly pick from
    const pool = []
    if (addSubOps.length > 0) pool.push('addSub')
    if (hasMultiply) pool.push('multiply')
    if (hasDivide) pool.push('divide')

    const questions = []
    for (let i = 0; i < count; i++) {
        const type = pool[Math.floor(Math.random() * pool.length)]
        if (type === 'addSub') questions.push(generateAddSubQuestion(digits, rows, addSubOps, level))
        else if (type === 'multiply') questions.push(generateMultiplyQuestion(digits))
        else questions.push(generateDivideQuestion(digits))
    }
    return questions
}

// ── Component ────────────────────────────────────────────────────────────────

const AiGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    const [selectedOps, setSelectedOps] = useState(['+', '-'])
    const [level, setLevel] = useState('basic')
    const [digits, setDigits] = useState(1)
    const [rows, setRows] = useState(5)
    const [count, setCount] = useState(10)
    const [status, setStatus] = useState('idle') // idle | saving | done | error
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    const showRows = selectedOps.includes('+') || selectedOps.includes('-')

    const toggleOp = (symbol) => {
        setSelectedOps(prev =>
            prev.includes(symbol)
                ? prev.filter(o => o !== symbol)
                : [...prev, symbol]
        )
    }

    const validate = () => {
        if (selectedOps.length === 0) {
            setErrorMessage('Select at least one operation')
            return false
        }
        if (!count || count < 1 || count > 100) {
            setErrorMessage('Enter a number of questions between 1 and 100')
            return false
        }
        return true
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        // Generate questions instantly (no AI call needed)
        const questions = generateAllQuestions(selectedOps, digits, rows, level, count)

        // Save questions sequentially using the existing API
        setStatus('saving')
        setProgress({ current: 0, total: questions.length })

        let saved = 0
        for (let i = 0; i < questions.length; i++) {
            setProgress({ current: i + 1, total: questions.length })
            try {
                await saveAiQuestion(questions[i], chapterID)
                saved++
            } catch (e) {
                console.error(`Failed to save question ${i + 1}:`, e)
            }
            await new Promise(r => setTimeout(r, 300))
        }

        setSavedCount(saved)
        setStatus('done')
    }

    const handleGenerateMore = () => {
        setStatus('idle')
        setProgress({ current: 0, total: 0 })
        setSavedCount(0)
        setErrorMessage('')
    }

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0

    // ── DONE screen ──────────────────────────────────────────────────────────
    if (status === 'done') {
        return (
            <div className="ai-generate-page d-flex justify-content-center align-items-center">
                <div className="ai-success-card d-flex flex-direction-column align-items-center">
                    <img src={correctIcon} className="ai-success-icon" alt="success" />
                    <p className="ai-success-title text-color">{savedCount} questions saved successfully!</p>
                    <p className="ai-success-sub text-color">
                        Go to the chapter to review them. You can delete any question you don't like.
                    </p>
                    <div className="d-flex ai-success-buttons">
                        <Link to={`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`}>
                            <button className="button">Go to Chapter to Review</button>
                        </Link>
                        <button className="button ai-more-btn" onClick={handleGenerateMore}>Generate More</button>
                    </div>
                </div>
            </div>
        )
    }

    // ── SAVING screen ────────────────────────────────────────────────────────
    if (status === 'saving') {
        return (
            <div className="ai-generate-page d-flex justify-content-center align-items-center">
                <div className="ai-progress-card d-flex flex-direction-column align-items-center">
                    <div className="ai-spinner"></div>
                    <p className="ai-progress-title text-color">Saving questions to database...</p>
                    <p className="ai-progress-sub">
                        Saving question {progress.current} of {progress.total}
                    </p>
                    <div className="ai-progress-bar-track">
                        <div className="ai-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="ai-progress-percent">{progressPercent}%</p>
                </div>
            </div>
        )
    }

    // ── IDLE / ERROR form ────────────────────────────────────────────────────
    return (
        <div className="ai-generate-page">
            <div className="ai-form-container">

                {/* Header */}
                <div className="ai-header">
                    <div className="ai-header-icon">🧮</div>
                    <div>
                        <p className="ai-page-title text-color">Abacus Question Generator</p>
                        <p className="ai-page-subtitle">
                            Chapter: <span className="ai-chapter-name">{decodeURIComponent(chapterName)}</span>
                        </p>
                    </div>
                </div>

                {errorMessage && <p className="text-error ai-error">{errorMessage}</p>}

                {/* Operations — multi-select */}
                <div className="ai-field">
                    <label className="ai-label">Operations</label>
                    <div className="ai-radio-group">
                        {OPERATIONS.map(({ symbol, label }) => (
                            <label
                                key={symbol}
                                className={`ai-checkbox-option ${selectedOps.includes(symbol) ? 'ai-checkbox-selected' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedOps.includes(symbol)}
                                    onChange={() => toggleOp(symbol)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Level */}
                <div className="ai-field">
                    <label className="ai-label">Level</label>
                    <div className="ai-radio-group flex-wrap">
                        {LEVELS.map(({ id, label }) => (
                            <label
                                key={id}
                                className={`ai-radio-option ${level === id ? 'ai-radio-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="level"
                                    value={id}
                                    checked={level === id}
                                    onChange={() => setLevel(id)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Number of Digits */}
                <div className="ai-field">
                    <label className="ai-label">Number of Digits</label>
                    <div className="ai-radio-group">
                        {DIGIT_OPTIONS.map(d => (
                            <label
                                key={d}
                                className={`ai-radio-option ${digits === d ? 'ai-radio-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="digits"
                                    value={d}
                                    checked={digits === d}
                                    onChange={() => setDigits(d)}
                                />
                                {d} digit{d > 1 ? 's' : ''}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Number of Rows — only for + / - */}
                {showRows && (
                    <div className="ai-field">
                        <label className="ai-label">
                            Rows per Question
                            <span className="ai-field-hint">2 – 15</span>
                        </label>
                        <div className="ai-rows-control">
                            <button
                                className="ai-rows-btn"
                                onClick={() => setRows(r => Math.max(2, r - 1))}
                                type="button"
                            >−</button>
                            <span className="ai-rows-value">{rows}</span>
                            <button
                                className="ai-rows-btn"
                                onClick={() => setRows(r => Math.min(15, r + 1))}
                                type="button"
                            >+</button>
                        </div>
                    </div>
                )}

                {/* Number of Questions */}
                <div className="ai-field">
                    <label className="ai-label">Number of Questions</label>
                    <input
                        type="number"
                        className="ai-input ai-count-input"
                        min={1}
                        max={100}
                        value={count}
                        onChange={e => setCount(Number(e.target.value))}
                    />
                </div>

                {/* Actions */}
                <div className="ai-actions d-flex">
                    <button className="button ai-generate-btn" onClick={handleGenerate}>
                        🧮 Generate &amp; Save All Questions
                    </button>
                    <Link to={`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`}>
                        <button className="button cancel-button">Cancel</button>
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default AiGenerate
