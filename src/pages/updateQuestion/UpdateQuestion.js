import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NumeralKeyboard from '../../components/NumeralKeyboard/NumeralKeyboard';
import AbacusGrid from '../../components/AbacusGrid/AbacusGrid';
import getQuestionDetails from '../../api/getQuestionDetails.api'
import updateQuestion from '../../api/updateQuestion.api'
import addAnswerPic from '../../api/addAnswerPic.api'
import updateAutoCorrect from '../../api/updateAutoCorrect.api'
import correctIcon from '../../correct-icon.png'
import '../../reusable.css'
import './UpdateQuestion.css'

const stripHtml = (html) => {
    if (!html) return ''
    if (html.startsWith('[') && html.endsWith(']')) return html // Don't strip if it looks like JSON grid
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
}

const UpdateQuestion = () => {
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [autoCorrectLoading, setAutoCorrectLoading] = useState(false)
    const [questionDetails, setQuestionDetails] = useState({})
    const [loading, setLoading] = useState(true)
    const [serverLoadingPic, setServerLoadingPic] = useState(false)
    const [question, setQuestion] = useState('')
    const [useGrid, setUseGrid] = useState(false)
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
    const [quesionFullAdded, setQuesionFullAdded] = useState(false)
    const [questionType, setQuestionType] = useState('')
    const [mcqAnswerFs, setMcqAnswerFs] = useState('')
    const [mcqAnswerSe, setMcqAnswerSe] = useState('')
    const [mcqAnswerTh, setMcqAnswerTh] = useState('')
    const [mcqAnswerFr, setMcqAnswerFr] = useState('')
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [activeAnswerField, setActiveAnswerField] = useState(null)

    const questionStripped = useRef(false)

    const { questionID, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getQuestion()
    }, []);

    // Strip HTML tags from question loaded from backend once on load
    useEffect(() => {
        if (!loading && question && !questionStripped.current) {
            const stripped = stripHtml(question);
            try {
                // Try to parse as grid JSON
                if (stripped.startsWith('[') && stripped.endsWith(']')) {
                    const parsed = JSON.parse(stripped);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].op) {
                        setGridRows(parsed);
                        setUseGrid(true);
                        setQuestion('');
                    } else {
                        setQuestion(stripped);
                    }
                } else {
                    setQuestion(stripped);
                }
            } catch (e) {
                setQuestion(stripped);
            }
            questionStripped.current = true
        }
    }, [loading, question])

    const getQuestion = async () => {
        await getQuestionDetails(questionID, setQuestionDetails, setLoading, setQuestion, setAllAnswer, setQuestionPoint, setQuestionType, setMcqAnswerFs, setMcqAnswerSe, setMcqAnswerTh, setMcqAnswerFr)
    }

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

    const addAnswer = () => {
        if (answer === '') return;
        setAllAnswer(current => [...current, answer]);
        setAnswer('');
    }

    const removeAnswer = (item) => {
        setAllAnswer(current => current.filter(e => e !== item))
    }

    const handleUpadteQuestion = () => {
        const finalQuestion = useGrid ? JSON.stringify(gridRows) : question;
        
        if (!finalQuestion || questionPoint === '' || allAnswer.length === 0 && questionType === 'Essay'
            || mcqAnswerFr === '' && questionType === 'MCQ' || mcqAnswerFs === '' && questionType === 'MCQ'
            || mcqAnswerSe === '' && questionType === 'MCQ' || mcqAnswerTh === '' && questionType === 'MCQ') {
            setserverOperationError('Enter the question data first!')
        } else {
            const data = new FormData()
            if (questionPic)
                data.append('image', questionPic)
            data.append('question', finalQuestion)
            if (questionType == 'Essay') {
                allAnswer.map(item => {
                    data.append('answer', item)
                })
            }
            if (questionType == 'MCQ') {
                if (correctAnswer == '') {
                    data.append('correctAnswer', mcqAnswerFs)
                } else {
                    data.append('correctAnswer', correctAnswer)
                }
                data.append('wrongAnswer', mcqAnswerFs)
                data.append('wrongAnswer', mcqAnswerSe)
                data.append('wrongAnswer', mcqAnswerTh)
                data.append('wrongAnswer', mcqAnswerFr)
            }
            data.append('questionPoints', questionPoint)
            updateQuestion(data, questionID, setserverOperationError, setServerOperationLoading, setQuesionAdded)
        }
    }

    const uploadAnswerPic = () => {
        if (answerPic) {
            const data = new FormData()
            data.append('image', answerPic)
            addAnswerPic(data, questionDetails._id, setserverOperationError, setServerLoadingPic, setQuesionFullAdded, 'update', navigate, questionDetails.chapter, questionTypeID, unitID, questionTypeName, subjectID)
        } else {
            setserverOperationError('Upload the answer picture first!')
        }
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

    const handleUpadteAutoCorrect = () => {
        updateAutoCorrect(questionID, setserverOperationError, setAutoCorrectLoading, setQuestionDetails)
    }

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className="update-question">
            <div>
                <p className='text-color head-title'>Update the question</p>
                {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                {(previewQuestionPic) ? <img className='preview-img' src={previewQuestionPic} alt="" /> : (questionDetails.questionPic) ? <div className='question-pic'>
                    <img src={questionDetails.questionPic} alt="" />
                    <label>
                        <i className="fa fa-pencil" aria-hidden="true"></i>
                        <input className='select-input' type="file" name='images' onChange={selectQuestionPic} accept='.png, .jpg, .jpeg, .webp' />
                    </label>
                </div> : <label>
                    <div>
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <p>Choose the question picture</p>
                    </div>
                    <input className='select-input' type="file" name='images' onChange={selectQuestionPic} accept='.png, .jpg, .jpeg, .webp' />
                </label>}
                <div className="auto-correct-update d-flex align-items-center">
                    <p>This question is {questionDetails.autoCorrect ? 'Auto Correct' : 'Not Auto Correct'}</p>
                    {autoCorrectLoading ? <p>Waiting...</p> : <p onClick={handleUpadteAutoCorrect}>(Chanage it to {questionDetails.autoCorrect ? 'Not Auto Correct' : 'Auto Correct'})</p>}
                </div>

                <fieldset>
                    <legend>Question Format</legend>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="format_grid" checked={useGrid} onChange={() => setUseGrid(true)} />
                        <label htmlFor="format_grid">Abacus Grid</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="format_text" checked={!useGrid} onChange={() => setUseGrid(false)} />
                        <label htmlFor="format_text">Plain Text</label>
                    </div>
                </fieldset>

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
                {(questionType == 'Essay') ? <div className="keyboard essay-answer">
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
                </div> : (questionType == 'MCQ') ? <div className="keyboard mcq-answer d-flex"> 
                        <div className='mcq-input'>
                            <div className='d-flex align-items-center answer-toggel'>
                                <input type="radio" id="berries_3" defaultChecked value={mcqAnswerFs} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                                <p>Answer 1 (Correct answer)</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type answer 1"
                                value={mcqAnswerFs}
                                onFocus={() => setActiveAnswerField('mcq-1')}
                                onChange={e => setMcqAnswerFs(e.target.value)}
                            />
                        </div>
                        <div className='mcq-input'>
                            <div className='d-flex align-items-center answer-toggel'>
                                <input type="radio" id="berries_3" value={mcqAnswerSe} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                                <p>Answer 2 (Correct answer)</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type answer 2"
                                value={mcqAnswerSe}
                                onFocus={() => setActiveAnswerField('mcq-2')}
                                onChange={e => setMcqAnswerSe(e.target.value)}
                            />
                        </div>
                        <div className='mcq-input'>
                            <div className='d-flex align-items-center answer-toggel'>
                                <input type="radio" id="berries_3" value={mcqAnswerTh} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                                <p>Answer 3 (Correct answer)</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type answer 3"
                                value={mcqAnswerTh}
                                onFocus={() => setActiveAnswerField('mcq-3')}
                                onChange={e => setMcqAnswerTh(e.target.value)}
                            />
                        </div>
                        <div className='mcq-input'>
                            <div className='d-flex align-items-center answer-toggel'>
                                <input type="radio" id="berries_3" value={mcqAnswerFr} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                                <p>Answer 4 (Correct answer)</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type answer 4"
                                value={mcqAnswerFr}
                                onFocus={() => setActiveAnswerField('mcq-4')}
                                onChange={e => setMcqAnswerFr(e.target.value)}
                            />
                            {['mcq-1', 'mcq-2', 'mcq-3', 'mcq-4'].includes(activeAnswerField) ? (
                                <NumeralKeyboard
                                    onInsert={insertNumeral}
                                    onBackspace={backspaceNumeral}
                                    onSpace={insertSpace}
                                    onClose={() => setActiveAnswerField(null)}
                                />
                            ) : ''}
                        </div>
                    </div> : ''}
                <div className='d-flex flex-wrap'>
                    {(allAnswer.length != 0) ? allAnswer.map(item => {
                        return (
                            <div className='answer-item' key={item}>
                                <p>{item}</p>
                                <span onClick={() => removeAnswer(item)}>x</span>
                            </div>
                        )
                    }) : ''}
                </div>
                <input type="text" placeholder='Enter the question points' value={questionPoint} onChange={e => setQuestionPoint(e.target.value)} />
                {(questionType == 'Graph') ? <div className="d-flex">
                    <img className='graph-preview graph-preview-fs' src={questionDetails.correctPicAnswer} alt="" />
                    <img className='graph-preview' src={questionDetails.wrongPicAnswer[0]} alt="" />
                    <img className='graph-preview' src={questionDetails.wrongPicAnswer[1]} alt="" />
                    <img className='graph-preview' src={questionDetails.wrongPicAnswer[2]} alt="" />
                </div> : ""}
                <div className="d-flex">
                    <button className='button' onClick={handleUpadteQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <Link to={`/chapter/${questionTypeName}/${questionDetails.chapter}/${questionTypeID}/${unitID}/${subjectID}`}><button className='button cancel-button'>Cancel</button></Link>
                </div>
                {(quesionAdded) ? <div className='correct d-flex align-items-center'>
                    <img src={correctIcon} alt="" />
                    <p>Question updated success.</p>
                </div> : ''}
                {(previewAnswerPic) ? <img className='preview-img' src={previewAnswerPic} alt="" /> : (questionDetails.answerPic) ? <div className='question-pic'>
                    <img src={questionDetails.answerPic} alt="" />
                    <label>
                        <i className="fa fa-pencil" aria-hidden="true"></i>
                        <input className='select-input' type="file" name='images' onChange={selectAnswerPic} accept='.png, .jpg, .jpeg, .webp' />
                    </label>
                </div> : <label>
                    <div>
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <p>Choose the answer picture</p>
                    </div>
                    <input className='select-input' type="file" name='images' onChange={selectAnswerPic} accept='.png, .jpg, .jpeg, .webp' />
                </label>}
                <div className="d-flex">
                    <button className='button answer-button' onClick={uploadAnswerPic}>{(serverLoadingPic) ? <span className="button-loader"></span> : 'Update'}</button>
                </div>
            </div>
        </div>
    );
}

export default UpdateQuestion;
