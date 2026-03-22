import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import addQuestion from '../../api/addQuestion.api'
import addAnswerPic from '../../api/addAnswerPic.api'
import addGraphQuestion from '../../api/addGraphQuestion.api';
import correctIcon from '../../correct-icon.png'
import MathInput from "react-math-keyboard";
import '../../reusable.css';
import './AddQuestion.css'

const AddQuestion = () => {
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
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
    const [quesionGraphAdded, setQuesionGraphAdded] = useState(false)
    const [quesionFullAdded, setQuesionFullAdded] = useState(false)
    const [quesionID, setQuesionID] = useState()
    const [mcqAnswerFs, setMcqAnswerFs] = useState('') //
    const [mcqAnswerSe, setMcqAnswerSe] = useState('') //
    const [mcqAnswerTh, setMcqAnswerTh] = useState('') //
    const [mcqAnswerFr, setMcqAnswerFr] = useState('') //
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

    // Keyboard Variable
    const [isArabic, setIsArabic] = useState(true);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const inputRef = useRef(null);
    const keyboardRef = useRef(null);
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    // Keyboard Variable

    const { chapterID, chapterName, questionTypeID, unitID, questionTypeName, subjectID, questionNum } = useParams()
    const navigate = useNavigate()
    const mf = useRef();
    const wafs = useRef();
    const wase = useRef();
    const wath = useRef();
    const questionRef = useRef();


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
        setAllAnswer(current => [...current, answer]);
        setAnswer('')
    }

    const removeAnswer = (item) => {
        setAllAnswer(current => current.filter(e => e != item))
    }

    const addNewQuestion = () => {
        if (question === '' || questionPoint === '' || allAnswer.length === 0 && questionType === 'Essay Question'
            || mcqAnswerFr === '' && questionType === 'MCQ Question' || mcqAnswerFs === '' && questionType === 'MCQ Question'
            || mcqAnswerSe === '' && questionType === 'MCQ Question' || mcqAnswerTh === '' && questionType === 'MCQ Question') {
            setserverOperationError('Enter the question data first!')
        } else {
            const data = new FormData()
            if (questionPic)
                data.append('image', questionPic)
            data.append('question', question)
            if (questionType == 'Essay Question') {
                allAnswer.map(item => {
                    data.append('answer', item)
                })
            }
            if (questionType == 'MCQ Question') {
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
            if (autoCorrect)
                data.append('autoCorrect', true)
            if (questionType == 'MCQ Question') {
                data.append('typeOfAnswer', 'MCQ')
            } else if (questionType == 'Graph Question') {
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
        if (questionRef.current) questionRef.current()
        if (questionType == "MCQ Question") {
            mf.current()
            wafs.current()
            wase.current()
            wath.current()
        }
        setQuesionFullAdded(false)
        setQuestion('')
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
        setPreviewCorrectAP('')
        setPreviewWrongAPFs('')
        setPreviewWrongAPSe('')
        setPreviewWrongAPTh('')
        setServerGraphError(null)
        setserverOperationError(null)
    }

    const handleChecked = (value) => {
        setQuestionType(value);
    }

    const checkedCorrecrAnswer = (value) => {
        setCorrectAnswer(value)
    }

    return (
        <div className="add-question">
            <div>
                <p className='text-color head-title'>Add new question in <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span> (<span style={{ color: "rgb(56, 56, 238)" }}>{chapterName}</span>)</p>
                {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                <fieldset>
                    <legend>Choose the type of question</legend>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="berries_1" defaultChecked value="Essay Question" name="berries" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="berries_1">Essay Question</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="berries_2" value="MCQ Question" name="berries" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="berries_2">MCQ Question</label>
                    </div>
                    <div className='d-flex align-items-center'>
                        <input type="radio" id="berries_3" value="Graph Question" name="berries" onChange={e => handleChecked(e.target.value)} />
                        <label htmlFor="berries_3">Graph Question</label>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>This question is auto correct?</legend>
                    <div className='d-flex align-items-center'>
                        <input type="checkbox" id="berries_1" name="berries" onChange={e => setAutoCorrect(e.target.checked)} />
                        <label htmlFor="berries_1">Auto Correct</label>
                    </div>
                </fieldset>
                {(previewQuestionPic) ? <img className='preview-img' src={previewQuestionPic} alt="" /> : <label>
                    <div>
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        <p>Choose the question picture</p>
                    </div>
                    <input className='select-input' type="file" name='images' onChange={selectQuestionPic} accept='.png, .jpg, .jpeg, .webp' />
                </label>}
                <div className='question-math-input'>
                    <MathInput setClearRef={f => questionRef.current = f} setValue={setQuestion} />
                </div>
                {(questionType == 'Essay Question') ? <>
                    <div className="keyboard essay-answer">
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
                    </div>
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
                </> : (questionType == "MCQ Question") ? <div className="keyboard mcq-answer d-flex">

                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" defaultChecked value={mcqAnswerFs} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 1 (Correct answer)</p>
                        </div>
                        <MathInput setClearRef={f => wafs.current = f} setValue={setMcqAnswerFs} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerSe} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 2 (Correct answer)</p>
                        </div>
                        <MathInput setClearRef={f => wase.current = f} setValue={setMcqAnswerSe} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerTh} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 3 (Correct answer)</p>
                        </div>
                        <MathInput setClearRef={f => wath.current = f} setValue={setMcqAnswerTh} />
                    </div>
                    <div className='mcq-input'>
                        <div className='d-flex align-items-center answer-toggel'>
                            <input type="radio" id="berries_3" value={mcqAnswerFr} name="coorect-answer" onChange={e => checkedCorrecrAnswer(e.target.value)} />
                            <p>Answer 4 (Correct answer)</p>
                        </div>
                        <MathInput setClearRef={f => mf.current = f} setValue={setMcqAnswerFr} />
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
                {(questionType == "Graph Question") ? <><div className="graph-container d-flex">
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
            {/* add question popup start */}
            {(quesionFullAdded) ? <div className="add-question-popup question-popup d-flex justify-content-center align-items-center">
                <div className='d-flex justify-content-center align-items-center flex-direction-column '>
                    <img src={correctIcon} alt="" />
                    <p className='text-color'>Success</p>
                    <p className='text-color'>Congratulations, the full question has been successfully added.</p>
                    <button className='button' onClick={newQuestion}>Add another question</button>
                    <Link to={`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`}><button className='button cancel-button'>Redirect to <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span> page</button></Link>
                </div>
            </div> : ''}
            {/* add question popup end */}
        </div>
    );
}

export default AddQuestion;
