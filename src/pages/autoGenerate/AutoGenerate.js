import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AutoGenerate.css'

// ── Pure math helpers ─────────────────────────────────────────────────────────

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const getDigitRange = (digitMode) => {
    if (digitMode === '1') return [1, 9]
    if (digitMode === '2') return [10, 99]
    return [1, 99] // mixed
}

const generateQuestion = ({ rowCount, digitMode, allowSubtraction }) => {
    const [min, max] = getDigitRange(digitMode)
    const gridRows = []
    let total = 0

    for (let i = 0; i < rowCount; i++) {
        const isFirst = i === 0
        const canSubtract = !isFirst && allowSubtraction && total > min
        const useSubtract = canSubtract && Math.random() < 0.4

        if (useSubtract) {
            const maxSub = Math.min(max, total - 1)
            if (maxSub < min) {
                // Running total too small — force add instead
                const val = randomInt(min, max)
                total += val
                gridRows.push({ op: '+', val })
                continue
            }
            const val = randomInt(min, maxSub)
            total -= val
            gridRows.push({ op: '-', val })
        } else {
            const val = randomInt(min, max)
            total += val
            gridRows.push({ op: '+', val })
        }
    }

    return { gridRows, answer: total }
}

const generateWrongAnswers = (correct, digitMode) => {
    const spread = digitMode === '1' ? 6 : 18
    const candidates = []

    for (let d = 1; d <= spread * 4; d++) {
        if (correct - d > 0) candidates.push(correct - d)
        candidates.push(correct + d)
    }

    // Shuffle
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

const generateBatch = ({ count, rowCount, digitMode, allowSubtraction, questionType, points }) => {
    const questions = []
    for (let i = 0; i < count; i++) {
        const { gridRows, answer } = generateQuestion({ rowCount, digitMode, allowSubtraction })
        const q = {
            gridRows,
            question: JSON.stringify(gridRows),
            questionPoints: points,
            type: questionType,
        }
        if (questionType === 'MCQ') {
            q.correctAnswer = String(answer)
            q.wrongAnswer = generateWrongAnswers(answer, digitMode)
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

    // Form state
    const [count, setCount] = useState(10)
    const [rowCount, setRowCount] = useState(5)
    const [digitMode, setDigitMode] = useState('1') // '1' | '2' | 'mixed'
    const [allowSubtraction, setAllowSubtraction] = useState(false)
    const [questionType, setQuestionType] = useState('Essay')
    const [points, setPoints] = useState(2)

    // Progress state
    const [status, setStatus] = useState('idle') // idle | saving | done | error
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0

    const validate = () => {
        if (count < 1 || count > 50) { setErrorMessage('Number of questions must be between 1 and 50.'); return false }
        if (rowCount < 2 || rowCount > 20) { setErrorMessage('Rows per question must be between 2 and 20.'); return false }
        if (points < 1 || points > 5) { setErrorMessage('Points must be between 1 and 5.'); return false }
        return true
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        const questions = generateBatch({ count, rowCount, digitMode, allowSubtraction, questionType, points })

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

    // ── Form ──────────────────────────────────────────────────────────────────

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

                <div className="autogen-info-banner">
                    ⚡ Generates questions instantly — no AI, no API key, no rate limits.
                </div>

                {errorMessage && <p className="text-error ai-error">{errorMessage}</p>}

                {/* ── Number of Questions ───────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Number of Questions</label>
                    <div className="autogen-number-row">
                        <input
                            type="number"
                            className="ai-input autogen-number-input"
                            min={1}
                            max={50}
                            value={count}
                            onChange={e => setCount(Number(e.target.value))}
                        />
                        <span className="autogen-number-hint">Max 50 per batch</span>
                    </div>
                </div>

                {/* ── Rows per Question ─────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Rows per Question</label>
                    <div className="autogen-number-row">
                        <input
                            type="number"
                            className="ai-input autogen-number-input"
                            min={2}
                            max={20}
                            value={rowCount}
                            onChange={e => setRowCount(Number(e.target.value))}
                        />
                        <span className="autogen-number-hint">Numbers of rows in the abacus grid</span>
                    </div>
                </div>

                {/* ── Digit Range ───────────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Digit Range</label>
                    <div className="ai-radio-group">
                        {[
                            { value: '1', label: '1-digit (1–9)' },
                            { value: '2', label: '2-digit (10–99)' },
                            { value: 'mixed', label: 'Mixed (1–99)' },
                        ].map(opt => (
                            <label key={opt.value} className={`ai-radio-option ${digitMode === opt.value ? 'ai-radio-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="digitMode"
                                    value={opt.value}
                                    checked={digitMode === opt.value}
                                    onChange={() => setDigitMode(opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ── Operations ────────────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Operations</label>
                    <div className="ai-radio-group">
                        <label className={`ai-radio-option ${!allowSubtraction ? 'ai-radio-selected' : ''}`}>
                            <input
                                type="radio"
                                name="ops"
                                checked={!allowSubtraction}
                                onChange={() => setAllowSubtraction(false)}
                            />
                            Addition only (+)
                        </label>
                        <label className={`ai-radio-option ${allowSubtraction ? 'ai-radio-selected' : ''}`}>
                            <input
                                type="radio"
                                name="ops"
                                checked={allowSubtraction}
                                onChange={() => setAllowSubtraction(true)}
                            />
                            Addition &amp; Subtraction (+ −)
                        </label>
                    </div>
                </div>

                {/* ── Question Type ─────────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Question Type</label>
                    <div className="ai-radio-group">
                        <label className={`ai-radio-option ${questionType === 'Essay' ? 'ai-radio-selected' : ''}`}>
                            <input
                                type="radio"
                                name="questionType"
                                value="Essay"
                                checked={questionType === 'Essay'}
                                onChange={() => setQuestionType('Essay')}
                            />
                            Essay (open-ended)
                        </label>
                        <label className={`ai-radio-option ${questionType === 'MCQ' ? 'ai-radio-selected' : ''}`}>
                            <input
                                type="radio"
                                name="questionType"
                                value="MCQ"
                                checked={questionType === 'MCQ'}
                                onChange={() => setQuestionType('MCQ')}
                            />
                            MCQ (4 choices)
                        </label>
                    </div>
                </div>

                {/* ── Points per Question ───────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Points per Question</label>
                    <div className="autogen-number-row">
                        <input
                            type="number"
                            className="ai-input autogen-number-input"
                            min={1}
                            max={5}
                            value={points}
                            onChange={e => setPoints(Number(e.target.value))}
                        />
                        <span className="autogen-number-hint">Between 1 and 5</span>
                    </div>
                </div>

                {/* ── Summary preview ───────────────────────────────────────── */}
                <div className="autogen-summary">
                    <span className="autogen-summary-item">📋 {count} questions</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{rowCount} rows each</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">
                        {digitMode === '1' ? '1-digit' : digitMode === '2' ? '2-digit' : 'Mixed'}
                    </span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">
                        {allowSubtraction ? '+ and −' : '+ only'}
                    </span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{questionType}</span>
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
