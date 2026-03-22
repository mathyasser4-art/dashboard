import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const assignmentReportApiUrl = 'http://localhost:8000/assignment';

function AssignmentReport() {
  const { assignmentID } = useParams();
  const [students, setStudents] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudentResults() {
      try {
        const response = await fetch(`${assignmentReportApiUrl}/${assignmentID}/student-results`, {
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('O_authDB'),
          },
        });
        const data = await response.json();
        if (data.message === 'success') {
          setStudents(data.students);
          setAssignment(data.assignment);
        } else {
          setError(data.message || 'Failed to fetch student results');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentResults();
  }, [assignmentID]);

  const toggleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    const allIds = students.map(s => s._id);
    setSelectedStudents(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
  };

  const downloadPdfReport = () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to download the report.');
      return;
    }
    // Construct URL with selected student IDs as query param
    const studentIdsParam = Array.from(selectedStudents).join(',');
    const url = `${assignmentReportApiUrl}/${assignmentID}/download-pdf?students=${studentIdsParam}`;
    window.open(url, '_blank');
  };

  if (loading) return <div>Loading student results...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="assignment-report-container">
      <h2>Student Results for Assignment: {assignment?.title || assignmentID}</h2>
      <p>Select students to generate a combined PDF report</p>
      <button onClick={selectAll}>Select All</button>
      <button onClick={deselectAll}>Deselect All</button>
      <button onClick={downloadPdfReport}>Download Combined PDF ({selectedStudents.size} students)</button>
      {students.length === 0 ? (
        <p>No students have completed this assignment yet.</p>
      ) : (
        <ul>
          {students.map(student => (
            <li key={student._id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student._id)}
                  onChange={() => toggleSelectStudent(student._id)}
                />
                {student.name} - Score: {student.score} / {student.totalPossible} ({student.percentage}%)
              </label>
            </li>
          ))}
        </ul>
      )}
      <Link to="/dashboard/teacher">Back to Dashboard</Link>
    </div>
  );
}

export default AssignmentReport;
  