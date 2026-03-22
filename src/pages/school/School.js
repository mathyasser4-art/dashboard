import React, { useState, useEffect } from 'react';
import addSchool from '../../api/addSchool.api';
import deleteSchool from '../../api/deleteSchool.api';
import getAllSchool from '../../api/getAllSchool.api';
import updateSchool from '../../api/updateSchool.api';
import disableSchool from '../../api/disableSchool.api';
import '../../reusable.css'
import './School.css'

function School() {
    const [allSchools, setAllSchools] = useState([])
    const [loading, setLoading] = useState(true)
    const [serverOperationError, setserverOperationError] = useState(null)
    const [serverOperationLoading, setServerOperationLoading] = useState(false)
    const [schoolName, setSchoolName] = useState('')
    const [schoolEmail, setSchoolEmail] = useState('')
    const [schoolPassword, setSchoolPassword] = useState('')
    const [schoolID, setSchoolID] = useState('')

    useEffect(() => {
        getSchoole()
    }, []);

    // get all schools
    const getSchoole = async () => {
        await getAllSchool(setAllSchools, setLoading)
    }

    // add school func start  
    const openAddPopup = () => {
        setSchoolName('')
        setSchoolEmail('')
        setSchoolPassword('')
        setserverOperationError(null)
        document.querySelector('.add-school-popup').classList.replace('d-none', 'd-flex');
    }

    const closeAddPopup = () => {
        document.querySelector('.add-school-popup').classList.replace('d-flex', 'd-none');
    }

    const addNewSchool = () => {
        if (schoolName === '' || schoolEmail === '' || schoolPassword === '') {
            setserverOperationError('All field is required!')
        } else {
            const data = {
                userName: schoolName,
                email: schoolEmail,
                password: schoolPassword
            }
            addSchool(data, setserverOperationError, setServerOperationLoading, setAllSchools)
        }
    }
    // add school func end  

    // update school func start  
    const openUpdatePopup = (userName, email, schoolID) => {
        setSchoolName(userName)
        setSchoolEmail(email)
        setSchoolID(schoolID)
        setSchoolPassword('')
        setserverOperationError(null)
        document.querySelector('.update-school-popup').classList.replace('d-none', 'd-flex');
    }

    const closeUpdatePopup = () => {
        document.querySelector('.update-school-popup').classList.replace('d-flex', 'd-none');
    }

    const handleUpdateSchool = () => {
        if (schoolName === '' || schoolEmail === '') {
            setserverOperationError('All field is required!')
        } else {
            let data = {}
            if (schoolPassword == '') {
                data = {
                    userName: schoolName,
                    email: schoolEmail
                }
            } else {
                data = {
                    userName: schoolName,
                    email: schoolEmail,
                    password: schoolPassword
                }
            }
            updateSchool(data, schoolID, setserverOperationError, setServerOperationLoading, setAllSchools)
        }
    }
    // update school func end  

    // delete school func start  
    const openDeletePopup = (schoolID) => {
        setSchoolID(schoolID)
        setserverOperationError(null)
        document.querySelector('.delete-school-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeletePopup = () => {
        document.querySelector('.delete-school-popup').classList.replace('d-flex', 'd-none');
    }

    const handleDeleteSchool = () => {
        deleteSchool(schoolID, setserverOperationError, setServerOperationLoading, setAllSchools)
    }
    // delete school func end  

    const handleDisableSchool = (schoolID) => {
        disableSchool(schoolID, setAllSchools)
    }

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className='school-container'>
            <div className='new-school'>
                <div className='d-flex align-items-center'>
                    <span className='add-icon'>+</span>
                    <p onClick={openAddPopup}>Add New School</p>
                </div>
            </div>
            {allSchools?.map(item => {
                return (
                    <div key={item._id} className="school-cover d-flex justify-content-space-between">
                        <p>{item.userName}</p>
                        <div>
                            {item.disable ? <i onClick={() => handleDisableSchool(item._id)} className="fa fa-play" aria-hidden="true"></i> : null}
                            {!item.disable ? <i onClick={() => handleDisableSchool(item._id)} className="fa fa-pause" aria-hidden="true"></i> : null}
                            <i onClick={() => openUpdatePopup(item.userName, item.email, item._id)} className="fa fa-pencil" aria-hidden="true"></i>
                            <i onClick={() => openDeletePopup(item._id)} className="fa fa-trash-o" aria-hidden="true"></i>
                        </div>
                    </div>
                )
            })}
            {/* add school popup start */}
            <div className="add-school-popup school-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Add new school account</p>
                    <input type="text" placeholder='Enter the school name' value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                    <input type="email" placeholder='Enter the school email' value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} />
                    <input type="password" placeholder='Enter the school password' value={schoolPassword} onChange={e => setSchoolPassword(e.target.value)} />
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={addNewSchool}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Add'}</button>
                    <button className='button' onClick={closeAddPopup}>Cancel</button>
                </div>
            </div>
            {/* add school popup end */}

            {/* update school popup start */}
            <div className="update-school-popup school-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Update school account</p>
                    <input type="text" placeholder='Enter the school name' value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                    <input type="email" placeholder='Enter the school email' value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} />
                    <input type="password" placeholder='•••••••••••••••••••' value={schoolPassword} onChange={e => setSchoolPassword(e.target.value)} />
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={handleUpdateSchool}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Update'}</button>
                    <button className='button' onClick={closeUpdatePopup}>Cancel</button>
                </div>
            </div>
            {/* update school popup end */}

            {/* delete school popup start */}
            <div className="delete-school-popup school-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Are you sure you want to delete this school?</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' onClick={handleDeleteSchool}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeletePopup}>Cancel</button>
                </div>
            </div>
            {/* delete school popup end */}
        </div>
    )
}

export default School