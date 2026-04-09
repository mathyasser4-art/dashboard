import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import addSubject from '../../api/addSubject.api';
import addSystem from '../../api/addSystem.api';
import getSystem from '../../api/getSystem.api';
import updateSystem from '../../api/updateSystem.api'
import updateSubject from '../../api/updateSubject.api';
import '../../reusable.css'
import './Subject.css'

function Subject() {
    const [allSystem, setAllSystem] = useState([])
    const [loading, setLoading] = useState(true)
    const [subjectName, setSubjectName] = useState('')
    const [systemName, setSystemName] = useState('')
    const [subjectID, setSubjectID] = useState('')
    const [systemID, setSystemID] = useState('')
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const { questionTypeID, questionTypeName } = useParams()

    useEffect(() => {
        getAllSystem()
    }, []);

    // get all system
    const getAllSystem = async () => {
        await getSystem(setAllSystem, setLoading)
    }

    // add system func start  
    const openAddSystem = () => {
        setSystemName('')
        setserverOperationError(null)
        document.querySelector('.add-system-popup').classList.replace('d-none', 'd-flex');
    }

    const closeAddSystem = () => {
        document.querySelector('.add-system-popup').classList.replace('d-flex', 'd-none');
    }

    const handleAddSystem = () => {
        if (systemName === '') {
            setserverOperationError('Enter the system name first!')
        } else {
            const data = { systemName }
            addSystem(data, setserverOperationError, setServerOperationLoading, setAllSystem)
        }
    }
    // add system func end    

    // add subject func start  
    const openAddSubPopup = (systemID) => {
        setSubjectName('')
        setSystemID(systemID)
        setserverOperationError(null)
        document.querySelector('.add-subject-popup').classList.replace('d-none', 'd-flex');
    }

    const closeAddSubPopup = () => {
        document.querySelector('.add-subject-popup').classList.replace('d-flex', 'd-none');
    }

    const handleAddSubject = () => {
        if (subjectName === '') {
            setserverOperationError('Enter the subject name first!')
        } else {
            const data = { subjectName, system: systemID }
            addSubject(data, setserverOperationError, setServerOperationLoading, setAllSystem)
        }
    }
    // add subject func end    

    // update subject func start  
    const openUpdateSubPopup = (subjectName, subjectID) => {
        setSubjectName(subjectName)
        setSubjectID(subjectID)
        setserverOperationError(null)
        document.querySelector('.update-subject-popup').classList.replace('d-none', 'd-flex');
    }

    const closeUpdatePopup = () => {
        document.querySelector('.update-subject-popup').classList.replace('d-flex', 'd-none');
    }

    const handleUpdateSubject = () => {
        if (subjectName === '') {
            setserverOperationError('Enter the subject name first!')
        } else {
            const data = { subjectName }
            updateSubject(data, subjectID, setserverOperationError, setServerOperationLoading, setAllSystem)
        }
    }
    // update subject func end    

    // update system func start  
    const openUpdateSysPopup = (systemName, systemID) => {
        setSystemName(systemName)
        setSystemID(systemID)
        setserverOperationError(null)
        document.querySelector('.update-system-popup').classList.replace('d-none', 'd-flex');
    }

    const closeUpdateSysPopup = () => {
        document.querySelector('.update-system-popup').classList.replace('d-flex', 'd-none');
    }

    const handleUpdateSystem = () => {
        if (systemName === '') {
            setserverOperationError('Enter the system name first!')
        } else {
            const data = { systemName }
            updateSystem(data, systemID, setserverOperationError, setServerOperationLoading, setAllSystem)
        }
    }
    // update system func end    

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className='subject-container'>
            <div className='new-subject d-flex align-items-center'>
                <span>+</span>
                <p onClick={openAddSystem}>Add New System</p>
            </div>
            <div className='d-flex flex-wrap'>
                {allSystem?.map(item => {
                    return (
                        <div className='system-cover' key={item._id}>
                            <div className='d-flex justify-content-space-between align-items-center'>
                                <p className='system-name'>{item.systemName}</p>
                                <div className='system-icon'>
                                    <i onClick={() => openAddSubPopup(item._id)} className="fa fa-plus" aria-hidden="true"></i>
                                    <i onClick={() => openUpdateSysPopup(item.systemName, item._id)} className="fa fa-pencil" aria-hidden="true"></i>
                                </div>
                            </div>
                            {item.subjects?.map(subItem => {
                                return (
                                    <div className='subject-cover d-flex justify-content-space-between align-items-center'>
                                        <Link key={subItem._id} to={`/unit/${questionTypeName}/${questionTypeID}/${subItem._id}`}><p className='subject-name'>{subItem.subjectName}</p></Link>
                                        <i onClick={() => openUpdateSubPopup(subItem.subjectName, subItem._id)} className="fa fa-pencil" aria-hidden="true"></i>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
                {/* {allSubject?.map(item => {
                    return (
                        <div key={item._id}>
                            <Link to={`/unit/${questionTypeName}/${questionTypeID}/${item._id}`}><p>{item.subjectName}</p></Link>
                            <button className='subject-update' onClick={() => openUpdatePopup(item.subjectName, item._id)}>update</button>
                        </div>
                    )
                })} */}
            </div>
            {/* add system popup start */}
            <div className="add-system-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Add New System</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the system name' value={systemName} onChange={e => setSystemName(e.target.value)} />
                    <button className='button' onClick={handleAddSystem}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                    <button className='button' onClick={closeAddSystem}>Cancel</button>
                </div>
            </div>
            {/* add system popup end */}

            {/* add subject popup start */}
            <div className="add-subject-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Add New Subject</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the subject name' value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                    <button className='button' onClick={handleAddSubject}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                    <button className='button' onClick={closeAddSubPopup}>Cancel</button>
                </div>
            </div>
            {/* add subject popup end */}

            {/* update subject popup start */}
            <div className="update-subject-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update Subject Name</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the subject name' value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                    <button className='button' onClick={handleUpdateSubject}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                </div>
            </div>
            {/* update subject popup end */}

             {/* update system popup start */}
             <div className="update-system-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update system Name</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <input type="text" placeholder='Enter the system name' value={systemName} onChange={e => setSystemName(e.target.value)} />
                    <button className='button' onClick={handleUpdateSystem}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdateSysPopup}>Cancel</button>
                </div>
            </div>
            {/* update system popup end */}
        </div>
    )
}

export default Subject