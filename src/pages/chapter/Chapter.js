import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import getChapter from '../../api/getChapter.api'
import updateChapter from '../../api/updateChapter.api'
import deleteQuestion from '../../api/deleteQuestion.api'
import deleteChapter from '../../api/deleteChapter.api'
import getQuestionDetails from '../../api/getQuestionDetails.api'
import getSystem from '../../api/getSystem.api'
import getUnit from '../../api/getUnit.api'
import addQuestion from '../../api/addQuestion.api'
import updateQuestion from '../../api/updateQuestion.api'
import '../../reusable.css'
import './Chapter.css'

const TOPIC_QUESTION_TYPE_ID = '65a4963482dbaac16d820fc6'
const PAST_PAPERS_QUESTION_TYPE_ID = '65a4964b82dbaac16d820fc8'
const QUESTION_TYPE_OPTIONS = [
    { id: TOPIC_QUESTION_TYPE_ID, name: 'Topic Questions' },
    { id: PAST_PAPERS_QUESTION_TYPE_ID, name: 'Past Papers' }
]

const Chapter = () => {
    const [chapterDetails, setChapterDetails] = useState({})
    const [loading, setLoading] = useState(true)
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [chapterName, setChapterName] = useState('')
    const [questionID, setQuestionID] = useState('')
    const [questionToMove, setQuestionToMove] = useState(null)
    const [allSystems, setAllSystems] = useState([])
    const [destinationLoading, setDestinationLoading] = useState(false)
    const [destinationUnitsLoading, setDestinationUnitsLoading] = useState(false)
    const [destinationQuestionTypeID, setDestinationQuestionTypeID] = useState('')
    const [destinationSubjectID, setDestinationSubjectID] = useState('')
    const [destinationUnitID, setDestinationUnitID] = useState('')
    const [destinationChapterID, setDestinationChapterID] = useState('')
    const [availableUnits, setAvailableUnits] = useState([])
    const { chapterID, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getchapterDetails()
    }, [chapterID]);

    useEffect(() => {
        if (!destinationQuestionTypeID || !destinationSubjectID) {
            setAvailableUnits([])
            setDestinationUnitID('')
            setDestinationChapterID('')
            return
        }

        getUnit(destinationQuestionTypeID, destinationSubjectID, setAvailableUnits, setDestinationUnitsLoading)
    }, [destinationQuestionTypeID, destinationSubjectID])

    const getchapterDetails = async () => {
        await getChapter(chapterID, setChapterDetails, setLoading)
    }

    const openUpdatePopup = (chapterName) => {
        setChapterName(chapterName)
        setserverOperationError(null)
        document.querySelector('.update-chapter-popup').classList.replace('d-none', 'd-flex');
    }

    const closeUpdatePopup = () => {
        document.querySelector('.update-chapter-popup').classList.replace('d-flex', 'd-none');
    }

    const update = () => {
        if (chapterName === '') {
            setserverOperationError('Enter the chapter name first!')
        } else {
            const data = { chapterName }
            updateChapter(data, chapterID, setserverOperationError, setServerOperationLoading, setChapterDetails)
        }
    }

    const openDeleteQuestionPopup = (quesionID) => {
        setQuestionID(quesionID)
        document.querySelector('.delete-question-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeleteQuestionPopup = () => {
        document.querySelector('.delete-question-popup').classList.replace('d-flex', 'd-none');
    }

    const deleteTheQuestion = () => {
        deleteQuestion(questionID, chapterID, setserverOperationError, setServerOperationLoading, setChapterDetails)
    }

    const openDeleteChapterPopup = () => {
        document.querySelector('.delete-chapter-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeleteChapterPopup = () => {
        document.querySelector('.delete-chapter-popup').classList.replace('d-flex', 'd-none');
    }

    const deleteTheChapter = () => {
        deleteChapter(chapterID, setserverOperationError, setServerOperationLoading, navigate, questionTypeID, unitID, questionTypeName, subjectID)
    }

    const getSubjectOptions = () => {
        return allSystems.flatMap(system =>
            (system.subjects || []).map(subject => ({
                ...subject,
                systemName: system.systemName
            }))
        )
    }

    const getSelectedUnit = () => {
        return availableUnits.find(item => item._id === destinationUnitID)
    }

    const getSelectedChapter = () => {
        const selectedUnit = getSelectedUnit()
        return selectedUnit?.chapters?.find(item => item._id === destinationChapterID)
    }

    const openMoveCopyPopup = async (question) => {
        setQuestionToMove(question)
        setserverOperationError(null)
        setDestinationQuestionTypeID(questionTypeID)
        setDestinationSubjectID(subjectID)
        setDestinationUnitID(unitID)
        setDestinationChapterID(chapterID)
        setDestinationLoading(true)
        document.querySelector('.move-question-popup').classList.replace('d-none', 'd-flex');

        await new Promise(resolve => getSystem(setAllSystems, resolveLoading => {
            setDestinationLoading(resolveLoading)
            if (resolveLoading === false) resolve()
        }))

        setDestinationLoading(false)
    }

    const closeMoveCopyPopup = () => {
        document.querySelector('.move-question-popup').classList.replace('d-flex', 'd-none');
        setserverOperationError(null)
        setQuestionToMove(null)
        setDestinationLoading(false)
        setDestinationUnitsLoading(false)
    }

    const cloneQuestionData = (questionDetails) => {
        const data = new FormData()
        data.append('question', questionDetails.question)
        data.append('questionPoints', questionDetails.questionPoints)
        data.append('chapter', destinationChapterID)
        data.append('index', 'last')

        if (questionDetails.questionPic) {
            data.append('questionPicUrl', questionDetails.questionPic)
        }

        if (questionDetails.typeOfAnswer === 'Essay') {
            questionDetails.answer?.forEach(item => {
                data.append('answer', item)
            })
        }

        if (questionDetails.typeOfAnswer === 'MCQ') {
            data.append('typeOfAnswer', 'MCQ')
            data.append('correctAnswer', questionDetails.correctAnswer || questionDetails.wrongAnswer?.[0] || '')
            data.append('autoCorrect', questionDetails.autoCorrect ? 'true' : 'false')
            questionDetails.wrongAnswer?.forEach(item => {
                data.append('wrongAnswer', item)
            })
        }

        if (questionDetails.typeOfAnswer === 'Graph') {
            data.append('typeOfAnswer', 'Graph')
        }

        return data
    }

    const buildQuestionUpdateData = (questionDetails) => {
        const data = new FormData()
        data.append('question', questionDetails.question)
        data.append('questionPoints', questionDetails.questionPoints)
        data.append('chapter', destinationChapterID)

        if (questionDetails.typeOfAnswer === 'Essay') {
            questionDetails.answer?.forEach(item => {
                data.append('answer', item)
            })
        }

        if (questionDetails.typeOfAnswer === 'MCQ') {
            data.append('correctAnswer', questionDetails.correctAnswer || questionDetails.wrongAnswer?.[0] || '')
            questionDetails.wrongAnswer?.forEach(item => {
                data.append('wrongAnswer', item)
            })
        }

        return data
    }

    const getFullQuestionDetails = (selectedQuestionID) => {
        return new Promise((resolve, reject) => {
            getQuestionDetails(
                selectedQuestionID,
                questionData => resolve(questionData),
                () => { },
                () => { },
                () => { },
                () => { },
                () => { },
                () => { },
                () => { },
                () => { },
                () => { }
            )
            setTimeout(() => reject(new Error('Failed to load the question details.')), 12000)
        })
    }

    const validateDestination = () => {
        if (!questionToMove?._id) {
            setserverOperationError('Choose a question first.')
            return false
        }
        if (!destinationQuestionTypeID || !destinationSubjectID || !destinationUnitID || !destinationChapterID) {
            setserverOperationError('Choose the target section, subject, unit/year, and chapter/exam first.')
            return false
        }
        return true
    }

    const handleCopyQuestion = async () => {
        if (!validateDestination()) return

        try {
            setServerOperationLoading(true)
            setserverOperationError(null)

            const selectedQuestion = await getFullQuestionDetails(questionToMove._id)
            const data = cloneQuestionData(selectedQuestion)

            await new Promise((resolve, reject) => {
                addQuestion(
                    data,
                    error => {
                        if (error) reject(new Error(error))
                    },
                    setServerOperationLoading,
                    () => resolve(),
                    () => { },
                    selectedQuestion.typeOfAnswer,
                    () => resolve()
                )
            })

            closeMoveCopyPopup()
        } catch (error) {
            setserverOperationError(error.message || 'Failed to copy the question.')
            setServerOperationLoading(false)
        }
    }

    const handleMoveQuestion = async () => {
        if (!validateDestination()) return

        try {
            setServerOperationLoading(true)
            setserverOperationError(null)

            const selectedQuestion = await getFullQuestionDetails(questionToMove._id)
            const data = buildQuestionUpdateData(selectedQuestion)

            await new Promise((resolve, reject) => {
                updateQuestion(
                    data,
                    questionToMove._id,
                    error => {
                        if (error) reject(new Error(error))
                    },
                    setServerOperationLoading,
                    () => resolve()
                )
            })

            closeMoveCopyPopup()
            getchapterDetails()
        } catch (error) {
            setserverOperationError(error.message || 'Failed to move the question.')
            setServerOperationLoading(false)
        }
    }

    const selectedUnit = getSelectedUnit()
    const selectedChapter = getSelectedChapter()
    const subjectOptions = getSubjectOptions()

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className='chpater-container'>
            <div className='d-flex justify-content-space-between align-items-center'>
                <p className='chapter-head-name'>{chapterDetails.chapterName}</p>
                <div className='chapter-icon'>
                    <Link to={`/addQuestion/${questionTypeName}/${chapterDetails.chapterName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}/last`}><i className="fa fa-plus icon" aria-hidden="true"></i></Link>
                    <Link to={`/aiGenerate/${questionTypeName}/${encodeURIComponent(chapterDetails.chapterName)}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`} title="Generate questions with AI"><i className="fa fa-magic icon ai-icon" aria-hidden="true"></i></Link>
                    <i onClick={() => openUpdatePopup(chapterDetails.chapterName)} className="fa fa-pencil" aria-hidden="true"></i>
                    <i onClick={openDeleteChapterPopup} className="fa fa-trash-o" aria-hidden="true"></i>
                </div>
            </div>
            {chapterDetails.questions?.map((item, index) => {
                return (
                    <div key={item._id} className='question d-flex justify-content-space-between'>
                        <div className='question-text' dangerouslySetInnerHTML={{ __html: item.question }} />
                        <div className='question-actions'>
                            <Link to={`/updateQuestion/${questionTypeName}/${item._id}/${questionTypeID}/${unitID}/${subjectID}`}><i className="fa fa-pencil icon" aria-hidden="true"></i></Link>
                            <i onClick={() => openDeleteQuestionPopup(item._id)} className="fa fa-trash-o" aria-hidden="true"></i>
                            <Link to={`/addQuestion/${questionTypeName}/${chapterDetails.chapterName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}/${index}`}><i className="fa fa-plus icon" aria-hidden="true"></i></Link>
                            <i onClick={() => openMoveCopyPopup(item)} className="fa fa-exchange icon move-icon" aria-hidden="true" title="Copy or move question"></i>
                        </div>
                    </div>
                )
            })}
            <div className="update-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span> name</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the name' value={chapterName} onChange={e => setChapterName(e.target.value)} />
                    <button className='button' onClick={update}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                </div>
            </div>

            <div className="delete-question-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this question?</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteQuestionPopup}>Cancel</button>
                </div>
            </div>

            <div className="delete-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>?</p>
                    <p>You should know that if you delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>, all its questions will be deleted as well.</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheChapter}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteChapterPopup}>Cancel</button>
                </div>
            </div>

            <div className="move-question-popup chapter-popup d-none justify-content-center align-items-center">
                <div className='move-question-card'>
                    <p className='text-color'>Copy or move question</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    {destinationLoading ? (
                        <p>Loading destinations...</p>
                    ) : (
                        <>
                            <select value={destinationQuestionTypeID} onChange={e => setDestinationQuestionTypeID(e.target.value)}>
                                <option value=''>Choose section</option>
                                {QUESTION_TYPE_OPTIONS.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>

                            <select value={destinationSubjectID} onChange={e => setDestinationSubjectID(e.target.value)}>
                                <option value=''>Choose subject</option>
                                {subjectOptions.map(item => (
                                    <option key={item._id} value={item._id}>{item.systemName} - {item.subjectName}</option>
                                ))}
                            </select>

                            <select value={destinationUnitID} onChange={e => setDestinationUnitID(e.target.value)}>
                                <option value=''>Choose {(destinationQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'year' : 'unit'}</option>
                                {availableUnits.map(item => (
                                    <option key={item._id} value={item._id}>{item.unitName}</option>
                                ))}
                            </select>

                            <select value={destinationChapterID} onChange={e => setDestinationChapterID(e.target.value)} disabled={!selectedUnit || destinationUnitsLoading}>
                                <option value=''>Choose {(destinationQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'exam' : 'chapter'}</option>
                                {selectedUnit?.chapters?.map(item => (
                                    <option key={item._id} value={item._id}>{item.chapterName}</option>
                                ))}
                            </select>

                            {(selectedUnit || selectedChapter) ? <div className='move-target-preview'>
                                {selectedUnit ? <p><strong>{(destinationQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'Year' : 'Unit'}:</strong> {selectedUnit.unitName}</p> : ''}
                                {selectedChapter ? <p><strong>{(destinationQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'Exam' : 'Chapter'}:</strong> {selectedChapter.chapterName}</p> : ''}
                            </div> : ''}
                        </>
                    )}
                    <div className='move-question-actions'>
                        <button className='button' onClick={handleCopyQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Copy'}</button>
                        <button className='button move-question-btn' onClick={handleMoveQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Move'}</button>
                        <button className='button cancel-button' onClick={closeMoveCopyPopup}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chapter;
