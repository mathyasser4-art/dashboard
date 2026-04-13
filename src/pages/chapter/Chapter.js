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
import reorderChapter from '../../api/reorderChapter.api'
import '../../reusable.css'
import './Chapter.css'

const TOPIC_QUESTION_TYPE_ID = '65a4963482dbaac16d820fc6'
const PAST_PAPERS_QUESTION_TYPE_ID = '65a4964b82dbaac16d820fc8'
const QUESTION_TYPE_OPTIONS = [
    { id: TOPIC_QUESTION_TYPE_ID, name: 'Topic Questions' },
    { id: PAST_PAPERS_QUESTION_TYPE_ID, name: 'Past Papers' }
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const parseGridRows = (questionText) => {
    if (!questionText || !questionText.startsWith('[')) return null
    try {
        const rows = JSON.parse(questionText)
        if (Array.isArray(rows) && rows.length > 0 && rows[0].op !== undefined) return rows
    } catch (e) { }
    return null
}

const QuestionPreview = ({ item }) => {
    const gridRows = parseGridRows(item.question)

    return (
        <div className="question-preview-body">
            {/* Question text / grid */}
            {gridRows ? (
                <div className="grid-inline-preview">
                    {gridRows.map((row, i) => (
                        <span key={i} className="grid-inline-row">
                            <span className="grid-inline-op">{row.op}</span>
                            <span className="grid-inline-val">{row.val}</span>
                        </span>
                    ))}
                </div>
            ) : (
                <div className="question-text" dangerouslySetInnerHTML={{ __html: item.question }} />
            )}

            {/* Answers */}
            <div className="question-answers-row">
                {item.typeOfAnswer === 'MCQ' ? (
                    <>
                        <span className="answer-badge answer-correct" title="Correct answer">✓ {item.correctAnswer}</span>
                        {item.wrongAnswer?.map((wa, i) => (
                            <span key={i} className="answer-badge answer-wrong" title="Wrong answer">✗ {wa}</span>
                        ))}
                    </>
                ) : item.typeOfAnswer === 'Graph' ? (
                    <span className="answer-badge answer-graph">📊 Graph question</span>
                ) : item.answer?.length > 0 ? (
                    <>
                        <span className="answers-label">Ans:</span>
                        {item.answer.map((a, i) => (
                            <span key={i} className="answer-badge answer-essay">{a}</span>
                        ))}
                    </>
                ) : null}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────

const Chapter = () => {
    const [chapterDetails, setChapterDetails] = useState({})
    const [orderedQuestions, setOrderedQuestions] = useState([])
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

    // Drag-to-reorder state
    const [dragIndex, setDragIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)

    // Worksheet-level send state
    const [worksheetDestinationLoading, setWorksheetDestinationLoading] = useState(false)
    const [worksheetDestinationUnitsLoading, setWorksheetDestinationUnitsLoading] = useState(false)
    const [worksheetDestQuestionTypeID, setWorksheetDestQuestionTypeID] = useState('')
    const [worksheetDestSubjectID, setWorksheetDestSubjectID] = useState('')
    const [worksheetDestUnitID, setWorksheetDestUnitID] = useState('')
    const [worksheetDestChapterID, setWorksheetDestChapterID] = useState('')
    const [worksheetAvailableUnits, setWorksheetAvailableUnits] = useState([])
    const [worksheetSending, setWorksheetSending] = useState(false)
    const [worksheetProgress, setWorksheetProgress] = useState({ current: 0, total: 0 })
    const [worksheetError, setWorksheetError] = useState(null)
    const [worksheetDone, setWorksheetDone] = useState(false)
    const [worksheetSavedCount, setWorksheetSavedCount] = useState(0)

    const { chapterID, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getchapterDetails()
    }, [chapterID]);

    // Sync orderedQuestions whenever chapter data refreshes
    useEffect(() => {
        setOrderedQuestions(chapterDetails.questions || [])
    }, [chapterDetails])

    useEffect(() => {
        if (!destinationQuestionTypeID || !destinationSubjectID) {
            setAvailableUnits([])
            setDestinationUnitID('')
            setDestinationChapterID('')
            return
        }
        getUnit(destinationQuestionTypeID, destinationSubjectID, setAvailableUnits, setDestinationUnitsLoading)
    }, [destinationQuestionTypeID, destinationSubjectID])

    useEffect(() => {
        if (!worksheetDestQuestionTypeID || !worksheetDestSubjectID) {
            setWorksheetAvailableUnits([])
            setWorksheetDestUnitID('')
            setWorksheetDestChapterID('')
            return
        }
        getUnit(worksheetDestQuestionTypeID, worksheetDestSubjectID, setWorksheetAvailableUnits, setWorksheetDestinationUnitsLoading)
    }, [worksheetDestQuestionTypeID, worksheetDestSubjectID])

    const getchapterDetails = async () => {
        await getChapter(chapterID, setChapterDetails, setLoading)
    }

    // ── Drag-to-reorder ───────────────────────────────────────────────────────

    const handleDragStart = (e, index) => {
        setDragIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        // Minimal ghost image
        e.dataTransfer.setData('text/plain', index)
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverIndex !== index) setDragOverIndex(index)
    }

    const saveOrder = (questions) => {
        reorderChapter(chapterID, questions.map(q => q._id))
    }

    const handleDrop = (e, index) => {
        e.preventDefault()
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null)
            setDragOverIndex(null)
            return
        }
        const reordered = [...orderedQuestions]
        const [moved] = reordered.splice(dragIndex, 1)
        reordered.splice(index, 0, moved)
        setOrderedQuestions(reordered)
        setDragIndex(null)
        setDragOverIndex(null)
        saveOrder(reordered)
    }

    const handleDragEnd = () => {
        setDragIndex(null)
        setDragOverIndex(null)
    }

    const handleShuffle = () => {
        const shuffled = [...orderedQuestions]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setOrderedQuestions(shuffled)
        saveOrder(shuffled)
    }

    // ── Chapter operations ────────────────────────────────────────────────────

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

    const getWorksheetSubjectOptions = () => {
        return allSystems.flatMap(system =>
            (system.subjects || []).map(subject => ({
                ...subject,
                systemName: system.systemName
            }))
        )
    }

    const getSelectedUnit = () => availableUnits.find(item => item._id === destinationUnitID)
    const getSelectedChapter = () => getSelectedUnit()?.chapters?.find(item => item._id === destinationChapterID)
    const getWorksheetSelectedUnit = () => worksheetAvailableUnits.find(item => item._id === worksheetDestUnitID)
    const getWorksheetSelectedChapter = () => getWorksheetSelectedUnit()?.chapters?.find(item => item._id === worksheetDestChapterID)

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

    // ── Worksheet send popup ──────────────────────────────────────────────────

    const openSendWorksheetPopup = async () => {
        setWorksheetError(null)
        setWorksheetDone(false)
        setWorksheetSavedCount(0)
        setWorksheetSending(false)
        setWorksheetProgress({ current: 0, total: 0 })
        setWorksheetDestQuestionTypeID(questionTypeID)
        setWorksheetDestSubjectID(subjectID)
        setWorksheetDestUnitID(unitID)
        setWorksheetDestChapterID(chapterID)
        setWorksheetDestinationLoading(true)
        document.querySelector('.send-worksheet-popup').classList.replace('d-none', 'd-flex')

        await new Promise(resolve => getSystem(setAllSystems, resolveLoading => {
            setWorksheetDestinationLoading(resolveLoading)
            if (resolveLoading === false) resolve()
        }))

        setWorksheetDestinationLoading(false)
    }

    const closeSendWorksheetPopup = () => {
        if (worksheetSending) return
        document.querySelector('.send-worksheet-popup').classList.replace('d-flex', 'd-none')
        setWorksheetError(null)
        setWorksheetDone(false)
        setWorksheetSavedCount(0)
        setWorksheetSending(false)
        setWorksheetProgress({ current: 0, total: 0 })
    }

    const cloneQuestionData = (questionDetails, targetChapterID) => {
        const data = new FormData()
        data.append('question', questionDetails.question)
        data.append('questionPoints', questionDetails.questionPoints)
        data.append('chapter', targetChapterID)
        data.append('index', 'last')

        if (questionDetails.questionPic) {
            data.append('questionPicUrl', questionDetails.questionPic)
        }

        if (questionDetails.typeOfAnswer === 'Essay') {
            questionDetails.answer?.forEach(item => data.append('answer', item))
        }

        if (questionDetails.typeOfAnswer === 'MCQ') {
            data.append('typeOfAnswer', 'MCQ')
            data.append('correctAnswer', questionDetails.correctAnswer || questionDetails.wrongAnswer?.[0] || '')
            data.append('autoCorrect', questionDetails.autoCorrect ? 'true' : 'false')
            questionDetails.wrongAnswer?.forEach(item => data.append('wrongAnswer', item))
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
            questionDetails.answer?.forEach(item => data.append('answer', item))
        }

        if (questionDetails.typeOfAnswer === 'MCQ') {
            data.append('correctAnswer', questionDetails.correctAnswer || questionDetails.wrongAnswer?.[0] || '')
            questionDetails.wrongAnswer?.forEach(item => data.append('wrongAnswer', item))
        }

        return data
    }

    const getFullQuestionDetails = (selectedQuestionID) => {
        return new Promise((resolve, reject) => {
            getQuestionDetails(
                selectedQuestionID,
                questionData => resolve(questionData),
                () => { }, () => { }, () => { }, () => { },
                () => { }, () => { }, () => { }, () => { }, () => { }
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

    const validateWorksheetDestination = () => {
        if (!worksheetDestQuestionTypeID || !worksheetDestSubjectID || !worksheetDestUnitID || !worksheetDestChapterID) {
            setWorksheetError('Choose the target section, subject, unit/year, and chapter/exam first.')
            return false
        }
        if (orderedQuestions.length === 0) {
            setWorksheetError('This chapter has no questions to send.')
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
            const data = cloneQuestionData(selectedQuestion, destinationChapterID)
            await new Promise((resolve, reject) => {
                addQuestion(data, error => { if (error) reject(new Error(error)) }, setServerOperationLoading, () => resolve(), () => { }, selectedQuestion.typeOfAnswer, () => resolve())
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
                updateQuestion(data, questionToMove._id, error => { if (error) reject(new Error(error)) }, setServerOperationLoading, () => resolve())
            })
            closeMoveCopyPopup()
            getchapterDetails()
        } catch (error) {
            setserverOperationError(error.message || 'Failed to move the question.')
            setServerOperationLoading(false)
        }
    }

    const handleCopyWorksheet = async () => {
        if (!validateWorksheetDestination()) return
        setWorksheetSending(true)
        setWorksheetError(null)
        setWorksheetDone(false)
        setWorksheetProgress({ current: 0, total: orderedQuestions.length })

        let saved = 0
        for (let i = 0; i < orderedQuestions.length; i++) {
            setWorksheetProgress({ current: i + 1, total: orderedQuestions.length })
            try {
                const fullDetails = await getFullQuestionDetails(orderedQuestions[i]._id)
                const data = cloneQuestionData(fullDetails, worksheetDestChapterID)
                await new Promise((resolve, reject) => {
                    addQuestion(data, error => { if (error) reject(new Error(error)) }, () => { }, () => resolve(), () => { }, fullDetails.typeOfAnswer, () => resolve())
                })
                saved++
            } catch (e) { console.error(`Failed to copy question ${i + 1}:`, e) }
            await new Promise(r => setTimeout(r, 250))
        }

        setWorksheetSavedCount(saved)
        setWorksheetSending(false)
        setWorksheetDone(true)
    }

    const handleMoveWorksheet = async () => {
        if (!validateWorksheetDestination()) return
        setWorksheetSending(true)
        setWorksheetError(null)
        setWorksheetDone(false)
        setWorksheetProgress({ current: 0, total: orderedQuestions.length })

        let saved = 0
        for (let i = 0; i < orderedQuestions.length; i++) {
            setWorksheetProgress({ current: i + 1, total: orderedQuestions.length })
            try {
                const fullDetails = await getFullQuestionDetails(orderedQuestions[i]._id)
                const data = new FormData()
                data.append('question', fullDetails.question)
                data.append('questionPoints', fullDetails.questionPoints)
                data.append('chapter', worksheetDestChapterID)
                if (fullDetails.typeOfAnswer === 'Essay') {
                    fullDetails.answer?.forEach(item => data.append('answer', item))
                }
                if (fullDetails.typeOfAnswer === 'MCQ') {
                    data.append('correctAnswer', fullDetails.correctAnswer || fullDetails.wrongAnswer?.[0] || '')
                    fullDetails.wrongAnswer?.forEach(item => data.append('wrongAnswer', item))
                }
                await new Promise((resolve, reject) => {
                    updateQuestion(data, orderedQuestions[i]._id, error => { if (error) reject(new Error(error)) }, () => { }, () => resolve())
                })
                saved++
            } catch (e) { console.error(`Failed to move question ${i + 1}:`, e) }
            await new Promise(r => setTimeout(r, 250))
        }

        setWorksheetSavedCount(saved)
        setWorksheetSending(false)
        setWorksheetDone(true)
        getchapterDetails()
    }

    // ── Derived values ────────────────────────────────────────────────────────

    const selectedUnit = getSelectedUnit()
    const selectedChapter = getSelectedChapter()
    const subjectOptions = getSubjectOptions()
    const worksheetSelectedUnit = getWorksheetSelectedUnit()
    const worksheetSelectedChapter = getWorksheetSelectedChapter()
    const worksheetSubjectOptions = getWorksheetSubjectOptions()
    const worksheetProgressPercent = worksheetProgress.total > 0
        ? Math.round((worksheetProgress.current / worksheetProgress.total) * 100)
        : 0

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className='chpater-container'>
            {/* ── Chapter header ──────────────────────────────────────────────── */}
            <div className='d-flex justify-content-space-between align-items-center'>
                <p className='chapter-head-name'>
                    {chapterDetails.chapterName}
                    <span className='chapter-q-count'>{orderedQuestions.length} questions</span>
                </p>
                <div className='chapter-icon'>
                    <Link to={`/addQuestion/${questionTypeName}/${chapterDetails.chapterName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}/last`}>
                        <i className="fa fa-plus icon" aria-hidden="true" title="Add question"></i>
                    </Link>
                    <i
                        onClick={handleShuffle}
                        className="fa fa-random shuffle-icon"
                        aria-hidden="true"
                        title="Shuffle all questions"
                    ></i>
                    <Link to={`/aiGenerate/${questionTypeName}/${encodeURIComponent(chapterDetails.chapterName)}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`} title="Generate questions with AI">
                        <i className="fa fa-magic icon ai-icon" aria-hidden="true"></i>
                    </Link>
                    <i
                        onClick={openSendWorksheetPopup}
                        className="fa fa-paper-plane send-worksheet-icon"
                        aria-hidden="true"
                        title="Copy or move entire worksheet"
                    ></i>
                    <i onClick={() => openUpdatePopup(chapterDetails.chapterName)} className="fa fa-pencil" aria-hidden="true" title="Rename chapter"></i>
                    <i onClick={openDeleteChapterPopup} className="fa fa-trash-o" aria-hidden="true" title="Delete chapter"></i>
                </div>
            </div>

            {/* ── Question list ────────────────────────────────────────────────── */}
            {orderedQuestions.map((item, index) => (
                <div
                    key={item._id}
                    className={`question question-draggable d-flex justify-content-space-between${dragOverIndex === index && dragIndex !== index ? ' question-drag-over' : ''}${dragIndex === index ? ' question-dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    {/* Drag handle + number */}
                    <div className="question-left">
                        <div className="drag-handle" title="Drag to reorder">
                            <i className="fa fa-bars" aria-hidden="true"></i>
                        </div>
                        <span className="question-number">{index + 1}</span>
                    </div>

                    {/* Question body: text + answers */}
                    <div className="question-body">
                        <QuestionPreview item={item} />
                    </div>

                    {/* Actions */}
                    <div className='question-actions'>
                        <Link to={`/updateQuestion/${questionTypeName}/${item._id}/${questionTypeID}/${unitID}/${subjectID}`}>
                            <i className="fa fa-pencil icon" aria-hidden="true" title="Edit question"></i>
                        </Link>
                        <i onClick={() => openDeleteQuestionPopup(item._id)} className="fa fa-trash-o" aria-hidden="true" title="Delete question"></i>
                        <Link to={`/addQuestion/${questionTypeName}/${chapterDetails.chapterName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}/${index}`}>
                            <i className="fa fa-plus icon" aria-hidden="true" title="Insert question after this"></i>
                        </Link>
                        <i onClick={() => openMoveCopyPopup(item)} className="fa fa-exchange icon move-icon" aria-hidden="true" title="Copy or move question"></i>
                    </div>
                </div>
            ))}

            {/* ── Update chapter popup ─────────────────────────────────────────── */}
            <div className="update-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span> name</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the name' value={chapterName} onChange={e => setChapterName(e.target.value)} />
                    <button className='button' onClick={update}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                </div>
            </div>

            {/* ── Delete question popup ────────────────────────────────────────── */}
            <div className="delete-question-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this question?</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteQuestionPopup}>Cancel</button>
                </div>
            </div>

            {/* ── Delete chapter popup ─────────────────────────────────────────── */}
            <div className="delete-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>?</p>
                    <p>You should know that if you delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>, all its questions will be deleted as well.</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheChapter}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteChapterPopup}>Cancel</button>
                </div>
            </div>

            {/* ── Move / copy single question popup ───────────────────────────── */}
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

            {/* ── Send whole worksheet popup ───────────────────────────────────── */}
            <div className="send-worksheet-popup chapter-popup d-none justify-content-center align-items-center">
                <div className='move-question-card'>
                    {worksheetDone ? (
                        <>
                            <p className='text-color worksheet-done-title'>✅ Done!</p>
                            <p className='worksheet-done-sub'>
                                {worksheetSavedCount} of {orderedQuestions.length} questions sent successfully.
                            </p>
                            <div className='move-question-actions'>
                                <button className='button cancel-button' onClick={closeSendWorksheetPopup}>Close</button>
                            </div>
                        </>
                    ) : worksheetSending ? (
                        <>
                            <p className='text-color'>Sending worksheet...</p>
                            <p className='worksheet-progress-label'>Question {worksheetProgress.current} of {worksheetProgress.total}</p>
                            <div className='worksheet-progress-track'>
                                <div className='worksheet-progress-fill' style={{ width: `${worksheetProgressPercent}%` }}></div>
                            </div>
                            <p className='worksheet-progress-percent'>{worksheetProgressPercent}%</p>
                        </>
                    ) : (
                        <>
                            <div className='worksheet-popup-header'>
                                <span className='worksheet-popup-icon'>📤</span>
                                <p className='text-color'>Send entire worksheet</p>
                            </div>
                            <p className='worksheet-popup-sub'>
                                {orderedQuestions.length} questions will be copied or moved to the destination you choose below.
                            </p>
                            {worksheetError ? <p className='text-error'>{worksheetError}</p> : ''}
                            {worksheetDestinationLoading ? (
                                <p>Loading destinations...</p>
                            ) : (
                                <>
                                    <select value={worksheetDestQuestionTypeID} onChange={e => setWorksheetDestQuestionTypeID(e.target.value)}>
                                        <option value=''>Choose section</option>
                                        {QUESTION_TYPE_OPTIONS.map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                    <select value={worksheetDestSubjectID} onChange={e => setWorksheetDestSubjectID(e.target.value)}>
                                        <option value=''>Choose subject</option>
                                        {worksheetSubjectOptions.map(item => (
                                            <option key={item._id} value={item._id}>{item.systemName} - {item.subjectName}</option>
                                        ))}
                                    </select>
                                    <select value={worksheetDestUnitID} onChange={e => setWorksheetDestUnitID(e.target.value)}>
                                        <option value=''>Choose {(worksheetDestQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'year' : 'unit'}</option>
                                        {worksheetAvailableUnits.map(item => (
                                            <option key={item._id} value={item._id}>{item.unitName}</option>
                                        ))}
                                    </select>
                                    <select value={worksheetDestChapterID} onChange={e => setWorksheetDestChapterID(e.target.value)} disabled={!worksheetSelectedUnit || worksheetDestinationUnitsLoading}>
                                        <option value=''>Choose {(worksheetDestQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'exam' : 'chapter'}</option>
                                        {worksheetSelectedUnit?.chapters?.map(item => (
                                            <option key={item._id} value={item._id}>{item.chapterName}</option>
                                        ))}
                                    </select>
                                    {(worksheetSelectedUnit || worksheetSelectedChapter) ? <div className='move-target-preview'>
                                        {worksheetSelectedUnit ? <p><strong>{(worksheetDestQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'Year' : 'Unit'}:</strong> {worksheetSelectedUnit.unitName}</p> : ''}
                                        {worksheetSelectedChapter ? <p><strong>{(worksheetDestQuestionTypeID === PAST_PAPERS_QUESTION_TYPE_ID) ? 'Exam' : 'Chapter'}:</strong> {worksheetSelectedChapter.chapterName}</p> : ''}
                                    </div> : ''}
                                </>
                            )}
                            <div className='move-question-actions'>
                                <button className='button' onClick={handleCopyWorksheet}>Copy All</button>
                                <button className='button move-question-btn' onClick={handleMoveWorksheet}>Move All</button>
                                <button className='button cancel-button' onClick={closeSendWorksheetPopup}>Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chapter;
