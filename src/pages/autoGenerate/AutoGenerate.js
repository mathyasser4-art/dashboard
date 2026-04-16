import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AutoGenerate.css'

// ── Abacus Math Engine ────────────────────────────────────────────────────────

/** Convert digit array (ones-first) back to a number. e.g. [3, 2] → 23 */
const fromDigits = (digits) =>
    digits.reduce((acc, d, i) => acc + d * Math.pow(10, i), 0)

/**
 * Classify the abacus technique needed for a move on the ones digit.
 * direct    → beads move without any complement trick
 * friends5  → ones digit crosses the 5-bead boundary (5-complement needed)
 * friends10 → ones digit overflows / underflows (10-complement / carry needed)
 */
const getMoveType = (onesDigit, val) => {
    const absVal = Math.abs(val)
    if (val > 0) {
        if (onesDigit + absVal < 10) {
            if (onesDigit < 5 && onesDigit + absVal <= 4) return 'direct'
            if (onesDigit >= 5)                           return 'direct'
            /* onesDigit < 5 && result in [5,9] */        return 'friends5'
        }
        return 'friends10'
    } else {
        if (onesDigit - absVal >= 0) {
            if (onesDigit >= 5 && onesDigit - absVal >= 5) return 'direct'
            if (onesDigit < 5)                             return 'direct'
            /* onesDigit >= 5 && result < 5 */             return 'friends5'
        }
        return 'friends10'
    }
}

/** Apply a signed single-digit value to a digit array, propagating carries. */
const applyMove = (digits, val) => {
    let carry = val
    let i = 0
    while (carry !== 0) {
        if (digits[i] === undefined) digits[i] = 0
        const sum = digits[i] + carry
        if (sum >= 10)     { digits[i] = sum - 10; carry =  1 }
        else if (sum < 0)  { digits[i] = sum + 10; carry = -1 }
        else               { digits[i] = sum;       carry =  0 }
        i++
    }
    return digits
}

// Level definitions
const LEVELS = {
    beginner: {
        label: 'Beginner',
        digits: 1,
        allowed: ['direct'],
        steps: 4,
        subtraction: false,
        desc: 'Addition only, 1-digit numbers. Every move is a direct bead slide — no complement tricks.',
    },
    easy: {
        label: 'Easy',
        digits: 1,
        allowed: ['direct', 'friends5'],
        steps: 5,
        subtraction: false,
        desc: '1-digit numbers. Introduces the Friends of 5 technique (e.g. 3 + 4: push 5-bead, remove 1).',
    },
    medium: {
        label: 'Medium',
        digits: 1,
        allowed: ['direct', 'friends5', 'friends10'],
        steps: 6,
        subtraction: true,
        desc: '1-digit numbers with +/−. Uses Friends of 5 and Friends of 10 (carry/borrow).',
    },
    hard: {
        label: 'Hard',
        digits: 2,
        allowed: ['direct', 'friends5', 'friends10'],
        steps: 8,
        subtraction: true,
        desc: '2-digit numbers with +/−. Full use of both friend techniques across two rods.',
    },
    expert: {
        label: 'Expert',
        digits: 3,
        allowed: ['direct', 'friends5', 'friends10'],
        steps: 10,
        subtraction: true,
        desc: '3-digit numbers with +/−. Complex combinations across all three rods.',
    },
}

const generateQuestion = (levelKey) => {
    const config = LEVELS[levelKey]
    const maxVal  = Math.pow(10, config.digits) - 1
    const rows    = []
    let digits    = new Array(config.digits).fill(0)
    let attempts  = 0

    while (rows.length < config.steps && attempts < 3000) {
        attempts++
        let val = Math.floor(Math.random() * 9) + 1
        if (config.subtraction && rows.length > 0 && Math.random() > 0.6) val = -val
        if (rows.length === 0 && val < 0) continue

        const newDigits = applyMove([...digits], val)
        const result    = fromDigits([...newDigits])
        if (result < 1 || result > maxVal) continue

        const moveType = getMoveType(digits[0], val)
        if (!config.allowed.includes(moveType)) continue

        digits = newDigits
        rows.push({ op: val > 0 ? '+' : '-', val: Math.abs(val), moveType })
    }

    return { rows, answer: fromDigits(digits) }
}

const generateWrongAnswers = (correct) => {
    const spread     = Math.max(8, Math.round(correct * 0.25))
    const candidates = []
    for (let d = 1; d <= spread * 4; d++) {
        if (correct - d > 0) candidates.push(correct - d)
        candidates.push(correct + d)
    }
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
    }
    const wrongs = new Set()
    for (const c of candidates) {
        if (wrongs.size >= 3) break
        if (c !== correct && c > 0) wrongs.add(String(c))
    }
    return [...wrongs]
}

const generateBatch = ({ count, levelKey, questionType, points }) => {
    const questions = []
    for (let i = 0; i < count; i++) {
        const { rows, answer } = generateQuestion(levelKey)
        // Strip moveType before sending to API — it only needs op + val
        const gridRows = rows.map(({ op, val }) => ({ op, val }))
        const q = {
            gridRows,
            question:       JSON.stringify(gridRows),
            questionPoints: points,
            type:           questionType,
        }
        if (questionType === 'MCQ') {
            q.correctAnswer = String(answer)
            q.wrongAnswer   = generateWrongAnswers(answer)
        } else {
            q.answer = [String(answer)]
        }
        questions.push(q)
    }
    return questions
}

