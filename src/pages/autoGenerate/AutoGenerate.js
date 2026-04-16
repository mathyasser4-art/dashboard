import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AutoGenerate.css'

// ── Pure math helpers ─────────────────────────────────────────────────────────

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const onesDigit = (n) => Math.abs(Math.round(n)) % 10

/**
 * Does adding `addend` to `running` require the "Friends of 5" technique?
 * Addition:   ones digit crosses from <5 into [5-9] (e.g. 3+4 → move 5 bead, subtract complement)
 * Subtraction: ones digit crosses from ≥5 back below 5 (borrow 5 bead, add complement)
 */
const stepNeedsFriendOf5 = (running, addend) => {
    const ro = onesDigit(running)
    if (addend >= 0) {
        const ao = onesDigit(addend)
        return ao !== 0 && ao !== 5 && ro < 5 && (ro + ao) >= 5 && (ro + ao) < 10
    } else {
        const so = onesDigit(-addend)
        return so !== 0 && so !== 5 && ro >= 5 && (ro - so) >= 0 && (ro - so) < 5
    }
}

/**
 * Does adding `addend` to `running` require the "Friends of 10" technique?
 * Addition:   ones digit overflows into tens (carry needed)
 * Subtraction: ones digit can't cover the subtraction (borrow from tens)
 */
const stepNeedsFriendOf10 = (running, addend) => {
    const ro = onesDigit(running)
    if (addend >= 0) {
        const ao = onesDigit(addend)
        return ao !== 0 && (ro + ao) >= 10
    } else {
        const so = onesDigit(-addend)
        return so !== 0 && ro < so
    }
}

/**
 * Generate a single question. Retries up to MAX_ATTEMPTS to satisfy level + answer range.
 * Falls back to unconstrained generation if no valid question found.
 */
const generateQuestion = ({ rowRanges, allowSubtraction, level, answerMin, answerMax, depth = 0 }) => {
    const MAX_ATTEMPTS = 300
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const gridRows = []
        let total = 0
        let hasF5 = false
        let hasF10 = false

        for (let i = 0; i < rowRanges.length; i++) {
            const { min, max } = rowRanges[i]
            const isFirst = i === 0
            const canSubtract = !isFirst && allowSubtraction && total > min
            const useSubtract = canSubtract && Math.random() < 0.4

            if (useSubtract) {
                const maxSub = Math.min(max, total - 1)
                if (maxSub < min) {
                    // Can't subtract — force add
                    const val = randomInt(min, max)
                    if (stepNeedsFriendOf5(total, val)) hasF5 = true
                    if (stepNeedsFriendOf10(total, val)) hasF10 = true
                    total += val
                    gridRows.push({ op: '+', val })
                } else {
                    const val = randomInt(min, maxSub)
                    if (stepNeedsFriendOf5(total, -val)) hasF5 = true
                    if (stepNeedsFriendOf10(total, -val)) hasF10 = true
                    total -= val
                    gridRows.push({ op: '-', val })
                }
            } else {
                const val = randomInt(min, max)
                if (stepNeedsFriendOf5(total, val)) hasF5 = true
                if (stepNeedsFriendOf10(total, val)) hasF10 = true
                total += val
                gridRows.push({ op: '+', val })
            }
        }

        if (total <= 0) continue

        // Check answer range
        const aMin = answerMin !== '' ? Number(answerMin) : null
        const aMax = answerMax !== '' ? Number(answerMax) : null
        if (aMin !== null && total < aMin) continue
        if (aMax !== null && total > aMax) continue

        // Check level
        if (level === 'direct' && (hasF5 || hasF10)) continue
        if (level === 'f5' && !hasF5) continue
        if (level === 'f10' && !hasF10) continue

        return { gridRows, answer: total }
    }

    // Fallback: generate without level/answer-range constraints (avoid infinite recursion)
    if (depth === 0) {
        return generateQuestion({ rowRanges, allowSubtraction, level: 'all', answerMin: '', answerMax: '', depth: 1 })
    }
    // Last resort: single row with a safe value
    const val = randomInt(rowRanges[0].min, rowRanges[0].max)
    return { gridRows: [{ op: '+', val }], answer: val }
}

