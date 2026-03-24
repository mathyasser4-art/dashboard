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

const pickNumber = (digits, level) => {
    const min = getMin(digits)
    const max = getMax(digits)

    switch (level) {
        case 'friends5': {
            // Unit digit from friends-of-5 pairs: 1↔4, 2↔3
            const unitOptions = [1, 2, 3, 4]
            const unit = unitOptions[Math.floor(Math.random() * unitOptions.length)]
            if (digits === 1) return unit
            const higherPart = randomInt(getMin(digits - 1), getMax(digits - 1)) * 10
            return higherPart + unit
        }
        case 'friends10': {
            // Unit digit 1-9 (pairs that sum to 10)
            const unit = randomInt(1, 9)
            if (digits === 1) return unit
            const higherPart = randomInt(getMin(digits - 1), getMax(digits - 1)) * 10
            return higherPart + unit
        }
        case 'bigFriends5': {
            // Tens digit in friends-of-5 range (10, 20, 30, 40)
            if (digits === 1) return randomInt(1, 4)
            const tensDigit = [1, 2, 3, 4][Math.floor(Math.random() * 4)] * 10
            const unit = randomInt(0, 9)
            return tensDigit + unit
        }
        case 'bigFriends10': {
            // Larger numbers requiring carry into next column
            if (digits === 1) return randomInt(1, 9)
            const tensDigit = randomInt(1, 9) * 10
            const unit = randomInt(0, 9)
            return tensDigit + unit
        }
        case 'basic':
        default:
            // Small numbers, no carry needed
            return randomInt(min, Math.max(min, Math.floor(max / 2)))
    }
}

const generateAddSubQuestion = (digits, rows, ops, level) => {
    const canAdd = ops.includes('+')
    const canSubtract = ops.includes('-')

    const firstNum = pickNumber(digits, level)
    const numbers = [firstNum]
    const operations = []
    let runningTotal = firstNum

    for (let i = 1; i < rows; i++) {
        const num = pickNumber(digits, level)
        const canActuallySubtract = canSubtract && (runningTotal - num) >= 0
        const canActuallyAdd = canAdd

        let op
        if (canActuallyAdd && canActuallySubtract) {
            op = Math.random() > 0.5 ? '+' : '-'
        } else if (canActuallySubtract) {
            op = '-'
        } else {
            op = '+'
        }

        numbers.push(num)
        operations.push(op)
        runningTotal = op === '+' ? runningTotal + num : runningTotal - num
    }

    // Vertical column format: "7<br>+ 3<br>- 2"
    const questionHtml = [
        String(numbers[0]),
        ...numbers.slice(1).map((n, i) => `${operations[i]} ${n}`)
    ].join('<br>')

    return {
        question: questionHtml,
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
