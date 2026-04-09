import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/navbar/Navbar'
import QuestionType from './pages/questionType/QuestionType'
import Unit from './pages/unit/Unit'
import Chapter from './pages/chapter/Chapter'
import AddQuestion from './pages/addQuestion/AddQuestion'
import UpdateQuestion from './pages/updateQuestion/UpdateQuestion'
import Subject from './pages/subject/Subject'
import School from './pages/school/School'
import Users from './pages/users/Users'
import AiGenerate from './pages/aiGenerate/AiGenerate'

function App() {
  useEffect(() => {
    window.addEventListener('error', e => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        const resizeObserverErrDiv = document.getElementById(
          'webpack-dev-server-client-overlay-div'
        );
        const resizeObserverErr = document.getElementById(
          'webpack-dev-server-client-overlay'
        );
        if (resizeObserverErr) {
          resizeObserverErr.setAttribute('style', 'display: none');
        }
        if (resizeObserverErrDiv) {
          resizeObserverErrDiv.setAttribute('style', 'display: none');
        }
      }
    });
  }, []);
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Navigate to='/questionType' />} />
        <Route path='/questionType' element={<QuestionType />} />
        <Route path='/subject/:questionTypeName/:questionTypeID' element={<Subject />} />
        <Route path='/unit/:questionTypeName/:questionTypeID/:subjectID' element={<Unit />} />
        <Route path='/chapter/:questionTypeName/:chapterID/:questionTypeID/:unitID/:subjectID' element={<Chapter />} />
        <Route path='/addQuestion/:questionTypeName/:chapterName/:chapterID/:questionTypeID/:unitID/:subjectID/:questionNum' element={<AddQuestion />} />
        <Route path='/updateQuestion/:questionTypeName/:questionID/:questionTypeID/:unitID/:subjectID' element={<UpdateQuestion />} />
        <Route path='/school' element={<School />} />
        <Route path='/users' element={<Users />} />
        <Route path='/aiGenerate/:questionTypeName/:chapterName/:chapterID/:questionTypeID/:unitID/:subjectID' element={<AiGenerate />} />
      </Routes>
    </>
  );
}

export default App;