const generateWrongAnswers = (correct) => {
    const spread = Math.max(8, Math.round(correct * 0.3))
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

const generateBatch = ({ count, rowRanges, allowSubtraction, level, answerMin, answerMax, questionType, points }) => {
    const questions = []
    for (let i = 0; i < count; i++) {
        const { gridRows, answer } = generateQuestion({ rowRanges, allowSubtraction, level, answerMin, answerMax })
        const q = {
            gridRows,
            question: JSON.stringify(gridRows),
            questionPoints: points,
            type: questionType,
        }
        if (questionType === 'MCQ') {
            q.correctAnswer = String(answer)
            q.wrongAnswer = generateWrongAnswers(answer)
        } else {
            q.answer = [String(answer)]
        }
        questions.push(q)
    }
    return questions
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
    {
        value: 'all',
        label: 'All Mixed',
        desc: 'No constraint — any combination of techniques may appear in the same question.',
    },
    {
        value: 'direct',
        label: 'Direct (Basic)',
        desc: 'Every step uses only direct bead movements. No friend technique needed — ideal for beginners.',
    },
    {
        value: 'f5',
        label: 'Friends of 5',
        desc: 'At least one step requires the 5-complement technique (e.g. 3+4: push the 5-bead up, remove 1).',
    },
    {
        value: 'f10',
        label: 'Friends of 10',
        desc: 'At least one step requires a carry using the 10-complement (e.g. 7+6: carry 10 to next rod, subtract 4).',
    },
]

const RANGE_PRESETS = [
    { label: '1–9', min: 1, max: 9 },
    { label: '10–99', min: 10, max: 99 },
    { label: '1–99', min: 1, max: 99 },
]

const makeRowRanges = (count, existing = []) =>
    Array.from({ length: count }, (_, i) =>
        existing[i] ? existing[i] : { min: 1, max: 9 }
    )

// ── Component ─────────────────────────────────────────────────────────────────

const AutoGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    // Form state
    const [count, setCount] = useState(10)
    const [rowCount, setRowCount] = useState(5)
    const [rowRanges, setRowRanges] = useState(() => makeRowRanges(5))
    const [level, setLevel] = useState('all')
    const [allowSubtraction, setAllowSubtraction] = useState(false)
    const [answerMin, setAnswerMin] = useState('')
    const [answerMax, setAnswerMax] = useState('')
    const [questionType, setQuestionType] = useState('Essay')
    const [points, setPoints] = useState(2)

    // Progress state
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0

    const handleRowCountChange = (val) => {
        const n = Math.max(2, Math.min(20, Number(val)))
        setRowCount(n)
        setRowRanges(prev => makeRowRanges(n, prev))
    }

    const updateRowRange = (index, field, value) => {
        setRowRanges(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value === '' ? '' : Number(value) }
            return next
        })
    }

    const applyPresetToAll = (min, max) => {
        setRowRanges(makeRowRanges(rowCount).map(() => ({ min, max })))
    }

    const validate = () => {
        if (count < 1 || count > 50) { setErrorMessage('Number of questions must be between 1 and 50.'); return false }
        if (rowCount < 2 || rowCount > 20) { setErrorMessage('Rows per question must be between 2 and 20.'); return false }
        for (let i = 0; i < rowRanges.length; i++) {
            const { min, max } = rowRanges[i]
            if (!min || !max || Number(min) < 1 || Number(max) < 1) {
                setErrorMessage(`Row ${i + 1}: min and max must be at least 1.`); return false
            }
            if (Number(min) > Number(max)) {
                setErrorMessage(`Row ${i + 1}: min cannot be greater than max.`); return false
            }
        }
        if (answerMin !== '' && answerMax !== '' && Number(answerMin) > Number(answerMax)) {
            setErrorMessage('Answer min cannot be greater than answer max.'); return false
        }
        if (points < 1 || points > 5) { setErrorMessage('Points must be between 1 and 5.'); return false }
        return true
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        const questions = generateBatch({
            count,
            rowRanges: rowRanges.map(r => ({ min: Number(r.min) || 1, max: Number(r.max) || 9 })),
            allowSubtraction,
            level,
            answerMin,
            answerMax,
            questionType,
            points,
        })

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

    const selectedLevel = LEVEL_OPTIONS.find(l => l.value === level)

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

                {/* ── Question Level ────────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Question Level</label>
                    <div className="ai-radio-group">
                        {LEVEL_OPTIONS.map(opt => (
                            <label
                                key={opt.value}
                                className={`ai-radio-option ${level === opt.value ? 'ai-radio-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="level"
                                    value={opt.value}
                                    checked={level === opt.value}
                                    onChange={() => setLevel(opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <p className="autogen-level-desc">{selectedLevel?.desc}</p>
                </div>

                {/* ── Row Configuration ─────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">Row Configuration</label>

                    <div className="autogen-row-config-header">
                        <div className="autogen-number-row">
                            <span className="autogen-rc-label">Rows per question:</span>
                            <input
                                type="number"
                                className="ai-input autogen-number-input"
                                min={2}
                                max={20}
                                value={rowCount}
                                onChange={e => handleRowCountChange(e.target.value)}
                            />
                        </div>
                        <div className="autogen-preset-btns">
                            <span className="autogen-preset-label">Set all rows:</span>
                            {RANGE_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    className="autogen-preset-btn"
                                    onClick={() => applyPresetToAll(p.min, p.max)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="autogen-rows-table-wrap">
                        <table className="autogen-rows-table">
                            <thead>
                                <tr>
                                    <th>Row</th>
                                    <th>Min value</th>
                                    <th>Max value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rowRanges.map((r, i) => (
                                    <tr key={i}>
                                        <td className="autogen-row-num">#{i + 1}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="autogen-range-input"
                                                min={1}
                                                value={r.min}
                                                onChange={e => updateRowRange(i, 'min', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="autogen-range-input"
                                                min={1}
                                                value={r.max}
                                                onChange={e => updateRowRange(i, 'max', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="autogen-number-hint" style={{ marginTop: '0.4rem' }}>
                        Each row in the abacus grid will use a random number within its own min–max range.
                    </p>
                </div>

                {/* ── Answer Range ──────────────────────────────────────────── */}
                <div className="ai-field">
                    <label className="ai-label">
                        Answer Range
                        <span className="autogen-optional">(optional)</span>
                    </label>
                    <div className="autogen-answer-range-row">
                        <div className="autogen-range-field">
                            <span className="autogen-range-field-label">Min</span>
                            <input
                                type="number"
                                className="ai-input autogen-number-input"
                                min={1}
                                placeholder="—"
                                value={answerMin}
                                onChange={e => setAnswerMin(e.target.value)}
                            />
                        </div>
                        <span className="autogen-range-dash">–</span>
                        <div className="autogen-range-field">
                            <span className="autogen-range-field-label">Max</span>
                            <input
                                type="number"
                                className="ai-input autogen-number-input"
                                min={1}
                                placeholder="—"
                                value={answerMax}
                                onChange={e => setAnswerMax(e.target.value)}
                            />
                        </div>
                        <span className="autogen-number-hint">Leave blank for no limit</span>
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
                    <span className="autogen-summary-item">{selectedLevel?.label}</span>
                    <span className="autogen-summary-sep">·</span>
                    <span className="autogen-summary-item">{allowSubtraction ? '+ and −' : '+ only'}</span>
                    {(answerMin !== '' || answerMax !== '') && (
                        <>
                            <span className="autogen-summary-sep">·</span>
                            <span className="autogen-summary-item">
                                Answer: {answerMin !== '' ? answerMin : '?'}–{answerMax !== '' ? answerMax : '?'}
                            </span>
                        </>
                    )}
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
