import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import saveAiQuestion from '../../api/saveAiQuestion.api'
import correctIcon from '../../correct-icon.png'
import AbacusGrid from '../../components/AbacusGrid/AbacusGrid'
import '../../reusable.css'
import './AiGenerate.css'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv'

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

const AiGenerate = () => {
    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID } = useParams()

    const [apiKey, setApiKey] = useState('')
    const [status, setStatus] = useState('idle') // idle | generating | reviewing | saving | done | error
    const [chatHistory, setChatHistory] = useState([])
    const [userInput, setUserInput] = useState('')
    const [attachmentFile, setAttachmentFile] = useState(null)
    const [excelData, setExcelData] = useState(null)
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [savedCount, setSavedCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')
    
    const chatEndRef = useRef(null)

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key')
        if (savedKey) setApiKey(savedKey)
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory])

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0] || null
        setErrorMessage('')
        if (!file) return

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
                setExcelData(json)
                addMessage('user', `Uploaded Excel: ${file.name} (${json.length} rows detected)`)
            }
            reader.readAsArrayBuffer(file)
        }
        setAttachmentFile(file)
    }

    const addMessage = (role, text) => {
        setChatHistory(prev => [...prev, { role, text }])
    }

    const buildPrompt = (instruction) => {
        return `You are an expert abacus question extractor and interactive assistant.
Chapter: "${decodeURIComponent(chapterName)}"

CURRENT TASK: ${instruction}

STRICT ABACUS GRID RULES:
1. Every question must be returned in the "Abacus Grid" format.
2. The grid is a list of rows: [{"op": "+", "val": "10"}, {"op": "-", "val": "5"}].
3. NO WORDS in the question field. Only the grid JSON.
4. Calculate the correct answer for every grid.
5. If the user provides an Excel or File, prioritize extracting questions from it.
6. Number of rows per question should be variable (2-15) based on complexity.

RESPONSE FORMAT:
If you need clarification, ask a question normally.
If you are returning questions, return ONLY a JSON object:
{
  "questions": [
    {
      "gridRows": [{"op": "+", "val": "10"}, {"op": "-", "val": "5"}],
      "answer": ["5"],
      "questionPoints": 2,
      "type": "Essay"
    }
  ],
  "message": "Optional message to the user"
}

USER CONTEXT:
${excelData ? `Excel Content: ${JSON.stringify(excelData.slice(0, 50))}` : 'No excel data.'}
`
    }

    const handleSend = async (customInstruction) => {
        const messageText = customInstruction || userInput
        if (!messageText.trim() && !attachmentFile) return
        if (!apiKey.trim()) { setErrorMessage('Please enter your Gemini API key'); return }

        localStorage.setItem('gemini_api_key', apiKey.trim())
        if (!customInstruction) {
            addMessage('user', messageText)
            setUserInput('')
        }
        
        setStatus('generating')
        setErrorMessage('')

        try {
            const prompt = buildPrompt(messageText)
            const parts = [{ text: prompt }]

            if (attachmentFile && !attachmentFile.name.endsWith('.xlsx')) {
                const base64 = await fileToBase64(attachmentFile)
                parts.push({
                    inlineData: {
                        mimeType: attachmentFile.type || 'application/octet-stream',
                        data: base64
                    }
                })
            }

            const response = await fetch(`${GEMINI_URL}?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                })
            })

            if (!response.ok) throw new Error('Gemini API Error')

            const data = await response.json()
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            
            try {
                const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
                const parsed = JSON.parse(cleaned)
                
                if (parsed.questions) {
                    setGeneratedQuestions(parsed.questions)
                    addMessage('model', parsed.message || `I've generated ${parsed.questions.length} questions for you. Review them below.`)
                    setStatus('reviewing')
                } else {
                    addMessage('model', rawText)
                    setStatus('idle')
                }
            } catch (e) {
                addMessage('model', rawText)
                setStatus('idle')
            }
        } catch (err) {
            setErrorMessage(err.message)
            setStatus('error')
        }
    }

    const handleSaveAll = async () => {
        setStatus('saving')
        setProgress({ current: 0, total: generatedQuestions.length })
        let saved = 0
        for (let i = 0; i < generatedQuestions.length; i++) {
            setProgress({ current: i + 1, total: generatedQuestions.length })
            try {
                await saveAiQuestion(generatedQuestions[i], chapterID)
                saved++
            } catch (e) { console.error(e) }
            await new Promise(r => setTimeout(r, 200))
        }
        setSavedCount(saved)
        setStatus('done')
    }

    if (status === 'done') {
        return (
            <div className="ai-generate-page d-flex justify-content-center align-items-center">
                <div className="ai-success-card d-flex flex-direction-column align-items-center">
                    <img src={correctIcon} className="ai-success-icon" alt="success" />
                    <p className="ai-success-title text-color">{savedCount} Grid questions saved!</p>
                    <button className="button" onClick={() => window.location.reload()}>Finish</button>
                </div>
            </div>
        )
    }

    return (
        <div className="ai-generate-page">
            <div className="ai-workspace">
                <div className="ai-chat-container">
                    <div className="ai-header">
                        <div className="ai-header-icon">🤖</div>
                        <div>
                            <p className="ai-page-title">Interactive AI Workspace</p>
                            <p className="ai-page-subtitle">Chapter: {decodeURIComponent(chapterName)}</p>
                        </div>
                    </div>

                    <div className="ai-chat-history">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {status === 'generating' && <div className="chat-bubble model">Thinking...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    {errorMessage && <p className="ai-error">{errorMessage}</p>}

                    <div className="ai-chat-input-area">
                        <input 
                            type="password" 
                            className="ai-key-input" 
                            placeholder="Gemini API Key"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                        />
                        <div className="ai-input-wrapper">
                            <textarea 
                                className="ai-chat-textarea"
                                placeholder="Tell the AI what to do (e.g. 'Extract questions from the attached Excel')..."
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            />
                            <div className="ai-chat-actions">
                                <label className="ai-attach-btn">
                                    📎 Attach File
                                    <input type="file" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES} hidden />
                                </label>
                                <button className="button ai-send-btn" onClick={() => handleSend()}>Send</button>
                            </div>
                        </div>
                        {attachmentFile && (
                            <div className="ai-file-pill">
                                <span>{attachmentFile.name}</span>
                                <button onClick={() => setAttachmentFile(null)}>×</button>
                            </div>
                        )}
                    </div>
                </div>

                {status === 'reviewing' && (
                    <div className="ai-review-container">
                        <h3>Review Generated Questions ({generatedQuestions.length})</h3>
                        <div className="ai-review-list">
                            {generatedQuestions.map((q, i) => (
                                <div key={i} className="ai-review-item">
                                    <AbacusGrid rows={q.gridRows} onChange={(newRows) => {
                                        const updated = [...generatedQuestions];
                                        updated[i].gridRows = newRows;
                                        setGeneratedQuestions(updated);
                                    }} />
                                    <p>Answer: {q.answer[0]}</p>
                                </div>
                            ))}
                        </div>
                        <button className="button save-all-btn" onClick={handleSaveAll}>Save All to Chapter</button>
                    </div>
                )}

                {status === 'saving' && (
                    <div className="ai-saving-overlay">
                        <div className="ai-progress-card">
                            <div className="ai-spinner"></div>
                            <p>Saving {progress.current} / {progress.total}...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AiGenerate
