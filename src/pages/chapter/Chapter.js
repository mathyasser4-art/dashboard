import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import getChapter from '../../api/getChapter.api'
import updateChapter from '../../api/updateChapter.api'
import deleteQuestion from '../../api/deleteQuestion.api'
import deleteChapter from '../../api/deleteChapter.api'
import '../../reusable.css'
import './Chapter.css'

const Chapter = () => {
    const [chapterDetails, setChapterDetails] = useState({})
    const [loading, setLoading] = useState(true)
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [chapterName, setChapterName] = useState('')
    const [questionID, setQuestionID] = useState('')
    const { chapterID, questionTypeID, unitID, questionTypeName, subjectID } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getchapterDetails()
    }, []);

    // get all unit
    const getchapterDetails = async () => {
        await getChapter(chapterID, setChapterDetails, setLoading)
    }

    // update chapter func start  
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
    // update chapter func end    

    // delete question func start  
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
    // delete question func end  

    // delete chapter func start  
    const openDeleteChapterPopup = () => {
        document.querySelector('.delete-chapter-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeleteChapterPopup = () => {
        document.querySelector('.delete-chapter-popup').classList.replace('d-flex', 'd-none');
    }

    const deleteTheChapter = () => {
        deleteChapter(chapterID, setserverOperationError, setServerOperationLoading, navigate, questionTypeID, unitID, questionTypeName, subjectID)
    }
    // delete chapter func end  

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
                        <div>
                            <Link to={`/updateQuestion/${questionTypeName}/${item._id}/${questionTypeID}/${unitID}/${subjectID}`}><i className="fa fa-pencil icon" aria-hidden="true"></i></Link>
                            <i onClick={() => openDeleteQuestionPopup(item._id)} className="fa fa-trash-o" aria-hidden="true"></i>
                            <Link to={`/addQuestion/${questionTypeName}/${chapterDetails.chapterName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}/${index}`}><i className="fa fa-plus icon" aria-hidden="true"></i></Link>
                        </div>
                    </div>
                )
            })}
            {/* update chapter popup start */}
            <div className="update-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span> name</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the name' value={chapterName} onChange={e => setChapterName(e.target.value)} />
                    <button className='button' onClick={update}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                </div>
            </div>
            {/* update chapter popup end */}

            {/* delete question popup start */}
            <div className="delete-question-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this question?</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheQuestion}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteQuestionPopup}>Cancel</button>
                </div>
            </div>
            {/* delete question popup end */}

            {/* delete chapter popup start */}
            <div className="delete-chapter-popup chapter-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>?</p>
                    <p>You should know that if you delete this <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span>, all its questions will be deleted as well.</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={deleteTheChapter}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteChapterPopup}>Cancel</button>
                </div>
            </div>
            {/* delete chapter popup end */}
        </div>
    );
}

export default Chapter;
