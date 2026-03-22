const URL = 'https://abacus-2ntk.onrender.com/question/deleteQuestion/'
const Token = localStorage.getItem('O_authDB')

const deleteQuestion = (questionID, chapterID, setserverOperationError, setServerOperationLoading, setChapterDetails) => {
    setServerOperationLoading(true)
    fetch(`${URL}${questionID}/${chapterID}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.delete-question-popup').classList.replace('d-flex', 'd-none');
                setServerOperationLoading(false)
                setserverOperationError(null)
                setChapterDetails(responseJson.chapter)
            } else {
                setserverOperationError(responseJson.message)
                setServerOperationLoading(false)
            }
        })
        .catch((error) => {
            setserverOperationError(error.message)
            setServerOperationLoading(false)
        });
}

export default deleteQuestion;