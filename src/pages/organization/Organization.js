import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import getAllOrganizations from '../../api/getAllOrganizations.api';
import addOrganization from '../../api/addOrganization.api';
import updateOrganization from '../../api/updateOrganization.api';
import deleteOrganization from '../../api/deleteOrganization.api';
import disableOrganization from '../../api/disableOrganization.api';
import getAllSchool from '../../api/getAllSchool.api';
import '../../reusable.css';
import './Organization.css';

function Organization() {
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [allSchools, setAllSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serverOperationError, setserverOperationError] = useState(null);
    const [serverOperationLoading, setServerOperationLoading] = useState(false);

    const [orgName, setOrgName] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [orgPassword, setOrgPassword] = useState('');
    const [selectedSchools, setSelectedSchools] = useState([]);
    const [orgID, setOrgID] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        getAllOrganizations(setAllOrganizations, setLoading);
        getAllSchool(setAllSchools, () => {});
    };

    // Toggle a school in the selected list
    const toggleSchoolSelection = (schoolId) => {
        setSelectedSchools(prev => {
            if (prev.includes(schoolId)) {
                return prev.filter(id => id !== schoolId);
            } else {
                return [...prev, schoolId];
            }
        });
    };

    // Add Organization Popup Handlers
    const openAddPopup = () => {
        setOrgName('');
        setOrgEmail('');
        setOrgPassword('');
        setSelectedSchools([]);
        setserverOperationError(null);
        document.querySelector('.add-org-popup')?.classList.replace('d-none', 'd-flex');
    };

    const closeAddPopup = () => {
        document.querySelector('.add-org-popup')?.classList.replace('d-flex', 'd-none');
    };

    const addNewOrganization = () => {
        if (!orgName.trim() || !orgEmail.trim() || !orgPassword.trim()) {
            setserverOperationError('Organization name, email, and password are required!');
            return;
        }
        const data = {
            userName: orgName.trim(),
            email: orgEmail.trim(),
            password: orgPassword.trim(),
            schoolsList: selectedSchools
        };
        addOrganization(data, setserverOperationError, setServerOperationLoading, setAllOrganizations);
    };

    // Update Organization Popup Handlers
    const openUpdatePopup = (org) => {
        setOrgName(org.userName || '');
        setOrgEmail(org.email || '');
        setOrgID(org._id);
        setOrgPassword('');
        const existingSchoolIds = (org.schoolsList || []).map(s => s._id || s);
        setSelectedSchools(existingSchoolIds);
        setserverOperationError(null);
        document.querySelector('.update-org-popup')?.classList.replace('d-none', 'd-flex');
    };

    const closeUpdatePopup = () => {
        document.querySelector('.update-org-popup')?.classList.replace('d-flex', 'd-none');
    };

    const handleUpdateOrganization = () => {
        if (!orgName.trim() || !orgEmail.trim()) {
            setserverOperationError('Organization name and email are required!');
            return;
        }
        const data = {
            userName: orgName.trim(),
            email: orgEmail.trim(),
            schoolsList: selectedSchools
        };
        if (orgPassword.trim()) {
            data.password = orgPassword.trim();
        }
        updateOrganization(data, orgID, setserverOperationError, setServerOperationLoading, setAllOrganizations);
    };

    // Delete Popup Handlers
    const openDeletePopup = (id) => {
        setOrgID(id);
        setserverOperationError(null);
        document.querySelector('.delete-org-popup')?.classList.replace('d-none', 'd-flex');
    };

    const closeDeletePopup = () => {
        document.querySelector('.delete-org-popup')?.classList.replace('d-flex', 'd-none');
    };

    const handleDeleteOrganization = () => {
        deleteOrganization(orgID, setserverOperationError, setServerOperationLoading, setAllOrganizations);
    };

    const handleDisableOrganization = (id) => {
        disableOrganization(id, setAllOrganizations);
    };

    if (loading) {
        return (
            <div className='loading-container'>
                <div className='d-flex justify-content-center'>
                    <span className="page-loader"></span>
                </div>
            </div>
        );
    }

    return (
        <div className='organization-container'>
            <div className='org-header-banner d-flex justify-content-space-between align-items-center'>
                <div>
                    <h2>Educational Groups &amp; Organizations</h2>
                    <p className='org-subtitle'>Manage multi-grade organizations and view consolidated cross-grade analytics</p>
                </div>
                <div className='new-org-btn'>
                    <div className='d-flex align-items-center' onClick={openAddPopup}>
                        <span className='add-icon'>+</span>
                        <p>Add New Organization</p>
                    </div>
                </div>
            </div>

            {allOrganizations.length === 0 && (
                <div className='org-empty-state'>
                    <i className="fa fa-sitemap org-empty-icon" aria-hidden="true"></i>
                    <h3>No Organizations Yet</h3>
                    <p>Create an organization to group multiple grades together and monitor them in a single dashboard.</p>
                    <button className='button' onClick={openAddPopup}>+ Add Organization</button>
                </div>
            )}

            <div className='org-list'>
                {allOrganizations.map(item => {
                    const schoolCount = item.schoolsList ? item.schoolsList.length : 0;
                    return (
                        <div key={item._id} className="org-card d-flex justify-content-space-between align-items-center">
                            <div className='org-info'>
                                <Link to={`/organization/${item._id}`} className='org-title-link'>
                                    <div className='d-flex align-items-center'>
                                        <i className="fa fa-building org-card-icon" aria-hidden="true"></i>
                                        <span className='org-name'>{item.userName}</span>
                                    </div>
                                </Link>
                                <div className='org-meta d-flex align-items-center'>
                                    <span className='org-badge'>
                                        <i className="fa fa-graduation-cap" aria-hidden="true"></i> {schoolCount} {schoolCount === 1 ? 'Grade' : 'Grades'}
                                    </span>
                                    <span className='org-email'>{item.email}</span>
                                </div>
                            </div>
                            <div className='org-actions d-flex align-items-center'>
                                <Link to={`/organization/${item._id}`} className='org-view-btn' title="Open Multi-Grade Dashboard">
                                    <i className="fa fa-dashboard" aria-hidden="true"></i> Dashboard
                                </Link>
                                {item.disable ? (
                                    <i onClick={() => handleDisableOrganization(item._id)} className="fa fa-play org-action-icon text-success" title="Enable Organization" aria-hidden="true"></i>
                                ) : (
                                    <i onClick={() => handleDisableOrganization(item._id)} className="fa fa-pause org-action-icon text-warning" title="Pause Organization" aria-hidden="true"></i>
                                )}
                                <i onClick={() => openUpdatePopup(item)} className="fa fa-pencil org-action-icon" title="Edit Organization" aria-hidden="true"></i>
                                <i onClick={() => openDeletePopup(item._id)} className="fa fa-trash-o org-action-icon text-danger" title="Delete Organization" aria-hidden="true"></i>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Add Organization Modal ──────────────────────────────── */}
            <div className="add-org-popup org-popup d-none justify-content-center align-items-center">
                <div className='org-modal-box'>
                    <p className='text-color modal-title'>Add New Organization</p>
                    <input
                        type="text"
                        placeholder='Enter Organization Name (e.g. Al-Amal School / Main Academy)'
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder='Enter Organization Admin Email'
                        value={orgEmail}
                        onChange={e => setOrgEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder='Enter Password'
                        value={orgPassword}
                        onChange={e => setOrgPassword(e.target.value)}
                    />

                    <div className='school-select-section'>
                        <label className='school-select-label'>
                            <i className="fa fa-graduation-cap" aria-hidden="true"></i> Assign Grades to this Organization:
                        </label>
                        <div className='schools-checkbox-list'>
                            {allSchools.map(school => (
                                <label key={school._id} className='school-checkbox-item'>
                                    <input
                                        type="checkbox"
                                        checked={selectedSchools.includes(school._id)}
                                        onChange={() => toggleSchoolSelection(school._id)}
                                    />
                                    <span>{school.userName}</span>
                                </label>
                            ))}
                            {allSchools.length === 0 && (
                                <p className='text-muted small'>No grades created yet. You can assign grades later.</p>
                            )}
                        </div>
                    </div>

                    {serverOperationError && <p className='text-error'>{serverOperationError}</p>}
                    <div className='modal-btn-row'>
                        <button className='button' onClick={addNewOrganization}>
                            {serverOperationLoading ? <span className="button-loader"></span> : 'Create Organization'}
                        </button>
                        <button className='button cancel-btn' onClick={closeAddPopup}>Cancel</button>
                    </div>
                </div>
            </div>

            {/* ── Update Organization Modal ───────────────────────────── */}
            <div className="update-org-popup org-popup d-none justify-content-center align-items-center">
                <div className='org-modal-box'>
                    <p className='text-color modal-title'>Update Organization</p>
                    <input
                        type="text"
                        placeholder='Organization Name'
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder='Organization Email'
                        value={orgEmail}
                        onChange={e => setOrgEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder='Leave blank to keep current password'
                        value={orgPassword}
                        onChange={e => setOrgPassword(e.target.value)}
                    />

                    <div className='school-select-section'>
                        <label className='school-select-label'>
                            <i className="fa fa-graduation-cap" aria-hidden="true"></i> Assigned Grades:
                        </label>
                        <div className='schools-checkbox-list'>
                            {allSchools.map(school => (
                                <label key={school._id} className='school-checkbox-item'>
                                    <input
                                        type="checkbox"
                                        checked={selectedSchools.includes(school._id)}
                                        onChange={() => toggleSchoolSelection(school._id)}
                                    />
                                    <span>{school.userName}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {serverOperationError && <p className='text-error'>{serverOperationError}</p>}
                    <div className='modal-btn-row'>
                        <button className='button' onClick={handleUpdateOrganization}>
                            {serverOperationLoading ? <span className="button-loader"></span> : 'Save Changes'}
                        </button>
                        <button className='button cancel-btn' onClick={closeUpdatePopup}>Cancel</button>
                    </div>
                </div>
            </div>

            {/* ── Delete Organization Modal ───────────────────────────── */}
            <div className="delete-org-popup org-popup d-none justify-content-center align-items-center">
                <div className='org-modal-box delete-box'>
                    <p className='text-color modal-title'>Delete Organization</p>
                    <p className='delete-warning'>
                        Are you sure you want to delete this organization? The grades will remain intact and will simply be detached from this group.
                    </p>
                    {serverOperationError && <p className='text-error'>{serverOperationError}</p>}
                    <div className='modal-btn-row'>
                        <button className='button danger-btn' onClick={handleDeleteOrganization}>
                            {serverOperationLoading ? <span className="button-loader"></span> : 'Delete Organization'}
                        </button>
                        <button className='button cancel-btn' onClick={closeDeletePopup}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Organization;
