import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import addSubject from '../../api/addSubject.api';
import addSystem from '../../api/addSystem.api';
import getSystem from '../../api/getSystem.api';
import updateSystem from '../../api/updateSystem.api'
import deleteSystem from '../../api/deleteSystem.api'
import updateSubject from '../../api/updateSubject.api';
import deleteSubject from '../../api/deleteSubject.api';
import reorderSubjects from '../../api/reorderSubjects.api';
import getAllSchool from '../../api/getAllSchool.api';
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

    // School access visibility state
    const [allSchools, setAllSchools] = useState([]);
    const [loadingSchools, setLoadingSchools] = useState(false);
    const [schoolModalSystem, setSchoolModalSystem] = useState(null);
    const [modalVisibilityMode, setModalVisibilityMode] = useState('all');
    const [modalSelectedSchoolIds, setModalSelectedSchoolIds] = useState([]);
    const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
    const [savingSchoolAccess, setSavingSchoolAccess] = useState(false);

    useEffect(() => {
        getAllSystem();
        getAllSchool(setAllSchools, setLoadingSchools);
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

    // delete subject func start
    const openDeleteSubPopup = (subjectID) => {
        setSubjectID(subjectID)
        setserverOperationError(null)
        document.querySelector('.delete-subject-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeleteSubPopup = () => {
        document.querySelector('.delete-subject-popup').classList.replace('d-flex', 'd-none');
    }

    const handleDeleteSubject = () => {
        deleteSubject(subjectID, setserverOperationError, setServerOperationLoading, setAllSystem)
    }
    // delete subject func end

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

    // delete system func start
    const openDeleteSysPopup = (system) => {
        if (system.subjects && system.subjects.length > 0) {
            alert('Cannot delete this system: Please delete all its subjects/units first.');
            return;
        }
        setSystemID(system._id)
        setserverOperationError(null)
        document.querySelector('.delete-system-popup').classList.replace('d-none', 'd-flex');
    }

    const closeDeleteSysPopup = () => {
        document.querySelector('.delete-system-popup').classList.replace('d-flex', 'd-none');
    }

    const handleDeleteSystem = () => {
        deleteSystem(systemID, setserverOperationError, setServerOperationLoading, setAllSystem)
    }
    // delete system func end

    // reorder subject func start
    const moveSubjectUp = (systemIndex, subjectIndex) => {
        if (subjectIndex === 0) return;
        const newAllSystem = [...allSystem];
        const system = newAllSystem[systemIndex];
        const subjects = [...system.subjects];
        const temp = subjects[subjectIndex];
        subjects[subjectIndex] = subjects[subjectIndex - 1];
        subjects[subjectIndex - 1] = temp;
        system.subjects = subjects;
        setAllSystem(newAllSystem);
        
        const subjectIDs = subjects.map(s => s._id);
        reorderSubjects(system._id, subjectIDs, setAllSystem);
    }

    const moveSubjectDown = (systemIndex, subjectIndex) => {
        const newAllSystem = [...allSystem];
        const system = newAllSystem[systemIndex];
        const subjects = [...system.subjects];
        if (subjectIndex === subjects.length - 1) return;
        const temp = subjects[subjectIndex];
        subjects[subjectIndex] = subjects[subjectIndex + 1];
        subjects[subjectIndex + 1] = temp;
        system.subjects = subjects;
        setAllSystem(newAllSystem);
        
        const subjectIDs = subjects.map(s => s._id);
        reorderSubjects(system._id, subjectIDs, setAllSystem);
    }
    // reorder subject func end

    // visibility toggles start
    const toggleSystemVisibility = async (system) => {
        const nextVisibility = system.isVisible === false ? true : false;
        // Optimistic UI update
        setAllSystem(prev => prev.map(s => s._id === system._id ? { ...s, isVisible: nextVisibility } : s));
        try {
            const res = await fetch(`https://backend-production-6752.up.railway.app/system/updateSystem/${system._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: nextVisibility })
            });
            const data = await res.json();
            if (data.message === 'success' && data.allSystem) {
                setAllSystem(data.allSystem);
            }
        } catch (err) {
            console.error('Failed to update system visibility:', err);
            // Revert on error
            setAllSystem(prev => prev.map(s => s._id === system._id ? { ...s, isVisible: !nextVisibility } : s));
            alert('Failed to update system visibility. Please try again.');
        }
    };

    const toggleSubjectVisibility = async (systemId, subItem) => {
        const nextVisibility = subItem.isVisible === false ? true : false;
        // Optimistic UI update
        setAllSystem(prev => prev.map(s => {
            if (s._id !== systemId) return s;
            return {
                ...s,
                subjects: s.subjects?.map(sub => sub._id === subItem._id ? { ...sub, isVisible: nextVisibility } : sub)
            };
        }));
        try {
            const res = await fetch(`https://backend-production-6752.up.railway.app/subject/updateSubject/${subItem._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: nextVisibility })
            });
            const data = await res.json();
            if (data.message === 'success' && data.allSystem) {
                setAllSystem(data.allSystem);
            }
        } catch (err) {
            console.error('Failed to update level visibility:', err);
            // Revert on error
            setAllSystem(prev => prev.map(s => {
                if (s._id !== systemId) return s;
                return {
                    ...s,
                    subjects: s.subjects?.map(sub => sub._id === subItem._id ? { ...sub, isVisible: !nextVisibility } : sub)
                };
            }));
            alert('Failed to update level visibility. Please try again.');
        }
    };
    // visibility toggles end

    // School-specific visibility modal handlers start
    const openSchoolModal = (system) => {
        setSchoolModalSystem(system);
        const mode = system.visibilityMode || ((system.allowedSchools && system.allowedSchools.length > 0) ? 'specific' : 'all');
        setModalVisibilityMode(mode);
        setModalSelectedSchoolIds((system.allowedSchools || []).map(s => String(s._id || s)));
        setSchoolSearchTerm('');
    };

    const closeSchoolModal = () => {
        setSchoolModalSystem(null);
        setSchoolSearchTerm('');
    };

    const handleToggleSchoolSelection = (schoolId) => {
        const strId = String(schoolId);
        setModalSelectedSchoolIds(prev => 
            prev.includes(strId) ? prev.filter(id => id !== strId) : [...prev, strId]
        );
    };

    const handleSelectAllSchools = () => {
        setModalSelectedSchoolIds(allSchools.map(s => String(s._id)));
    };

    const handleDeselectAllSchools = () => {
        setModalSelectedSchoolIds([]);
    };

    const handleSaveSchoolAccess = async () => {
        if (!schoolModalSystem) return;
        setSavingSchoolAccess(true);
        const targetSystemId = schoolModalSystem._id;
        const payload = {
            visibilityMode: modalVisibilityMode,
            allowedSchools: modalVisibilityMode === 'specific' ? modalSelectedSchoolIds : [],
            isVisible: modalVisibilityMode !== 'none'
        };

        // Optimistic UI update
        setAllSystem(prev => prev.map(s => {
            if (s._id !== targetSystemId) return s;
            return {
                ...s,
                visibilityMode: modalVisibilityMode,
                allowedSchools: modalVisibilityMode === 'specific' 
                    ? allSchools.filter(sch => modalSelectedSchoolIds.includes(String(sch._id))) 
                    : [],
                isVisible: modalVisibilityMode !== 'none'
            };
        }));

        try {
            const res = await fetch(`https://backend-production-6752.up.railway.app/system/updateSystem/${targetSystemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.message === 'success' && data.allSystem) {
                setAllSystem(data.allSystem);
            }
            closeSchoolModal();
        } catch (err) {
            console.error('Failed to save school visibility settings:', err);
            alert('Failed to save school visibility settings. Please try again.');
            getAllSystem();
        } finally {
            setSavingSchoolAccess(false);
        }
    };
    // School-specific visibility modal handlers end

    if (loading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    const totalSystemsCount = allSystem?.length || 0;
    const visibleSystemsCount = allSystem?.filter(s => s.isVisible !== false).length || 0;
    const hiddenSystemsCount = allSystem?.filter(s => s.isVisible === false).length || 0;

    return (
        <div className='subject-container'>
            <div className='new-subject d-flex align-items-center'>
                <span>+</span>
                <p onClick={openAddSystem}>Add New System</p>
            </div>

            {/* Systems Visibility Summary Stats */}
            <div className="systems-stats-bar d-flex align-items-center">
                <div className="stat-pill stat-total">
                    <strong>{totalSystemsCount}</strong> Total Systems
                </div>
                <div className="stat-pill stat-visible">
                    <i className="fa fa-eye"></i>
                    <strong>{visibleSystemsCount}</strong> Visible to Users
                </div>
                {hiddenSystemsCount > 0 && (
                    <div className="stat-pill stat-hidden">
                        <i className="fa fa-eye-slash"></i>
                        <strong>{hiddenSystemsCount}</strong> Hidden from Users
                    </div>
                )}
            </div>

            <div className='d-flex flex-wrap'>
                {allSystem?.map((item, systemIndex) => {
                    const isSystemHidden = item.isVisible === false;
                    const mode = item.visibilityMode || ((item.allowedSchools && item.allowedSchools.length > 0) ? 'specific' : 'all');
                    const schoolCount = item.allowedSchools?.length || 0;

                    return (
                        <div className={`system-cover ${isSystemHidden ? 'is-hidden-system' : ''}`} key={item._id}>
                            <div className='d-flex justify-content-space-between align-items-center' style={{ flexWrap: 'wrap', gap: '8px' }}>
                                <div className='d-flex align-items-center' style={{ gap: '8px', flexWrap: 'wrap' }}>
                                    <p className='system-name' style={{ margin: 0 }}>{item.systemName}</p>
                                    <span 
                                        className={`visibility-badge ${!isSystemHidden ? 'badge-visible' : 'badge-hidden'}`}
                                        title={!isSystemHidden ? 'Visible to users' : 'Hidden from users'}
                                    >
                                        <i className={`fa ${!isSystemHidden ? 'fa-check-circle' : 'fa-eye-slash'}`}></i>
                                        {!isSystemHidden ? 'Visible' : 'Hidden'}
                                    </span>

                                    {/* School Access Scope Badge */}
                                    {mode === 'none' || isSystemHidden ? (
                                        <span className="school-access-badge badge-school-none" title="Hidden from all schools">
                                            <i className="fa fa-ban"></i> No Schools
                                        </span>
                                    ) : mode === 'specific' ? (
                                        <span 
                                            className="school-access-badge badge-school-specific" 
                                            title={item.allowedSchools?.map(s => s.userName).filter(Boolean).join(', ') || `${schoolCount} Schools assigned`}
                                        >
                                            <i className="fa fa-university"></i> {schoolCount} {schoolCount === 1 ? 'School' : 'Schools'}
                                        </span>
                                    ) : (
                                        <span className="school-access-badge badge-school-all" title="Available to all schools">
                                            <i className="fa fa-globe"></i> All Schools
                                        </span>
                                    )}
                                </div>
                                <div className='system-icon d-flex align-items-center'>
                                    <button
                                        type="button"
                                        onClick={() => openSchoolModal(item)}
                                        className="school-access-btn"
                                        title="Configure which schools can see this system"
                                    >
                                        <i className="fa fa-university"></i>
                                        <span>Schools</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleSystemVisibility(item)}
                                        className={`visibility-toggle-btn ${!isSystemHidden ? 'btn-active-visible' : 'btn-active-hidden'}`}
                                        title={!isSystemHidden ? 'Click to hide this system from users' : 'Click to show this system to users'}
                                    >
                                        <i className={`fa ${!isSystemHidden ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        <span>{!isSystemHidden ? 'Hide' : 'Show'}</span>
                                    </button>
                                    <i onClick={() => openAddSubPopup(item._id)} className="fa fa-plus" title="Add Subject/Level" aria-hidden="true"></i>
                                    <i onClick={() => openUpdateSysPopup(item.systemName, item._id)} className="fa fa-pencil" title="Edit System Name" aria-hidden="true"></i>
                                    <i onClick={() => openDeleteSysPopup(item)} className="fa fa-trash" style={{color: '#ff4d4f', marginLeft: '10px'}} title="Delete System" aria-hidden="true"></i>
                                </div>
                            </div>

                            {isSystemHidden && (
                                <div className="hidden-system-banner">
                                    <i className="fa fa-info-circle"></i> This system is hidden from students and teachers.
                                </div>
                            )}

                            {item.subjects?.map((subItem, subjectIndex) => {
                                const isSubHidden = subItem.isVisible === false;
                                return (
                                    <div className={`subject-cover d-flex justify-content-space-between align-items-center ${isSubHidden ? 'subject-is-hidden' : ''}`} key={subItem._id}>
                                        <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                                            <Link to={`/unit/${questionTypeName}/${questionTypeID}/${subItem._id}`}>
                                                <p className='subject-name'>{subItem.subjectName}</p>
                                            </Link>
                                            {isSubHidden && (
                                                <span className="sub-hidden-tag">Hidden</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <i 
                                                onClick={() => toggleSubjectVisibility(item._id, subItem)} 
                                                className={`fa ${!isSubHidden ? 'fa-eye' : 'fa-eye-slash'} subject-eye-btn`} 
                                                style={{
                                                    marginRight: '12px', 
                                                    color: !isSubHidden ? '#4ade80' : '#fda4af',
                                                    fontSize: '1.2rem',
                                                    cursor: 'pointer'
                                                }} 
                                                title={!isSubHidden ? 'Level visible to users (Click to hide)' : 'Level hidden from users (Click to show)'}
                                                aria-hidden="true"
                                            ></i>
                                            {subjectIndex > 0 && <i onClick={() => moveSubjectUp(systemIndex, subjectIndex)} className="fa fa-arrow-up" style={{marginRight: '10px'}} aria-hidden="true"></i>}
                                            {subjectIndex < item.subjects.length - 1 && <i onClick={() => moveSubjectDown(systemIndex, subjectIndex)} className="fa fa-arrow-down" style={{marginRight: '10px'}} aria-hidden="true"></i>}
                                            <i onClick={() => openUpdateSubPopup(subItem.subjectName, subItem._id)} className="fa fa-pencil" style={{marginRight: '10px'}} aria-hidden="true"></i>
                                            <i onClick={() => openDeleteSubPopup(subItem._id)} className="fa fa-trash" style={{color: '#ff4d4f'}} aria-hidden="true"></i>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
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

            {/* delete subject popup start */}
            <div className="delete-subject-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Delete Subject / Unit</p>
                    <p>Are you sure you want to delete this subject/unit?</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' style={{background: '#ff4d4f'}} onClick={handleDeleteSubject}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteSubPopup}>Cancel</button>
                </div>
            </div>
            {/* delete subject popup end */}

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

            {/* delete system popup start */}
            <div className="delete-system-popup subject-popup d-none justify-content-center align-items-center">
                <div>
                    <p className='text-color'>Delete System</p>
                    <p>Are you sure you want to delete this system? All its subjects will be removed.</p>
                    {(serverOperationError) ? <p className='text-error'>{serverOperationError}</p> : ''}
                    <button className='button' style={{background: '#ff4d4f'}} onClick={handleDeleteSystem}>{(serverOperationLoading) ? <span className="button-loader"></span> : 'Delete'}</button>
                    <button className='button' onClick={closeDeleteSysPopup}>Cancel</button>
                </div>
            </div>
            {/* delete system popup end */}

            {/* School Visibility Access Modal start */}
            {schoolModalSystem && (
                <div className="school-modal-backdrop d-flex justify-content-center align-items-center">
                    <div className="school-modal-card">
                        <div className="school-modal-header d-flex justify-content-space-between align-items-center">
                            <div>
                                <h3 className="school-modal-title">
                                    <i className="fa fa-university" style={{ color: '#4f46e5', marginRight: '8px' }}></i>
                                    Manage School Visibility
                                </h3>
                                <p className="school-modal-subtitle">
                                    System: <strong>{schoolModalSystem.systemName}</strong>
                                </p>
                            </div>
                            <button type="button" className="close-x-btn" onClick={closeSchoolModal} title="Close">✕</button>
                        </div>

                        <div className="school-modal-body">
                            <p className="visibility-section-label">Which schools can see and access this system?</p>
                            <div className="visibility-options-group">
                                <label className={`visibility-radio-label ${modalVisibilityMode === 'all' ? 'active-radio' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="visibilityMode" 
                                        value="all" 
                                        checked={modalVisibilityMode === 'all'} 
                                        onChange={() => setModalVisibilityMode('all')} 
                                    />
                                    <div className="radio-text-box">
                                        <strong><i className="fa fa-globe" style={{ color: '#059669', marginRight: '6px' }}></i> All Schools (Default)</strong>
                                        <span>Every school, teacher, and student can see this curriculum system.</span>
                                    </div>
                                </label>

                                <label className={`visibility-radio-label ${modalVisibilityMode === 'specific' ? 'active-radio' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="visibilityMode" 
                                        value="specific" 
                                        checked={modalVisibilityMode === 'specific'} 
                                        onChange={() => setModalVisibilityMode('specific')} 
                                    />
                                    <div className="radio-text-box">
                                        <strong><i className="fa fa-building-o" style={{ color: '#2563eb', marginRight: '6px' }}></i> Specific Schools Only</strong>
                                        <span>Only students and teachers belonging to the selected schools will see this system.</span>
                                    </div>
                                </label>

                                <label className={`visibility-radio-label ${modalVisibilityMode === 'none' ? 'active-radio' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="visibilityMode" 
                                        value="none" 
                                        checked={modalVisibilityMode === 'none'} 
                                        onChange={() => setModalVisibilityMode('none')} 
                                    />
                                    <div className="radio-text-box">
                                        <strong><i className="fa fa-eye-slash" style={{ color: '#dc2626', marginRight: '6px' }}></i> Hide From All Schools</strong>
                                        <span>Temporarily disable this system completely for all schools.</span>
                                    </div>
                                </label>
                            </div>

                            {modalVisibilityMode === 'specific' && (
                                <div className="specific-schools-section">
                                    <div className="schools-search-toolbar d-flex justify-content-space-between align-items-center">
                                        <input 
                                            type="text" 
                                            className="school-search-input" 
                                            placeholder="🔍 Search schools by name or email..." 
                                            value={schoolSearchTerm} 
                                            onChange={e => setSchoolSearchTerm(e.target.value)} 
                                        />
                                        <div className="quick-select-btns d-flex" style={{ gap: '8px' }}>
                                            <button type="button" onClick={handleSelectAllSchools} className="btn-tiny">Select All</button>
                                            <button type="button" onClick={handleDeselectAllSchools} className="btn-tiny">Clear All</button>
                                        </div>
                                    </div>

                                    <div className="schools-checklist-box">
                                        {allSchools
                                            .filter(sch => {
                                                if (!schoolSearchTerm.trim()) return true;
                                                const term = schoolSearchTerm.toLowerCase();
                                                return (sch.userName && sch.userName.toLowerCase().includes(term)) ||
                                                       (sch.email && sch.email.toLowerCase().includes(term));
                                            })
                                            .map(school => {
                                                const isChecked = modalSelectedSchoolIds.includes(String(school._id));
                                                return (
                                                    <label key={school._id} className={`school-check-row d-flex align-items-center ${isChecked ? 'is-selected-school' : ''}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked} 
                                                            onChange={() => handleToggleSchoolSelection(school._id)} 
                                                        />
                                                        <div className="school-info-col">
                                                            <span className="school-name-text">{school.userName}</span>
                                                            {school.email && <span className="school-email-text">{school.email}</span>}
                                                        </div>
                                                        <span className={`school-status-tag ${school.disable ? 'status-disabled' : 'status-active'}`}>
                                                            {school.disable ? 'Inactive' : 'Active'}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        }
                                        {allSchools.length === 0 && !loadingSchools && (
                                            <p className="no-schools-text">No registered schools found.</p>
                                        )}
                                        {loadingSchools && (
                                            <p className="no-schools-text">Loading schools...</p>
                                        )}
                                    </div>
                                    <div className="selected-schools-counter">
                                        <strong>{modalSelectedSchoolIds.length}</strong> of {allSchools.length} schools selected
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="school-modal-footer d-flex justify-content-end align-items-center" style={{ gap: '10px' }}>
                            <button type="button" className="button" style={{ background: '#94a3b8' }} onClick={closeSchoolModal}>Cancel</button>
                            <button type="button" className="button" style={{ background: '#2563eb' }} onClick={handleSaveSchoolAccess} disabled={savingSchoolAccess}>
                                {savingSchoolAccess ? <span className="button-loader"></span> : 'Save School Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* School Visibility Access Modal end */}

        </div>
    )
}

export default Subject