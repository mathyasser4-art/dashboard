const URL = 'https://backend-production-6752.up.railway.app/chapter/reorderQuestions/'

const reorderChapter = (chapterID, questionIDs) => {
    return fetch(`${URL}${chapterID}`, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionIDs })
    })
        .then(res => res.json())
        .catch(err => console.error('Failed to save order:', err))
}

export default reorderChapter
