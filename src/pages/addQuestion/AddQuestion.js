import React, { useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import addQuestion from '../../api/addQuestion.api'
import addAnswerPic from '../../api/addAnswerPic.api'
import addGraphQuestion from '../../api/addGraphQuestion.api';
import correctIcon from '../../correct-icon.png'
import NumeralKeyboard from '../../components/NumeralKeyboard/NumeralKeyboard'
import AbacusGrid from '../../components/AbacusGrid/AbacusGrid';
import '../../reusable.css';
import './AddQuestion.css'

const FILE_COLUMNS_HELP = 'Supported columns: question, answer, answers, mark/questionPoints, type, answer1, answer2, answer3, answer4, correctAnswer.'

const normalizeValue = (value) => {
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return value.trim()
    return String(value).trim()
}

const normalizeQuestionType = (value) => {
    const normalized = normalizeValue(value).toLowerCase()
    if (normalized.includes('mcq') || normalized.includes('multiple')) return 'MCQ Question'
    if (normalized.includes('graph')) return 'Graph Question'
    return 'Essay Question'
}

const splitAnswers = (value) => {
    const normalized = normalizeValue(value)
    if (!normalized) return []
    return normalized
        .split(/[\n|;,]+/)
        .map(item => item.trim())
        .filter(Boolean)
}

const formatImportedQuestion = (value) => {
    return normalizeValue(value).replace(/\s+/g, '\n')
}

const renderImportedQuestion = (question) => {
    return question.split('\n').map((line, index) => (
        <span key={`${line}-${index}`} className="import-table__question-line">
            {line === '+' ? <span className="hidden-plus">+</span> : line}
        </span>
    ))
}

const parseImportedRows = (rows) => {
    return rows
        .map((row, index) => {
            const question = formatImportedQuestion(row.question || row.Question || row.QUESTION || row.text || row.Text)
            const mark = normalizeValue(row.mark || row.MARK || row.questionPoints || row.QuestionPoints || row.score || row.Score)
            const type = normalizeQuestionType(row.type || row.Type || row.questionType || row.QuestionType)
            const combinedAnswers = splitAnswers(row.answers || row.Answers || row.answer || row.Answer)
            const mcqAnswers = [
                normalizeValue(row.answer1 || row.Answer1),
                normalizeValue(row.answer2 || row.Answer2),
                normalizeValue(row.answer3 || row.Answer3),
                normalizeValue(row.answer4 || row.Answer4)
            ].filter(Boolean)
            const correctAnswer = normalizeValue(row.correctAnswer || row.CorrectAnswer)

            const answers = type === 'MCQ Question' ? mcqAnswers : combinedAnswers

            return {
                id: `${index}-${question}`,
                rowNumber: index + 2,
                question,
                mark,
                type,
                answers,
                mcqAnswers,
                correctAnswer,
                isValid: Boolean(question && mark && (type === 'MCQ Question' ? mcqAnswers.length === 4 : answers.length > 0)),
                raw: row
            }
        })
        .filter(item => item.question || item.mark || item.answers.length || item.mcqAnswers.length)
}

const buildQuestionFormData = ({ item, chapterID, questionIndex }) => {
    const data = new FormData()
    data.append('question', item.question)

    if (item.type === 'Essay Question') {
        item.answers.forEach(answerItem => {
            data.append('answer', answerItem)
        })
    }

    if (item.type === 'MCQ Question') {
        const [answer1 = '', answer2 = '', answer3 = '', answer4 = ''] = item.mcqAnswers
        const finalCorrectAnswer = item.correctAnswer || answer1

        data.append('correctAnswer', finalCorrectAnswer)
        data.append('wrongAnswer', answer1)
        data.append('wrongAnswer', answer2)
        data.append('wrongAnswer', answer3)
        data.append('wrongAnswer', answer4)
        data.append('typeOfAnswer', 'MCQ')
    } else if (item.type === 'Graph Question') {
        data.append('typeOfAnswer', 'Graph')
    }

    data.append('questionPoints', item.mark)
    data.append('chapter', chapterID)
    data.append('index', questionIndex)
    return data
}

const createQuestionPromise = (data, questionType) => {
    return new Promise((resolve, reject) => {
        addQuestion(
            data,
            (error) => {
                if (error) reject(new Error(error))
            },
            () => { },
            () => resolve(),
            () => { },
            questionType,
            () => resolve()
        )
    })
}

const AddQuestion = () => {
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [serverLoadingPic, setServerLoadingPic] = useState(false)
    const [question, setQuestion] = useState('')
    const [useGrid, setUseGrid] = useState(true)
    const [gridRows, setGridRows] = useState([
        { op: '+', val: '' },
        { op: '+', val: '' }
    ])
    const [answer, setAnswer] = useState('')
    const [questionPoint, setQuestionPoint] = useState('')
    const [allAnswer, setAllAnswer] = useState([])
    const [questionPic, setQuestionPic] = useState()
    const [answerPic, setAnswerPic] = useState()
    const [previewQuestionPic, setPreviewQuestionPic] = useState()
    const [previewAnswerPic, setPreviewAnswerPic] = useState()
    const [quesionAdded, setQuesionAdded] = useState(false)
    const [quesionGraphAdded, setQuesionGraphAdded] = useState(false)
    const [quesionFullAdded, setQuesionFullAdded] = useState(false)
    const [quesionID, setQuesionID] = useState()
    const [mcqAnswerFs, setMcqAnswerFs] = useState('')
    const [mcqAnswerSe, setMcqAnswerSe] = useState('')
    const [mcqAnswerTh, setMcqAnswerTh] = useState('')
    const [mcqAnswerFr, setMcqAnswerFr] = useState('')
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [questionType, setQuestionType] = useState('Essay Question')
    const [autoCorrect, setAutoCorrect] = useState(false)
    const [mcqAnswerFrPic, setMcqAnswerFrPic] = useState()
    const [previewCorrectAP, setPreviewCorrectAP] = useState('')
    const [wrongAnswerPicFs, setWrongAnswerPicFs] = useState()
    const [previewWrongAPFs, setPreviewWrongAPFs] = useState('')
    const [wrongAnswerPicSe, setWrongAnswerPicSe] = useState()
    const [previewWrongAPSe, setPreviewWrongAPSe] = useState('')
    const [wrongAnswerPicTh, setWrongAnswerPicTh] = useState()
    const [previewWrongAPTh, setPreviewWrongAPTh] = useState('')
    const [serverGraphError, setServerGraphError] = useState(null)
    const [serverGraphLoading, setServerGraphLoading] = useState(false)
    const [activeAnswerField, setActiveAnswerField] = useState(null)
    const [importedQuestions, setImportedQuestions] = useState([])
    const [importError, setImportError] = useState(null)
    const [importSuccess, setImportSuccess] = useState(null)
    const [selectedImportIndex, setSelectedImportIndex] = useState(0)
    const [bulkImportLoading, setBulkImportLoading] = useState(false)

    const fileInputRef = useRef(null)

    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID, questionNum } = useParams()
    const navigate = useNavigate()

    const selectedImportedQuestion = useMemo(() => {
        return importedQuestions[selectedImportIndex] || null
    }, [importedQuestions, selectedImportIndex])

    const selectQuestionPic = (e) => {
        setQuestionPic(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewQuestionPic(picUrl)
    }

    const selectAnswerPic = (e) => {
        setAnswerPic(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewAnswerPic(picUrl)
    }

    const selectmcqAnswerFrPic = (e) => {
        setMcqAnswerFrPic(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewCorrectAP(picUrl)
    }

    const selectWrongAnswerPicFs = (e) => {
        setWrongAnswerPicFs(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewWrongAPFs(picUrl)
    }

    const selectWrongAnswerPicSe = (e) => {
        setWrongAnswerPicSe(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewWrongAPSe(picUrl)
    }

    const selectWrongAnswerPicTh = (e) => {
        setWrongAnswerPicTh(e.target.files[0])
        const picUrl = URL.createObjectURL(e.target.files[0])
        setPreviewWrongAPTh(picUrl)
    }

    const addAnswer = () => {
        if (answer === '') return;
        setAllAnswer(current => [...current, answer]);
        setAnswer('');
        setActiveAnswerField(null)
    }

    const removeAnswer = (item) => {
        setAllAnswer(current => current.filter(e => e !== item))
    }

    const addNewQuestion = () => {
        const finalQuestion = useGrid ? JSON.stringify(gridRows) : question;

        if (!finalQuestion || questionPoint === '' || allAnswer.length === 0 && questionType === 'Essay Question'
            || mcqAnswerFr === '' && questionType === 'MCQ Question' || mcqAnswerFs === '' && questionType === 'MCQ Question'
            || mcqAnswerSe === '' && questionType === 'MCQ Question' || mcqAnswerTh === '' && questionType === 'MCQ Question') {
            setserverOperationError('Enter the question data first!')
        } else {
            const data = new FormData()
            if (questionPic)
                data.append('image', questionPic)
            data.append('question', finalQuestion)
            if (questionType === 'Essay Question') {
                allAnswer.forEach(item => {
                    data.append('answer', item)
                })
            }
            if (questionType === 'MCQ Question') {
                if (correctAnswer === '') {
                    data.append('correctAnswer', mcqAnswerFs)
                } else {
                    data.append('correctAnswer', correctAnswer)
                }
                data.append('wrongAnswer', mcqAnswerFs)
                data.append('wrongAnswer', mcqAnswerSe)
                data.append('wrongAnswer', mcqAnswerTh)
                data.append('wrongAnswer', mcqAnswerFr)
            }
            if (autoCorrect)
                data.append('autoCorrect', true)
            if (questionType === 'MCQ Question') {
                data.append('typeOfAnswer', 'MCQ')
            } else if (questionType === 'Graph Question') {
                data.append('typeOfAnswer', 'Graph')
            }
            data.append('questionPoints', questionPoint)
            data.append('chapter', chapterID)
            data.append('index', questionNum)
            addQuestion(data, setserverOperationError, setServerOperationLoading, setQuesionAdded, setQuesionID, questionType, setQuesionGraphAdded)
        }
    }

    const uploadAnswerPic = () => {
        if (answerPic) {
            const data = new FormData()
            data.append('image', answerPic)
            addAnswerPic(data, quesionID, setserverOperationError, setServerLoadingPic, setQuesionFullAdded, 'add', navigate, chapterID, questionTypeID, unitID)
        } else {
            setserverOperationError('Upload the answer picture first!')
        }
    }

    const uploadAnswerGraphPic = () => {
        if (previewCorrectAP === '' || previewWrongAPFs === '' || previewWrongAPSe === '' || previewWrongAPTh === '') {
            setServerGraphError('Upload the answer pictures first!')
        } else {
            const data = new FormData()
            data.append('image', mcqAnswerFrPic)
            data.append('image', wrongAnswerPicFs)
            data.append('image', wrongAnswerPicSe)
            data.append('image', wrongAnswerPicTh)
            addGraphQuestion(data, quesionID, setServerGraphError, setServerGraphLoading, setQuesionAdded)
        }
    }

    const newQuestion = () => {
        setQuestion('')
        setGridRows([{ op: '+', val: '' }, { op: '+', val: '' }])
        setQuesionFullAdded(false)
        setAnswer('')
        setQuestionPoint('')
        setAllAnswer([])
        setQuestionPic()
        setAnswerPic()
        setPreviewQuestionPic()
        setPreviewAnswerPic()
        setQuesionAdded(false)
        setQuesionGraphAdded(false)
        setMcqAnswerFr('')
        setMcqAnswerFs('')
        setMcqAnswerSe('')
        setMcqAnswerTh('')
        setCorrectAnswer('')
        setPreviewCorrectAP('')
        setPreviewWrongAPFs('')
        setPreviewWrongAPSe('')
        setPreviewWrongAPTh('')
        setServerGraphError(null)
        setserverOperationError(null)
        setActiveAnswerField(null)
    }

    const handleChecked = (value) => {
        setQuestionType(value);
    }

    const checkedCorrecrAnswer = (value) => {
        setCorrectAnswer(value)
    }

    const getActiveAnswerValue = () => {
        if (activeAnswerField === 'essay') return answer
        if (activeAnswerField === 'mcq-1') return mcqAnswerFs
        if (activeAnswerField === 'mcq-2') return mcqAnswerSe
        if (activeAnswerField === 'mcq-3') return mcqAnswerTh
        if (activeAnswerField === 'mcq-4') return mcqAnswerFr
        return ''
    }

    const setActiveAnswerValue = (value) => {
        if (activeAnswerField === 'essay') setAnswer(value)
        if (activeAnswerField === 'mcq-1') setMcqAnswerFs(value)
        if (activeAnswerField === 'mcq-2') setMcqAnswerSe(value)
        if (activeAnswerField === 'mcq-3') setMcqAnswerTh(value)
        if (activeAnswerField === 'mcq-4') setMcqAnswerFr(value)
    }

    const insertNumeral = (numeral) => {
        const currentValue = getActiveAnswerValue()
        setActiveAnswerValue(`${currentValue}${numeral}`)
    }

    const backspaceNumeral = () => {
        const currentValue = getActiveAnswerValue()
        setActiveAnswerValue(currentValue.slice(0, -1))
    }

    const insertSpace = () => {
        const currentValue = getActiveAnswerValue()
        setActiveAnswerValue(`${currentValue} `)
    }

    const resetImportedQuestions = () => {
        setImportedQuestions([])
        setSelectedImportIndex(0)
        setImportError(null)
        setImportSuccess(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const loadImportedQuestionIntoForm = (item) => {
        setUseGrid(false)
        setQuestion(item.question)
        setQuestionPoint(item.mark)
        setQuestionType(item.type)
        setserverOperationError(null)
        setImportSuccess(`Loaded row ${item.rowNumber} into the form. You can review and click Add.`)

        if (item.type === 'MCQ Question') {
            setAllAnswer([])
            setAnswer('')
            setMcqAnswerFs(item.mcqAnswers[0] || '')
            setMcqAnswerSe(item.mcqAnswers[1] || '')
            setMcqAnswerTh(item.mcqAnswers[2] || '')
            setMcqAnswerFr(item.mcqAnswers[3] || '')
            setCorrectAnswer(item.correctAnswer || item.mcqAnswers[0] || '')
        } else {
            setMcqAnswerFs('')
            setMcqAnswerSe('')
            setMcqAnswerTh('')
            setMcqAnswerFr('')
            setCorrectAnswer('')
            setAnswer('')
            setAllAnswer(item.answers)
        }
    }

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setImportError(null)
            setImportSuccess(null)
            const buffer = await file.arrayBuffer()
            const workbook = XLSX.read(buffer, { type: 'array' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
            const parsedRows = parseImportedRows(rawRows)

            if (!parsedRows.length) {
                setImportedQuestions([])
                setImportError('No valid rows were found in the selected file. Make sure the file includes question, answer/answers, and mark columns.')
                return
            }

            setImportedQuestions(parsedRows)
            setSelectedImportIndex(0)
            setImportSuccess(`Loaded ${parsedRows.length} row(s) from ${file.name}.`)
        } catch (error) {
            setImportedQuestions([])
            setImportError(`Could not read the file. ${error.message}`)
        }
    }

    const importAllQuestions = async () => {
        const validRows = importedQuestions.filter(item => item.isValid && item.type !== 'Graph Question')

        if (!validRows.length) {
            setImportError('There are no compatible rows to import. Graph questions and incomplete rows must be handled manually.')
            return
        }

        try {
            setBulkImportLoading(true)
            setImportError(null)
            setImportSuccess(null)

            for (let index = 0; index < validRows.length; index += 1) {
                const item = validRows[index]
                const data = buildQuestionFormData({
                    item,
                    chapterID,
                    questionIndex: Number(questionNum) + index
                })
                await createQuestionPromise(data, item.type)
            }

            setImportSuccess(`Imported ${validRows.length} question(s) to the database. Graph rows were skipped because they still need image uploads.`)
        } catch (error) {
            setImportError(`Bulk import stopped. ${error.message}`)
        } finally {
            setBulkImportLoading(false)
        }
    }

    return (
        <div className="add-question">
            <div>
                <p className='text-color head-title'>Add new question in <span>{(questionTypeName === 'Past Papers') ? 'exam' : 'chapter'}</span> (<span style={{ color: "rgb(56, 56, 238)" }}>{chapterName}</span>)</p>
                {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}

                <div className="import-card">
                    <div className="import-card__header">
                        <div>
                            <p className="import-card__title">Import questions from Excel or CSV</p>
                            <p className="import-card__subtitle">Upload `.xlsx`, `.xls`, or `.csv` files with question, answer(s), and mark columns.</p>
                        </div>
                        <button type="button" className="button import-card__button" onClick={() => fileInputRef.current?.click()}>
                            Choose File
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        className="select-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportFile}
                    />

                    <p className="import-card__hint">{FILE_COLUMNS_HELP}</p>

                    {importError ? <p className="text-error">{importError}</p> : ''}
                    {importSuccess ? <p className="import-card__success">{importSuccess}</p> : ''}

                    {importedQuestions.length ? (
                        <div className="import-preview">
                            <div className="import-preview__actions">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => selectedImportedQuestion && loadImportedQuestionIntoForm(selectedImportedQuestion)}
                                >
                                    Load Selected Row
                                </button>
                                <button
                                    type="button"
                                    className="button"
                                    onClick={importAllQuestions}
                                    disabled={bulkImportLoading}
                                >
                                    {bulkImportLoading ? <span className="button-loader"></span> : 'Import All Compatible Rows'}
                                </button>
                                <button
                                    type="button"
                                    className="button cancel-button"
                                    onClick={resetImportedQuestions}
                                >
                                    Clear Import
                                </button>
                            </div>

                            <div className="import-preview__meta">
                                <p>Total rows: <strong>{importedQuestions.length}</strong></p>
                                <p>Valid rows: <strong>{importedQuestions.filter(item => item.isValid).length}</strong></p>
                                <p>Selected row: <strong>{selectedImportedQuestion?.rowNumber || '-'}</strong></p>
                            </div>

                            <div className="import-preview__table-wrapper">
                                <table className="import-table">
                                    <thead>
                                        <tr>
                                            <th>Use</th>
                                            <th>Row</th>
                                            <th>Type</th>
                                            <th>Question</th>
                                            <th>Answer / Options</th>
                                            <th>Mark</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedQuestions.map((item, index) => (
                                            <tr key={item.id} className={selectedImportIndex === index ? 'is-selected' : ''}>
                                                <td>
                                                    <input
                                                        type="radio"
                                                        name="selected-import-row"
                                                        checked={selectedImportIndex === index}
                                                        onChange={() => setSelectedImportIndex(index)}
                                                    />
                                                </td>
                                                <td>{item.rowNumber}</td>
                                                <td>{item.type}</td>
                                                <td className="import-table__question-cell">{renderImportedQuestion(item.question)}</td>
                                                <td>{item.type === 'MCQ Question' ? item.mcqAnswers.join(' | ') : item.answers.join(' | ')}</td>
                                                <td>{item.mark}</td>
                                                <td>{item.isValid ? 'Ready' : 'Missing data'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : ''}
                </div>

                <fieldset>
                    <legend>Choose the type of question</legend>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="essay_question_type" checked={questionType === 'Essay Question'} value="Essay Question" name="question_type" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="essay_question_type">Essay Question</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="mcq_question_type" checked={questionType === 'MCQ Question'} value="MCQ Question" name="question_type" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="mcq_question_type">MCQ Question</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="graph_question_type" checked={questionType === 'Graph Question'} value="Graph Question" name="question_type" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="graph_question_type">Graph Question</label>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>This question is auto correct?</legend>
                    <div className='d-flex align-items-center'>
                        <input type="checkbox" id="auto_correct_question" name="auto_correct_question" onChange={e => setAutoCorrect(e.target.checked)} />
                        <label htmlFor="auto_correct_question">Auto Correct</label>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Question Format</legend>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="format_grid" checked={useGrid} onChange={() => setUseGrid(true)} />
                        <label htmlFor="format_grid">Abacus Grid (Recommended)</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="format_text" checked={!useGrid} onChange={() => setUseGrid(false)} />
                        <label htmlFor="format_text">Plain Text</label>
                    </div>
                </fieldset>

                {(previewQuestionPic) ? <img className='preview-img' src={previewQuestionPic} alt="" /> : <label>
                    <div>
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <p>Choose the question picture</p>
                    </div>
                    <input className='select-input' type="file" name='images' onChange={selectQuestionPic} accept='.png, .jpg, .jpeg, .webp' />
                </label>}

                {useGrid ? (
                    <AbacusGrid rows={gridRows} onChange={setGridRows} />
                ) : (
                    <textarea
                        rows={4}
                        placeholder="Type your question here"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        style={{ boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '1rem' }}
                    />
                )}
                {(questionType === 'Essay Question') ? <>
                    <div className="keyboard essay-answer">
                        <div className="essay-math-input">
                            <input
                                type="text"
                                placeholder="Type the answer using English or Arabic numerals"
                                value={answer}
                                onFocus={() => setActiveAnswerField('essay')}
                                onChange={e => setAnswer(e.target.value)}
                            />
                            {activeAnswerField === 'essay' ? (
                                <NumeralKeyboard
                                    onInsert={insertNumeral}
                                    onBackspace={backspaceNumeral}
                                    onSpace={insertSpace}
                                    onClose={() => setActiveAnswerField(null)}
                                />
                            ) : ''}
                        </div>
                        <li onClick={addAnswer}>+</li>
                    </div>
                    <div className='d-flex flex-wrap'>
                        {(allAnswer.length !== 0) ? allAnswer.map(item => {
                            return (
                                <div className='answer-item' key={item}>
                                    <p>{item}</p>
                                    <span onClick={() => removeAnswer(item)}>x</span>
                                </div>
                            )
                        }) : ''}
                    </div>
                </> : (questionType === "MCQ Question") ? <div className="keyboard mcq-answer d-flex">

                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="correct_mcq_1" checked={(correctAnswer || mcqAnswerFs) === mcqAnswerFs && mcqAnswerFs !== ''} value={mcqAnswerFs} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 1 (Correct answer)</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Type answer 1"
                            value={mcqAnswerFs}
                            onFocus={() => setActiveAnswerField('mcq-1')}
                            onChange={e => setMcqAnswerFs(e.target.value)}
                        />
                        {activeAnswerField === 'mcq-1' ? (
                            <NumeralKeyboard
                                onInsert={insertNumeral}
                                onBackspace={backspaceNumeral}
                                onSpace={insertSpace}
                                onClose={() => setActiveAnswerField(null)}
                            />
                        ) : ''}
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="correct_mcq_2" checked={correctAnswer === mcqAnswerSe && mcqAnswerSe !== ''} value={mcqAnswerSe} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 2 (Correct answer)</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Type answer 2"
                            value={mcqAnswerSe}
                            onFocus={() => setActiveAnswerField('mcq-2')}
                            onChange={e => setMcqAnswerSe(e.target.value)}
                        />
                        {activeAnswerField === 'mcq-2' ? (
                            <NumeralKeyboard
                                onInsert={insertNumeral}
                                onBackspace={backspaceNumeral}
                                onSpace={insertSpace}
                                onClose={() => setActiveAnswerField(null)}
                            />
                        ) : ''}
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="correct_mcq_3" checked={correctAnswer === mcqAnswerTh && mcqAnswerTh !== ''} value={mcqAnswerTh} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 3 (Correct answer)</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Type answer 3"
                            value={mcqAnswerTh}
                            onFocus={() => setActiveAnswerField('mcq-3')}
                            onChange={e => setMcqAnswerTh(e.target.value)}
                        />
                        {activeAnswerField === 'mcq-3' ? (
                            <NumeralKeyboard
                                onInsert={insertNumeral}
                                onBackspace={backspaceNumeral}
                                onSpace={insertSpace}
                                onClose={() => setActiveAnswerField(null)}
                            />
                        ) : ''}
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="correct_mcq_4" checked={correctAnswer === mcqAnswerFr && mcqAnswerFr !== ''} value={mcqAnswerFr} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 4 (Correct answer)</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Type answer 4"
                            value={mcqAnswerFr}
                            onFocus={() => setActiveAnswerField('mcq-4')}
                            onChange={e => setMcqAnswerFr(e.target.value)}
                        />
                        {activeAnswerField === 'mcq-4' ? (
                            <NumeralKeyboard
                                onInsert={insertNumeral}
                                onBackspace={backspaceNumeral}
                                onSpace={insertSpace}
                                onClose={() => setActiveAnswerField(null)}
                            />
                        ) : ''}
                    </div>
                </div> : ''}
                <input type="text" placeholder='Enter the question points' value={questionPoint} onChange={e => setQuestionPoint(e.target.value)} />
                <div className="d-flex">
                    <button className='button' onClick={addNewQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                    <Link to={`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`}><button className='button cancel-button'>Cancel</button></Link>
                </div>
                {(quesionGraphAdded) ? <div className='correct d-flex align-items-center'>
                    <img src={correctIcon} alt="" />
                    <p>Question added success. you can add the graph answer pictures now.</p>
                </div> : ''}
                {(questionType === "Graph Question") ? <><div className="graph-container d-flex">
                    {(previewCorrectAP) ? <img src={previewCorrectAP} className="graph-preview graph-preview-fs" alt="" /> : <label className={`${(quesionGraphAdded) ? '' : 'answer-pic'} graph-img graph-img-fs`}>
                        <div>
                            <i className="fa fa-camera" aria-hidden="true"></i>
                            <p>Choose the correct answer picture</p>
                        </div>
                        {(quesionGraphAdded) ? <input className='select-input' type="file" name='images' onChange={selectmcqAnswerFrPic} accept='.png, .jpg, .jpeg, .webp' /> : ""}
                    </label>}
                    {(previewWrongAPFs) ? <img src={previewWrongAPFs} className="graph-preview" alt="" /> : <label className={`${(quesionGraphAdded) ? '' : 'answer-pic'} graph-img`}>
                        <div>
                            <i className="fa fa-camera" aria-hidden="true"></i>
                            <p>Choose the wrong answer picture(1)</p>
                        </div>
                        {(quesionGraphAdded) ? <input className='select-input' type="file" name='images' onChange={selectWrongAnswerPicFs} accept='.png, .jpg, .jpeg, .webp' /> : ""}
                    </label>}
                    {(previewWrongAPSe) ? <img src={previewWrongAPSe} className="graph-preview" alt="" /> : <label className={`${(quesionGraphAdded) ? '' : 'answer-pic'} graph-img`}>
                        <div>
                            <i className="fa fa-camera" aria-hidden="true"></i>
                            <p>Choose the wrong answer picture(2)</p>
                        </div>
                        {(quesionGraphAdded) ? <input className='select-input' type="file" name='images' onChange={selectWrongAnswerPicSe} accept='.png, .jpg, .jpeg, .webp' /> : ""}
                    </label>}
                    {(previewWrongAPTh) ? <img src={previewWrongAPTh} className="graph-preview" alt="" /> : <label className={`${(quesionGraphAdded) ? '' : 'answer-pic'} graph-img`}>
                        <div>
                            <i className="fa fa-camera" aria-hidden="true"></i>
                            <p>Choose the wrong answer picture(3)</p>
                        </div>
                        {(quesionGraphAdded) ? <input className='select-input' type="file" name='images' onChange={selectWrongAnswerPicTh} accept='.png, .jpg, .jpeg, .webp' /> : ""}
                    </label>}
                </div>
                    {(serverGraphError) ? <p className='text-error'>{serverGraphError}</p> : ''}
                    <div className="d-flex">
                        <button className='button answer-button' onClick={uploadAnswerGraphPic}>{(serverGraphLoading) ? <span className="button-loader"></span> : 'Upload Pictures'}</button>
                    </div>
                </> : ""}
                {(quesionAdded) ? <div className='correct d-flex align-items-center'>
                    <img src={correctIcon} alt="" />
                    <p>Question added success. you can add the answer model picture now.</p>
                </div> : ''}
                {(previewAnswerPic) ? <img className='preview-img' src={previewAnswerPic} alt="" /> : <label className={`${(quesionAdded) ? '' : 'answer-pic'}`}>
                    <div>
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <p>Choose the answer picture</p>
                    </div>
                    {(quesionAdded) ? <input className='select-input' type="file" name='images' onChange={selectAnswerPic} accept='.png, .jpg, .jpeg, .webp' /> : ""}
                </label>}
                <div className="d-flex">
                    <button className='button answer-button' onClick={uploadAnswerPic}>{(serverLoadingPic) ? <span className="button-loader"></span> : 'Add'}</button>
                </div>
            </div>
            {(quesionFullAdded) ? <div className="add-question-popup question-popup d-flex justify-content-center align-items-center">
                <div className='d-flex justify-content-center align-items-center flex-direction-column '>
                    <img src={correctIcon} alt="" />
                    <p className='text-color'>Success</p>
                    <p className='text-color'>Congratulations, the full question has been successfully added.</p>
                    <button className='button' onClick={newQuestion}>Add another question</button>
                    <Link to={`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`}><button className='button cancel-button'>Redirect to <span>{(questionTypeName === 'Past Papers') ? 'exam' : 'chapter'}</span> page</button></Link>
                </div>
            </div> : ''}
        </div>
    );
}

export default AddQuestion;
