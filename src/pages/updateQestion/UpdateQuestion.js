import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import getQuestionDetails from '../../api/getQuestionDetails.api'
import updateQuestion from '../../api/updateQuestion.api'
import addAnswerPic from '../../api/addAnswerPic.api'
import updateAutoCorrect from '../../api/updateAutoCorrect.api'
import correctIcon from '../../correct-icon.png'
import MathInput from "react-math-keyboard";
import '../../reusable.css'
import './UpdateQuestion.css'

const UpdateQuestion = () => {
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [autoCorrectLoading, setAutoCorrectLoading] = useState(false)
    const [questionDetails, setQuestionDetails] = useState({})
    const [loading, setLoading] = useState(true)
    const [serverLoadingPic, setServerLoadingPic] = useState(false)
    const [question, setQuestion] = useState('')
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

    // Keyboard Variable
    const [isArabic, setIsArabic] = useState(true);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const inputRef = useRef(null);
    const keyboardRef = useRef(null);
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    // Keyboard Variable

    const { questionID, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getQuestion()
    }, []);

    // Start Keyboard Func
    const handleButtonClick = (digit) => {
        setAnswer(prev => {
            const newVal = prev + digit;
            return newVal;
        });
    };

    const toggleLanguage = () => {
        setIsArabic(prev => !prev);
    };

    const handleInputFocus = () => {
        setShowKeyboard(true);
    };

    // Hide Keyboard when press
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                inputRef.current && !inputRef.current.contains(event.target) &&
                keyboardRef.current && !keyboardRef.current.contains(event.target)
            ) {
                setShowKeyboard(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderDigits = () => {
        const digits = isArabic ? arabicDigits : englishDigits;
        return digits.map((digit, index) => (
            <button
                key={index}
                onClick={() => handleButtonClick(digit)}
                className="digit-button"
            >
                {digit}
            </button>
        ));
    };

    const handleDelete = () => {
        setAnswer(prev => prev.slice(0, -1));
    };
    // End Keyboard Func

    // get all unit
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
        setAllAnswer(current => [...current, answer]);
        setAnswer('')
    }

    const removeAnswer = (item) => {
        setAllAnswer(current => current.filter(e => e !== item))
    }

    const handleUpadteQuestion = () => {
        if (question === '' || questionPoint === '' || allAnswer.length === 0 && questionType === 'Essay'
            || mcqAnswerFr === '' && questionType === 'MCQ' || mcqAnswerFs === '' && questionType === 'MCQ'
            || mcqAnswerSe === '' && questionType === 'MCQ' || mcqAnswerTh === '' && questionType === 'MCQ') {
            setserverOperationError('Enter the question data first!')
        } else {
            const data = new FormData()
            if (questionPic)
                data.append('image', questionPic)
            data.append('question', question)
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
                <textarea type="text" placeholder='Enter the question' value={question} onChange={e => setQuestion(e.target.value)} />
                {(questionType == 'Essay') ? <div className="keyboard essay-answer">
                    <div style={{ position: 'relative', maxWidth: '370px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={answer}
                            onFocus={handleInputFocus}
                            readOnly
                            placeholder={isArabic ? 'أدخل الإجابة' : 'Enter the answer'}
                            className="input-style"
                        />
                        {showKeyboard && (
                            <div ref={keyboardRef} className="keyboard-container">
                                {renderDigits()}
                                <button onClick={handleDelete} className="digit-button btn-red">
                                    x
                                </button>
                                <button onClick={toggleLanguage} className="toggle-btn">
                                    {isArabic ? '123' : '١٢٣'}
                                </button>
                            </div>
                        )}
                    </div>
                    <li onClick={addAnswer}>+</li>
                </div> : (questionType == 'MCQ') ? <div className="keyboard mcq-answer d-flex">
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" defaultChecked value={mcqAnswerFs} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 1 (Correct answer)</p>
                        </div>
                        <MathInput initialLatex={mcqAnswerFs} setValue={setMcqAnswerFs} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerSe} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 2 (Correct answer)</p>
                        </div>
                        <MathInput initialLatex={mcqAnswerSe} setValue={setMcqAnswerSe} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerTh} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 3 (Correct answer)</p>
                        </div>
                        <MathInput initialLatex={mcqAnswerTh} setValue={setMcqAnswerTh} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerFr} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 4 (Correct answer)</p>
                        </div>
                        <MathInput initialLatex={mcqAnswerFr} setValue={setMcqAnswerFr} />
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
