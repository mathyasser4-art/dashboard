import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import getUnit from '../../api/getUnit.api'
import updateUnit from '../../api/updateUnit.api'
import deleteUnit from '../../api/deleteUnit.api'
import addChapter from '../../api/addChapter.api'
import addUnit from '../../api/addUnit.api'
import '../../reusable.css'
import './Unit.css'

const Unit = () => {
    const [allUnit, setAllUnit] = useState([])
    const [loading, setLoading] = useState(true)
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [unitName, setUnitName] = useState('')
    const [chapterName, setChapterName] = useState('')
    const [unitID, setUnitID] = useState('')
    const { questionTypeID, questionTypeName, subjectID } = useParams()

    useEffect(() => {
        getAllUnit()
    }, []);

    // get all unit
    const getAllUnit = async () => {
        await getUnit(questionTypeID, subjectID, setAllUnit, setLoading)
    }

    // update unit func start  
    const openUpdatePopup = (unitName, unitID) => {
        setUnitName(unitName)
        setUnitID(unitID)
        setserverOperationError(null)
        document.querySelector('.update-unit-popup').classList.replace('d-none', 'd-flex');
    }

    const closeUpdatePopup = () => {
        document.querySelector('.update-unit-popup').classList.replace('d-flex', 'd-none');
    }

    const update = () => {
        if (unitName === '') {
            setserverOperationError('Enter the unit name first!')
        } else {
            const data = { unitName }
            updateUnit(data, questionTypeID, unitID, subjectID, setserverOperationError, setServerOperationLoading, setAllUnit)
        }
    }
    // update unit func end  

    // delete unit func start  
    const openDeletePopup = (unitName, unitID) => {
        setUnitName(unitName)
        setUnitID(unitID)
        setserverOperationError(null)
        document.querySelector('.delete-unit-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeletePopup = () => {
        document.querySelector('.delete-unit-popup').classList.replace('d-flex', 'd-none');
    }

    const deleted = () => {
        deleteUnit(questionTypeID, unitID, subjectID, setserverOperationError, setServerOperationLoading, setAllUnit)
    }
    // delete unit func end  

    // add chapter func start  
    const openAddChapterPopup = (unitID) => {
        setUnitID(unitID)
        setChapterName('')
        setserverOperationError(null)
        document.querySelector('.add-chapter-popup').classList.replace('d-none', 'd-flex');
    }

    const closeAddChapterPopup = () => {
        document.querySelector('.add-chapter-popup').classList.replace('d-flex', 'd-none');
    }

    const addNewChapter = () => {
        if (chapterName === '') {
            setserverOperationError('Enter the chapter name first!')
        } else {
            const data = { chapterName, unit: unitID }
            addChapter(data, questionTypeID, subjectID,setserverOperationError, setServerOperationLoading, setAllUnit)
        }
    }
    // add chapter func end  

    // add unit func start  
    const openAddUnitPopup = () => {
        setUnitName('')
        setserverOperationError(null)
        document.querySelector('.add-unit-popup').classList.replace('d-none', 'd-flex');
    }

    const closeAddUnitPopup = () => {
        document.querySelector('.add-unit-popup').classList.replace('d-flex', 'd-none');
    }

    const addNewUnit = () => {
        if (unitName === '') {
            setserverOperationError('Enter the unit name first!')
        } else {
            const data = { unitName, questionType: questionTypeID, subject: subjectID }
            addUnit(data, setserverOperationError, setServerOperationLoading, setAllUnit)
        }
    }
    // add unit func end  

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <>
            <div className='new-unit'>
                <div className='d-flex align-items-center'>
                    <span className='add-icon'>+</span>
                    <p onClick={openAddUnitPopup}>Add New <span>{(questionTypeName == 'Past Papers') ? 'Year' : 'Unit'}</span></p>
                </div>
            </div>
            <div className='unit-container d-flex flex-wrap'>
                {allUnit.map(item => {
                    return (
                        <div className='unit-cover' key={item._id}>
                            <div className='d-flex justify-content-space-between align-items-center'>
                                <p className='unit-name'>{item.unitName}</p>
                                <div className='unit-icon'>
                                    <i onClick={() => openAddChapterPopup(item._id)} className="fa fa-plus" aria-hidden="true"></i>
                                    <i onClick={() => openUpdatePopup(item.unitName, item._id)} className="fa fa-pencil" aria-hidden="true"></i>
                                    <i onClick={() => openDeletePopup(item.unitName, item._id)} className="fa fa-trash-o" aria-hidden="true"></i>
                                </div>
                            </div>
                            {item.chapters.map(subItem => {
                                return (
                                    <Link key={subItem._id} to={`/chapter/${questionTypeName}/${subItem._id}/${questionTypeID}/${item._id}/${subjectID}`}><p className='chapter-name'>{subItem.chapterName}</p>                                    </Link>
                                )
                            })}
                        </div>
                    )
                })}
                {/* update unit popup start */}
                <div className="update-unit-popup unit-popup d-none justify-content-center align-items-center">
                    <div>
                        <p className='text-color'>Update <span>{(questionTypeName == 'Past Papers') ? 'year' : 'unit'}</span> name</p>
                        {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                        <input type="text" placeholder='Enter the name' value={unitName} onChange={e => setUnitName(e.target.value)} />
                        <button className='button' onClick={update}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                        <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                    </div>
                </div>
                {/* update unit popup end */}

                {/* delete unit popup start */}
                <div className="delete-unit-popup unit-popup d-none justify-content-center align-items-center">
                    <div>
                        {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                        <p className='text-color'>Are you sure you want to delete this <span>{(questionTypeName == 'Past Papers') ? 'year' : 'unit'}</span> (<span style={{ color: "red" }}>{unitName}</span>)?</p>
                        <button className='button' onClick={deleted}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                        <button className='button' onClick={closeDeletePopup}>Cancel</button>
                    </div>
                </div>
                {/* delete unit popup end */}

                {/* add chapter popup start */}
                <div className="add-chapter-popup unit-popup d-none justify-content-center align-items-center">
                    <div>
                        {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                        <p className='text-color'>Add new <span>{(questionTypeName == 'Past Papers') ? 'exam' : 'chapter'}</span></p>
                        <input type="text" placeholder='Enter the name' value={chapterName} onChange={e => setChapterName(e.target.value)} />
                        <button className='button' onClick={addNewChapter}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                        <button className='button' onClick={closeAddChapterPopup}>Cancel</button>
                    </div>
                </div>
                {/* add chapter popup end */}

                {/* add unit popup start */}
                <div className="add-unit-popup unit-popup d-none justify-content-center align-items-center">
                    <div>
                        {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                        <p className='text-color'>Add new <span>{(questionTypeName == 'Past Papers') ? 'year' : 'unit'}</span></p>
                        <input type="text" placeholder='Enter the name' value={unitName} onChange={e => setUnitName(e.target.value)} />
                        <button className='button' onClick={addNewUnit}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                        <button className='button' onClick={closeAddUnitPopup}>Cancel</button>
                    </div>
                </div>
                {/* add unit popup end */}
            </div>
        </>
    );
}

export default Unit;
