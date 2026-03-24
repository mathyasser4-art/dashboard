import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import mammoth from 'mammoth'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './AiGenerate.css'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp'

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
        const result = reader.result || ''
        const base64 = String(result).split(',')[1]
        if (!base64) {
            reject(new Error('Failed to convert the selected file.'))
            return
        }
        resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read the selected file.'))
    reader.readAsDataURL(file)
})

const extractWordText = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
}

const buildPrompt = (
    questionType,
    topic,
    count,
    chapterName,
    numberOfRows,
    numberOfDigits,
    operations,
    skillLevel,
    attachmentContext
) => {
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
    const selectedOperations = operations.length > 0 ? operations.join(', ') : 'addition (+)'
    const selectedSkillLevel = skillLevel.trim() || 'basic (direct)'

    return `You are an expert abacus worksheet creator and question extractor.
Generate exactly ${count} ${typeLabel} abacus questions for the chapter "${chapterName}".

ABACUS REQUIREMENTS:
- Topic / extra instructions: "${topic}"
- Number of rows per question: ${numberOfRows}
- Number of digits: ${numberOfDigits}
- Allowed operations: ${selectedOperations}
- Abacus skill / level: ${selectedSkillLevel}

FILE HANDLING RULES:
- If an attached file contains existing questions, read them carefully and convert them into dashboard-ready questions.
- Preserve the meaning of the source questions from the file, but normalize wording if needed.
- If the file includes answer choices or answers, use them to produce the correct dashboard JSON.
- If the file contains fewer than ${count} usable questions, create the remaining questions in the same style and difficulty.
- If no file is attached, generate all questions from the topic instructions only.

STRICT RULES:
- Return ONLY a valid JSON object. No markdown, no code blocks, no explanation.
- Every generated question must be specifically for abacus practice.
- Respect the requested row count, digit count, operations, and abacus skill level.
- Use plain text only.
- For MCQ: provide exactly 3 wrong answers and 1 correct answer.
- For Essay: provide 1-3 accepted answer variations.
- questionPoints should be between 1 and 5.

ATTACHMENT CONTEXT:
${attachmentContext || 'No attachment was provided.'}

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

const buildGeminiParts = async ({
    prompt,
    attachmentFile
}) => {
    const parts = [{ text: prompt }]

    if (!attachmentFile) {
        return parts
    }

    const isWordDocument = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(attachmentFile.type)

    if (isWordDocument) {
        const extractedText = await extractWordText(attachmentFile)
        if (!extractedText) {
            throw new Error('The Word file appears to be empty or unreadable.')
        }

        parts.push({
            text: `Attached Word document content:\n${extractedText.slice(0, 30000)}`
        })

        return parts
    }

    const normalizedMimeType = attachmentFile.type || 'application/octet-stream'
    const base64Data = await fileToBase64(attachmentFile)

    parts.push({
        inlineData: {
            mimeType: normalizedMimeType,
            data: base64Data
        }
    })

    return parts
}

const AiGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    const [apiKey, setApiKey] = useState('')
    const [topic, setTopic] = useState('')
    const [questionType, setQuestionType] = useState('MCQ')
    const [numberOfRows, setNumberOfRows] = useState(3)
    const [numberOfDigits, setNumberOfDigits] = useState(1)
    const [operations, setOperations] = useState(['+'])
    const [skillLevel, setSkillLevel] = useState('Basic (direct)')
    const [count, setCount] = useState(10)
    const [attachmentFile, setAttachmentFile] = useState(null)
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
        if (!topic.trim() && !attachmentFile) { setErrorMessage('Add a topic or attach a file'); return false }
        if (!numberOfRows || numberOfRows < 1 || numberOfRows > 20) { setErrorMessage('Enter a number of rows between 1 and 20'); return false }
        if (!numberOfDigits || numberOfDigits < 1 || numberOfDigits > 10) { setErrorMessage('Enter a number of digits between 1 and 10'); return false }
        if (!operations.length) { setErrorMessage('Select at least one operation'); return false }
        if (!skillLevel.trim()) { setErrorMessage('Skill level is required'); return false }
        if (!count || count < 1 || count > 100) { setErrorMessage('Enter a number of questions between 1 and 100'); return false }

        if (attachmentFile && attachmentFile.size > 20 * 1024 * 1024) {
            setErrorMessage('Attached files must be smaller than 20 MB')
            return false
        }

        return true
    }

    const handleOperationChange = (operation) => {
        setOperations(prev =>
            prev.includes(operation)
                ? prev.filter(item => item !== operation)
                : [...prev, operation]
        )
    }

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0] || null
        setErrorMessage('')

        if (!file) {
            setAttachmentFile(null)
            return
        }

        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp'
        ]

        const hasSupportedExtension = /\.(pdf|doc|docx|png|jpe?g|webp)$/i.test(file.name)

        if (!allowedMimeTypes.includes(file.type) && !hasSupportedExtension) {
            event.target.value = ''
            setAttachmentFile(null)
            setErrorMessage('Please attach a PDF, Word, or image file.')
            return
        }

        try {
            if (file.name.toLowerCase().endsWith('.doc') && file.type !== 'application/msword') {
                const arrayBuffer = await file.arrayBuffer()
                const repairedFile = new File(
                    [arrayBuffer],
                    file.name,
                    { type: 'application/msword' }
                )
                setAttachmentFile(repairedFile)
                return
            }

            setAttachmentFile(file)
        } catch (error) {
            event.target.value = ''
            setAttachmentFile(null)
            setErrorMessage('Failed to prepare the selected file.')
        }
    }

    const handleGenerate = async () => {
        if (!validate()) return
        setErrorMessage('')

        localStorage.setItem('gemini_api_key', apiKey.trim())

        setStatus('generating')

        let questions = []
        try {
            const prompt = buildPrompt(
                questionType,
                topic,
                count,
                decodeURIComponent(chapterName),
                numberOfRows,
                numberOfDigits,
                operations,
                skillLevel,
                attachmentFile
                    ? `A file named "${attachmentFile.name}" is attached. Read it and use it as the primary question source when possible.`
                    : ''
            )

            const parts = await buildGeminiParts({
                prompt,
                attachmentFile
            })

            const response = await fetch(`${GEMINI_URL}?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
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
                throw new Error('AI returned no questions. Try a more specific topic or a clearer file.')
            }

            questions = questions.map(q => ({ ...q, type: questionType }))
        } catch (err) {
            setStatus('error')
            setErrorMessage(err.message || 'Failed to generate questions. Check your API key and try again.')
            return
        }

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

    return (
        <div className="ai-generate-page">
            <div className="ai-form-container">
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

                <div className="ai-field">
                    <label className="ai-label">Topic / Description</label>
                    <textarea
                        className="ai-textarea"
                        placeholder="Describe the abacus worksheet you want and add any extra notes for the AI..."
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        rows={3}
                    />
                    <p className="ai-field-help">
                        You can write instructions here, attach a file below, or use both together.
                    </p>
                </div>

                <div className="ai-field">
                    <label className="ai-label">Attach questions file</label>
                    <label className="ai-upload-box">
                        <input
                            type="file"
                            className="ai-file-input"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={handleFileChange}
                        />
                        <span className="ai-upload-title">Upload PDF, Word, or image</span>
                        <span className="ai-upload-subtitle">
                            Supported: PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP
                        </span>
                    </label>
                    {attachmentFile && (
                        <div className="ai-file-pill">
                            <span className="ai-file-name">{attachmentFile.name}</span>
                            <button
                                type="button"
                                className="ai-file-remove"
                                onClick={() => setAttachmentFile(null)}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

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

                <div className="ai-field">
                    <label className="ai-label">Number of Rows</label>
                    <input
                        type="number"
                        className="ai-input ai-count-input"
                        min={1}
                        max={20}
                        value={numberOfRows}
                        onChange={e => setNumberOfRows(Number(e.target.value))}
                    />
                </div>

                <div className="ai-field">
                    <label className="ai-label">Number of Digits</label>
                    <input
                        type="number"
                        className="ai-input ai-count-input"
                        min={1}
                        max={10}
                        value={numberOfDigits}
                        onChange={e => setNumberOfDigits(Number(e.target.value))}
                    />
                </div>

                <div className="ai-field">
                    <label className="ai-label">Operations</label>
                    <div className="ai-checkbox-group">
                        {[
                            { value: '+', label: 'Addition (+)' },
                            { value: '-', label: 'Subtraction (-)' },
                            { value: 'x', label: 'Multiplication (x)' },
                            { value: 'divide', label: 'Division (divide)' }
                        ].map(operation => (
                            <label
                                key={operation.value}
                                className={`ai-radio-option ${operations.includes(operation.value) ? 'ai-radio-selected' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    name="operations"
                                    value={operation.value}
                                    checked={operations.includes(operation.value)}
                                    onChange={() => handleOperationChange(operation.value)}
                                />
                                {operation.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="ai-field">
                    <label className="ai-label">Abacus Skill / Level</label>
                    <select
                        className="ai-input"
                        value={skillLevel}
                        onChange={e => setSkillLevel(e.target.value)}
                    >
                        <option value="Basic (direct)">Basic (direct)</option>
                        <option value="Friends of 5">Friends of 5</option>
                        <option value="Friends of 10">Friends of 10</option>
                        <option value="Friends of 5 and 10">Friends of 5 and 10</option>
                        <option value="Other abacus skills">Other abacus skills</option>
                    </select>
                </div>

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

                <div className="ai-actions d-flex">
                    <button className="button ai-generate-btn" onClick={handleGenerate}>
                        🤖 Generate & Save All Questions
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
