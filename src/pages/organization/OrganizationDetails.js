import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    getOrganizationDetails,
    getOrgTeachers,
    getOrgStudents,
    getOrgClasses
} from '../../api/getOrganizationDetails.api';
import '../../reusable.css';
import './OrganizationDetails.css';

function OrganizationDetails() {
    const { orgID } = useParams();

    const [loading, setLoading] = useState(true);
    const [orgData, setOrgData] = useState(null);
    const [activeTab, setActiveTab] = useState('schools'); // 'schools' | 'teachers' | 'students' | 'classes'
    const [selectedSchoolFilter, setSelectedSchoolFilter] = useState(''); // '' = all

    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOrgDetails();
    }, [orgID]);

    useEffect(() => {
        if (orgID) {
            loadTabData(activeTab, selectedSchoolFilter);
        }
    }, [orgID, activeTab, selectedSchoolFilter]);

    const loadOrgDetails = async () => {
        setLoading(true);
        const res = await getOrganizationDetails(orgID);
        if (res && res.message === 'success') {
            setOrgData(res);
        }
        setLoading(false);
    };

    const loadTabData = async (tab, schoolFilter) => {
        setTabLoading(true);
        if (tab === 'teachers') {
            const res = await getOrgTeachers(orgID, schoolFilter);
            setTeachers(res.teachers || []);
        } else if (tab === 'students') {
            const res = await getOrgStudents(orgID, schoolFilter);
            setStudents(res.students || []);
        } else if (tab === 'classes') {
            const res = await getOrgClasses(orgID, schoolFilter);
            setClasses(res.classes || []);
        }
        setTabLoading(false);
    };

    // Filter items by search query
    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) return teachers;
        const q = searchQuery.toLowerCase();
        return teachers.filter(t =>
            (t.userName && t.userName.toLowerCase().includes(q)) ||
            (t.email && t.email.toLowerCase().includes(q)) ||
            (t.createdBy?.userName && t.createdBy.userName.toLowerCase().includes(q))
        );
    }, [teachers, searchQuery]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.userName && s.userName.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.createdBy?.userName && s.createdBy.userName.toLowerCase().includes(q)) ||
            (s.class?.class && s.class.class.toLowerCase().includes(q))
        );
    }, [students, searchQuery]);

    const filteredClasses = useMemo(() => {
        if (!searchQuery.trim()) return classes;
        const q = searchQuery.toLowerCase();
        return classes.filter(c =>
            (c.class && c.class.toLowerCase().includes(q)) ||
            (c.school?.userName && c.school.userName.toLowerCase().includes(q))
        );
    }, [classes, searchQuery]);

    if (loading) {
        return (
            <div className='loading-container'>
                <div className='d-flex justify-content-center'>
                    <span className="page-loader"></span>
                </div>
            </div>
        );
    }

    if (!orgData || !orgData.organization) {
        return (
            <div className='org-details-container text-center'>
                <p className='text-error'>Organization not found.</p>
                <Link to="/organization" className='button'>Back to Organizations</Link>
            </div>
        );
    }

    const { organization, stats, schools } = orgData;

    return (
        <div className='org-details-container'>
            {/* ── Top Header ────────────────────────────────────────── */}
            <div className='org-nav-crumb d-flex align-items-center justify-content-space-between'>
                <Link to="/organization" className='back-link'>
                    <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Organizations
                </Link>
                <div className='school-filter-select-wrapper'>
                    <label>Filter by School: </label>
                    <select
                        className='school-filter-select'
                        value={selectedSchoolFilter}
                        onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    >
                        <option value="">All Schools ({schools.length})</option>
                        {schools.map(s => (
                            <option key={s._id} value={s._id}>{s.userName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className='org-details-header'>
                <div className='d-flex align-items-center gap-1'>
                    <i className="fa fa-building-o header-icon" aria-hidden="true"></i>
                    <div>
                        <h1>{organization.userName}</h1>
                        <p className='org-subtitle-email'>{organization.email}</p>
                    </div>
                </div>
            </div>

            {/* ── Stat KPI Cards ────────────────────────────────────── */}
            <div className='org-stats-grid'>
                <div className='org-stat-card' onClick={() => setActiveTab('schools')}>
                    <div className='stat-icon bg-blue'>
                        <i className="fa fa-university" aria-hidden="true"></i>
                    </div>
                    <div>
                        <span className='stat-num'>{stats.totalSchools}</span>
                        <span className='stat-label'>Attached Schools</span>
                    </div>
                </div>

                <div className='org-stat-card' onClick={() => setActiveTab('teachers')}>
                    <div className='stat-icon bg-green'>
                        <i className="fa fa-users" aria-hidden="true"></i>
                    </div>
                    <div>
                        <span className='stat-num'>{stats.totalTeachers}</span>
                        <span className='stat-label'>Total Teachers</span>
                    </div>
                </div>

                <div className='org-stat-card' onClick={() => setActiveTab('students')}>
                    <div className='stat-icon bg-purple'>
                        <i className="fa fa-graduation-cap" aria-hidden="true"></i>
                    </div>
                    <div>
                        <span className='stat-num'>{stats.totalStudents}</span>
                        <span className='stat-label'>Total Students</span>
                    </div>
                </div>

                <div className='org-stat-card' onClick={() => setActiveTab('classes')}>
                    <div className='stat-icon bg-amber'>
                        <i className="fa fa-book" aria-hidden="true"></i>
                    </div>
                    <div>
                        <span className='stat-num'>{stats.totalClasses}</span>
                        <span className='stat-label'>Total Classes</span>
                    </div>
                </div>
            </div>

            {/* ── Tabs Navigation ───────────────────────────────────── */}
            <div className='org-tabs d-flex align-items-center justify-content-space-between'>
                <div className='tab-buttons d-flex'>
                    <button
                        className={`tab-btn ${activeTab === 'schools' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schools')}
                    >
                        <i className="fa fa-university" aria-hidden="true"></i> Schools ({schools.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teachers')}
                    >
                        <i className="fa fa-users" aria-hidden="true"></i> Teachers ({stats.totalTeachers})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}
                    >
                        <i className="fa fa-graduation-cap" aria-hidden="true"></i> Students ({stats.totalStudents})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('classes')}
                    >
                        <i className="fa fa-book" aria-hidden="true"></i> Classes ({stats.totalClasses})
                    </button>
                </div>

                {activeTab !== 'schools' && (
                    <div className='tab-search-wrapper'>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='tab-search-input'
                        />
                    </div>
                )}
            </div>

            {/* ── Tab Content ───────────────────────────────────────── */}
            <div className='tab-content-card'>
                {tabLoading && (
                    <div className='text-center py-4'>
                        <span className="page-loader"></span>
                    </div>
                )}

                {/* TAB 1: Schools */}
                {!tabLoading && activeTab === 'schools' && (
                    <div className='schools-table-wrapper'>
                        <table className='org-table'>
                            <thead>
                                <tr>
                                    <th>School Name</th>
                                    <th>Email</th>
                                    <th>Teachers</th>
                                    <th>Students</th>
                                    <th>Classes</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map(school => (
                                    <tr key={school._id}>
                                        <td>
                                            <div className='d-flex align-items-center gap-05'>
                                                <i className="fa fa-graduation-cap text-primary" aria-hidden="true"></i>
                                                <strong>{school.userName}</strong>
                                            </div>
                                        </td>
                                        <td>{school.email}</td>
                                        <td><span className='badge bg-light-green'>{school.teachersCount}</span></td>
                                        <td><span className='badge bg-light-purple'>{school.studentsCount}</span></td>
                                        <td><span className='badge bg-light-blue'>{school.classesCount}</span></td>
                                        <td>
                                            {school.disable ? (
                                                <span className='status-pill bg-disabled'>Paused</span>
                                            ) : (
                                                <span className='status-pill bg-active'>Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {schools.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className='text-center text-muted py-3'>
                                            No schools assigned to this organization yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 2: Teachers */}
                {!tabLoading && activeTab === 'teachers' && (
                    <div className='teachers-table-wrapper'>
                        <table className='org-table'>
                            <thead>
                                <tr>
                                    <th>Teacher Name</th>
                                    <th>Email</th>
                                    <th>School</th>
                                    <th>Subject</th>
                                    <th>Assigned Classes</th>
                                    <th>Max Students</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.map(teacher => (
                                    <tr key={teacher._id}>
                                        <td><strong>{teacher.userName}</strong></td>
                                        <td>{teacher.email}</td>
                                        <td>
                                            <span className='school-tag'>
                                                {teacher.createdBy?.userName || '—'}
                                            </span>
                                        </td>
                                        <td>{teacher.subject?.schoolSubjectName || '—'}</td>
                                        <td>
                                            {(teacher.classList || []).map(c => c.class).join(', ') || 'None'}
                                        </td>
                                        <td>{teacher.maxStudents || 'Unlimited'}</td>
                                    </tr>
                                ))}
                                {filteredTeachers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className='text-center text-muted py-3'>
                                            No teachers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 3: Students */}
                {!tabLoading && activeTab === 'students' && (
                    <div className='students-table-wrapper'>
                        <table className='org-table'>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Email / Username</th>
                                    <th>School</th>
                                    <th>Class</th>
                                    <th>Teacher</th>
                                    <th>Coins</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td><strong>{student.userName}</strong></td>
                                        <td>{student.email}</td>
                                        <td>
                                            <span className='school-tag'>
                                                {student.createdBy?.userName || '—'}
                                            </span>
                                        </td>
                                        <td>{student.class?.class || 'Unassigned'}</td>
                                        <td>{student.teacher?.userName || '—'}</td>
                                        <td><span className='coin-badge'>🪙 {student.coins || 0}</span></td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className='text-center text-muted py-3'>
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 4: Classes */}
                {!tabLoading && activeTab === 'classes' && (
                    <div className='classes-table-wrapper'>
                        <table className='org-table'>
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>School</th>
                                    <th>Assigned Teachers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClasses.map(cls => (
                                    <tr key={cls._id}>
                                        <td><strong>{cls.class}</strong></td>
                                        <td>
                                            <span className='school-tag'>
                                                {cls.school?.userName || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {(cls.teachers || []).map(t => t.userName).join(', ') || 'None'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredClasses.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className='text-center text-muted py-3'>
                                            No classes found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrganizationDetails;
