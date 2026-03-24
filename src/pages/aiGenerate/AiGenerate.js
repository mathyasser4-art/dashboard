import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AiGenerate.css'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const buildPrompt = (questionType, topic, difficulty, count, chapterName) => {
    const typeLabel = questionType === 'MCQ' ? 'multiple-choice (MCQ)' : 'open-ended essay'
    const mcqShape = `{
  "question": "Question text here",
  "correctAnswer": "The one correct answer",
  "wrongAnswer": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
  "questionPoints": 2
}`
    const essayShape = `{
  "question": "Question text here",
  "answer": ["Accepted answer 1", "Accepted answer 2"],
  "questionPoints": 2
}`
    const shape = questionType === 'MCQ' ? mcqShape : essayShape

    return `You are an expert educational content creator for math and science subjects.
Generate exactly ${count} ${typeLabel} questions about "${topic}" for the chapter "${chapterName}".
Difficulty level: ${difficulty}.

STRICT RULES:
- Return ONLY a valid JSON object. No markdown, no code blocks, no explanation.
- Each question must be clear, educational, and appropriate for students.
- For MCQ: provide exactly 3 wrong answers and 1 correct answer.
- For Essay: provide 1-3 accepted answer variations.
- questionPoints should be between 1 and 5.
- Use plain text. Do not use LaTeX or special math symbols.

Return this exact JSON structure:
{
  "questions": [
    ${shape}
  ]
}`
}

const stripMarkdown = (text) => {
    return text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim()
}

const AiGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    const [apiKey, setApiKey] = useState('')
    const [topic, setTopic] = useState('')
    const [questionType, setQuestionType] = useState('MCQ')
    const [difficulty, setDifficulty] = useState('Medium')
    const [count, setCount] = useState(10)
    const [status, setStatus] = useState('idle') // idle | generating | saving | done | error
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key')
        if (savedKey) setApiKey(savedKey)
    }, [])

    const validate = () => {
        if (!apiKey.trim()) { setErrorMessage('API key is required'); return false }
        if (!topic.trim()) { setErrorMessage('Topic is required'); return false }
        if (!count || count < 1 || count > 100) { setErrorMessage('Enter a number of questions between 1 and 100'); return false }
        return true
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        // Save API key to localStorage for convenience
        localStorage.setItem('gemini_api_key', apiKey.trim())

        setStatus('generating')

        // Step 1: Call Gemini API
        let questions = []
        try {
            const prompt = buildPrompt(questionType, topic, difficulty, count, decodeURIComponent(chapterName))
            const response = await fetch(`${GEMINI_URL}?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
                })
            })

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}))
                const errMsg = errJson?.error?.message || `Gemini API error (${response.status})`
                throw new Error(errMsg)
            }

            const geminiData = await response.json()
            const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const cleanedText = stripMarkdown(rawText)
            const parsed = JSON.parse(cleanedText)
            questions = parsed.questions || []

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('AI returned no questions. Try a more specific topic.')
            }

            // Tag each question with its type
            questions = questions.map(q => ({ ...q, type: questionType }))
        } catch (err) {
            setStatus('error')
            setErrorMessage(err.message || 'Failed to generate questions. Check your API key and try again.')
            return
        }

        // Step 2: Save questions sequentially
        setStatus('saving')
        setProgress({ current: 0, total: questions.length })

        let saved = 0
        for (let i = 0; i < questions.length; i++) {
            setProgress({ current: i + 1, total: questions.length })
            try {
                await saveAiQuestion(questions[i], chapterID)
                saved++
            } catch (e) {
                // Continue saving remaining even if one fails
                console.error(`Failed to save question ${i + 1}:`, e)
            }
            // Small delay to avoid overwhelming the backend
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

    // ── GENERATING / SAVING screen ───────────────────────────────────────────
    if (status === 'generating' || status === 'saving') {
        return (
            <div className="ai-generate-page d-flex justify-content-center align-items-center">
                <div className="ai-progress-card d-flex flex-direction-column align-items-center">
                    <div className="ai-spinner"></div>
                    {status === 'generating' && (
                        <>
                            <p className="ai-progress-title text-color">Generating questions with AI...</p>
                            <p className="ai-progress-sub">This may take a few seconds</p>
                        </>
                    )}
                    {status === 'saving' && (
                        <>
                            <p className="ai-progress-title text-color">Saving questions to database...</p>
                            <p className="ai-progress-sub">
                                Saving question {progress.current} of {progress.total}
                            </p>
                            <div className="ai-progress-bar-track">
                                <div className="ai-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <p className="ai-progress-percent">{progressPercent}%</p>
                        </>
                    )}
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
                    <div className="ai-header-icon">🤖</div>
                    <div>
                        <p className="ai-page-title text-color">AI Question Generator</p>
                        <p className="ai-page-subtitle">
                            Chapter: <span className="ai-chapter-name">{decodeURIComponent(chapterName)}</span>
                        </p>
                    </div>
                </div>

                {errorMessage && <p className="text-error ai-error">{errorMessage}</p>}

                {/* API Key */}
                <div className="ai-field">
                    <label className="ai-label">
                        Gemini API Key
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="ai-key-link"
                        >
                            Get a free key at ai.google.dev →
                        </a>
                    </label>
                    <input
                        type="password"
                        className="ai-input"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                    />
                    {apiKey && (
                        <p className="ai-key-saved">✓ Your API key is saved locally in your browser</p>
                    )}
                </div>

                {/* Topic */}
                <div className="ai-field">
                    <label className="ai-label">Topic / Description</label>
                    <textarea
                        className="ai-textarea"
                        placeholder="Describe what the questions should be about (e.g. Linear equations, Chapter 3 exercises...)"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Question Type */}
                <div className="ai-field">
                    <label className="ai-label">Question Type</label>
                    <div className="ai-radio-group">
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
                    </div>
                </div>

                {/* Difficulty */}
                <div className="ai-field">
                    <label className="ai-label">Difficulty</label>
                    <div className="ai-radio-group">
                        {['Easy', 'Medium', 'Hard'].map(d => (
                            <label key={d} className={`ai-radio-option ${difficulty === d ? 'ai-radio-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="difficulty"
                                    value={d}
                                    checked={difficulty === d}
                                    onChange={() => setDifficulty(d)}
                                />
                                {d}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Count */}
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
                        🤖 Generate &amp; Save All Questions
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
