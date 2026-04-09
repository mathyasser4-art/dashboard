const URL = 'https://abacus-2ntk.onrender.com/question/updateAutoCorrect/'
const Token = localStorage.getItem('O_authDB')

const updateAutoCorrect = (questionID, setserverOperationError, setAutoCorrectLoading, setQuestionDetails) => {
    setAutoCorrectLoading(true)
    fetch(`${URL}${questionID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        }
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setQuestionDetails(responseJson.question)
                setAutoCorrectLoading(false)
                setserverOperationError(null)
            } else {
                setserverOperationError(responseJson.message)
                setAutoCorrectLoading(false)
            }
        })
        .catch((error) => {
            setserverOperationError(error.message)
            setAutoCorrectLoading(false)
        });
}

export default updateAutoCorrect;