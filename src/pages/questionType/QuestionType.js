import React from 'react';
import { Link } from 'react-router-dom';
import '../../reusable.css'
import './QuestionType.css'

const QuestionType = () => {
    const allQuestionType = [
        {
            _id: "65a4963482dbaac16d820fc6",
            typeOfquestion: "Topic Questions",
        },
        {
            _id: "65a4964b82dbaac16d820fc8",
            typeOfquestion: "Past Papers",
        },
    ]
    return (
        <div className='h-100vh d-flex justify-content-center align-items-center'>
            <div className='question-type-container d-flex justify-content-center align-items-center flex-direction-column'>
                {allQuestionType.map(item => {
                    return (
                        <Link key={item._id} to={`/subject/${item.typeOfquestion}/${item._id}`}><button className='button'>{item.typeOfquestion}</button></Link>
                    )
                })}
            </div>
        </div>
    );
}

export default QuestionType;