// ── Component ─────────────────────────────────────────────────────────────────

const AutoGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    const [count,        setCount]        = useState(10)
    const [levelKey,     setLevelKey]     = useState('easy')
    const [questionType, setQuestionType] = useState('Essay')
    const [points,       setPoints]       = useState(2)

    const [status,       setStatus]       = useState('idle')
    const [progress,     setProgress]     = useState({ current: 0, total: 0 })
    const [savedCount,   setSavedCount]   = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0

    const validate = () => {
        if (count < 1 || count > 50) { setErrorMessage('Number of questions must be between 1 and 50.'); return false }
        if (points < 1 || points > 5) { setErrorMessage('Points must be between 1 and 5.'); return false }
        return true
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        const questions = generateBatch({ count, levelKey, questionType, points })
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
            await new Promise(r => setTimeout(r, 200))
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

    const selectedLevel = LEVELS[levelKey]

    // ── Success screen ────────────────────────────────────────────────────────

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

    // ── Saving screen ─────────────────────────────────────────────────────────

    if (status === 'saving') {
        return (
            <div className="ai-generate-page d-flex justify-content-center align-items-center">
                <div className="ai-progress-card d-flex flex-direction-column align-items-center">
                    <div className="ai-spinner"></div>
                    <p className="ai-progress-title text-color">Saving questions to database...</p>
                    <p className="ai-progress-sub">Saving question {progress.current} of {progress.total}</p>
                    <div className="ai-progress-bar-track">
                        <div className="ai-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="ai-progress-percent">{progressPercent}%</p>
                </div>
            </div>
        )
    }

    // ── Form ──────────────────────────────────────────────────────────────────

    return (
        <div className="ai-generate-page">
            <div className="ai-form-container autogen-wide">

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

                <div className="autogen-info-banner">
                    ⚡ Generates questions instantly — no AI, no API key, no rate limits.
                </div>

                {errorMessage && <p className="text-error ai-error">{errorMessage}</p>}

                {/* ── Number of Questions */}
                <div className="ai-field">
                    <label className="ai-label">Number of Questions</label>
                    <div className="autogen-number-row">
                        <input
                            type="number"
                            className="ai-input autogen-number-input"
                            min={1} max={50}
                            value={count}
                            onChange={e => setCount(Number(e.target.value))}
                        />
                        <span className="autogen-number-hint">Max 50 per batch</span>
                    </div>
                </div>

                {/* ── Difficulty Level */}
                <div className="ai-field">
                    <label className="ai-label">Difficulty Level</label>
                    <div className="ai-radio-group">
                        {Object.entries(LEVELS).map(([key, cfg]) => (
                            <label
                                key={key}
                                className={`ai-radio-option ${levelKey === key ? 'ai-radio-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="level"
                                    value={key}
                                    checked={levelKey === key}
                                    onChange={() => setLevelKey(key)}
                                />
                                {cfg.label}
                            </label>
                        ))}
                    </div>
                    <p className="autogen-level-desc">{selectedLevel.desc}</p>

                    {/* Level details pills */}
                    <div className="autogen-level-details">
                        <span className="autogen-level-pill">🔢 {selectedLevel.digits}-digit</span>
                        <span className="autogen-level-pill">📏 {selectedLevel.steps} rows</span>
                        <span className="autogen-level-pill">{selectedLevel.subtraction ? '+ and −' : '+ only'}</span>
                        {selectedLevel.allowed.map(a => (
                            <span key={a} className={`autogen-level-pill autogen-pill-${a}`}>
                                {a === 'direct' ? 'Direct' : a === 'friends5' ? 'Friends of 5' : 'Friends of 10'}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Question Type */}
                <div className="ai-field">
                    <label className="ai-label">Question Type</label>
                    <div className="ai-radio-group">
                        <label className={`ai-radio-option ${questionType === 'Essay' ? 'ai-radio-selected' : ''}`}>
                            <input type="radio" name="questionType" value="Essay" checked={questionType === 'Essay'} onChange={() => setQuestionType('Essay')} />
                            Essay (open-ended)
                        </label>
                        <label className={`ai-radio-option ${questionType === 'MCQ' ? 'ai-radio-selected' : ''}`}>
                            <input type="radio" name="questionType" value="MCQ" checked={questionType === 'MCQ'} onChange={() => setQuestionType('MCQ')} />
                            MCQ (4 choices)
                        </label>
                    </div>
                </div>

                {/* ── Points per Question */}
                <div className="ai-field">
                    <label className="ai-label">Points per Question</label>
                    <div className="autogen-number-row">
                        <input
                            type="number"
                            className="ai-input autogen-number-input"
                            min={1} max={5}
                            value={points}
                            onChange={e => setPoints(Number(e.target.value))}
                        />
                        <span className="autogen-number-hint">Between 1 and 5</span>
                    </div>
                </div>

                {/* ── Summary */}
                <div className="autogen-summary">
                    <span className="autogen-summary-item">📋 {count} questions</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{selectedLevel.label}</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{selectedLevel.steps} rows each</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{questionType}</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{points} pts</span>
                </div>

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

export default AutoGenerate
