const BASE_URL = 'https://backend-production-6752.up.railway.app/question/addQuestion'

/**
 * Saves a single AI-generated question to the database.
 * Returns a Promise that resolves with the response JSON.
 * @param {Object} questionData - The question object from AI
 * @param {string} chapterID - The chapter to add the question to
 */
const saveAiQuestion = (questionData, chapterID) => {
    const data = new FormData()

    // Handle Abacus Grid format
    let finalQuestion = questionData.question;
    if (questionData.gridRows) {
        finalQuestion = JSON.stringify(questionData.gridRows);
    }

    data.append('question', finalQuestion)
    data.append('questionPoints', questionData.questionPoints || 2)
    data.append('chapter', chapterID)
    data.append('index', 'last')

    if (questionData.type === 'MCQ') {
        data.append('typeOfAnswer', 'MCQ')
        const correct = questionData.correctAnswer || (Array.isArray(questionData.answer) ? questionData.answer[0] : '');
        data.append('correctAnswer', correct)
        data.append('autoCorrect', true)
        if (Array.isArray(questionData.wrongAnswer)) {
            questionData.wrongAnswer.forEach(w => data.append('wrongAnswer', w))
        }
    } else {
        // Essay
        if (Array.isArray(questionData.answer)) {
            questionData.answer.forEach(a => data.append('answer', a))
        }
    }

    return fetch(BASE_URL, {
        method: 'post',
        body: data
    }).then(res => res.json())
}

export default saveAiQuestion
