import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AutoGenerate.css'

// ─────────────────────────────────────────────
// 🔹 Helpers
// ─────────────────────────────────────────────

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min

const getDigitRange = (digitMode) => {
    if (digitMode === '1') return [1, 9]
    if (digitMode === '2') return [10, 99]
    return [1, 99]
}

// ─────────────────────────────────────────────
// 🔹 GENERATORS
// ─────────────────────────────────────────────

// ✅ Direct
const generateDirect = ({ rowCount, digitMode, allowSubtraction }) => {
    const [min, max] = getDigitRange(digitMode)
    const rows = []
    let total = 0

    for (let i = 0; i < rowCount; i++) {
        const isFirst = i === 0
        const canSubtract = !isFirst && allowSubtraction && total > min
        const useSubtract = canSubtract && Math.random() < 0.4

        if (useSubtract) {
            const val = randomInt(min, Math.min(max, total - 1))
            total -= val
            rows.push({ op: '-', val })
        } else {
            const val = randomInt(min, max)
            total += val
            rows.push({ op: '+', val })
        }
    }

    return { gridRows: rows, answer: total }
}

// 🔵 Friends of 5
const generateFriendsOf5 = (rowCount) => {
    const rows = []
    let total = 0

    const steps = Math.floor(rowCount / 2)

    for (let i = 0; i < steps; i++) {
        const n = randomInt(1, 4)

        rows.push({ op: '+', val: 5 })
        rows.push({ op: '-', val: 5 - n })

        total += n
    }

    return { gridRows: rows, answer: total }
}

// 🔴 Friends of 10
const generateFriendsOf10 = (rowCount) => {
    const rows = []
    let total = 0

    const steps = Math.floor(rowCount / 2)

    for (let i = 0; i < steps; i++) {
        const n = randomInt(1, 9)

        rows.push({ op: '+', val: 10 })
        rows.push({ op: '-', val: 10 - n })

        total += n
    }

    return { gridRows: rows, answer: total }
}

// 🟣 Mixed
const generateMixed = (rowCount, digitMode) => {
    const modes = ['direct', 'friends5', 'friends10']
    const choice = modes[randomInt(0, 2)]

    if (choice === 'direct')
        return generateDirect({ rowCount, digitMode, allowSubtraction: true })

    if (choice === 'friends5')
        return generateFriendsOf5(rowCount)

    return generateFriendsOf10(rowCount)
}

// ─────────────────────────────────────────────
// 🔹 WRONG ANSWERS
// ─────────────────────────────────────────────

const generateWrongAnswers = (correct, digitMode) => {
    const spread = digitMode === '1' ? 6 : 18
    const wrongs = new Set()

    while (wrongs.size < 3) {
        const offset = randomInt(1, spread)
        const val = Math.random() < 0.5
            ? correct + offset
            : correct - offset

        if (val > 0 && val !== correct) {
            wrongs.add(String(val))
        }
    }

    return [...wrongs]
}

// ─────────────────────────────────────────────
// 🔹 BATCH GENERATOR
// ─────────────────────────────────────────────

const generateBatch = ({
    count,
    rowCount,
    digitMode,
    allowSubtraction,
    questionType,
    points,
    mode
}) => {
    const questions = []

    for (let i = 0; i < count; i++) {
        let result

        if (mode === 'direct') {
            result = generateDirect({ rowCount, digitMode, allowSubtraction })
        } else if (mode === 'friends5') {
            result = generateFriendsOf5(rowCount)
        } else if (mode === 'friends10') {
            result = generateFriendsOf10(rowCount)
        } else {
            result = generateMixed(rowCount, digitMode)
        }

        const { gridRows, answer } = result

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

// ─────────────────────────────────────────────
// 🔹 COMPONENT
// ─────────────────────────────────────────────

const AutoGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    const [count, setCount] = useState(10)
    const [rowCount, setRowCount] = useState(6)
    const [digitMode, setDigitMode] = useState('1')
    const [allowSubtraction, setAllowSubtraction] = useState(false)
    const [questionType, setQuestionType] = useState('Essay')
    const [points, setPoints] = useState(2)
    const [mode, setMode] = useState('direct')

    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)

    const handleGenerate = async () => {
        const questions = generateBatch({
            count,
            rowCount,
            digitMode,
            allowSubtraction,
            questionType,
            points,
            mode
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
                console.error(e)
            }
        }

        setSavedCount(saved)
        setStatus('done')
    }

    if (status === 'done') {
        return (
            <div className="ai-generate-page">
                <h2>{savedCount} questions saved ✅</h2>
                <button onClick={() => setStatus('idle')}>Generate Again</button>
            </div>
        )
    }

    return (
        <div className="ai-generate-page">
            <h2>🧮 Abacus Generator</h2>

            {/* MODE */}
            <div>
                <label>Mode:</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                    <option value="direct">Direct</option>
                    <option value="friends5">Friends of 5</option>
                    <option value="friends10">Friends of 10</option>
                    <option value="mixed">Mixed</option>
                </select>
            </div>

            {/* SETTINGS */}
            <div>
                <label>Questions:</label>
                <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} />
            </div>

            <div>
                <label>Rows:</label>
                <input type="number" value={rowCount} onChange={e => setRowCount(Number(e.target.value))} />
            </div>

            <div>
                <label>Type:</label>
                <select value={questionType} onChange={e => setQuestionType(e.target.value)}>
                    <option value="Essay">Essay</option>
                    <option value="MCQ">MCQ</option>
                </select>
            </div>

            <button onClick={handleGenerate}>
                🚀 Generate Questions
            </button>
        </div>
    )
}

export default AutoGenerate