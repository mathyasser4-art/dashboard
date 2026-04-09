const URL = 'https://backend-production-6752.up.railway.app/question/updateAutoCorrect/'

const updateAutoCorrect = (questionID, setserverOperationError, setAutoCorrectLoading, setQuestionDetails) => {
    setAutoCorrectLoading(true)
    fetch(`${URL}${questionID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
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
