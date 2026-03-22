const URL = 'https://abacus-2ntk.onrender.com/question/updateQuestion/'
const Token = localStorage.getItem('O_authDB')

const updateQuestion = (data, questionID, setserverOperationError, setServerOperationLoading, setQuesionAdded) => {
    setServerOperationLoading(true)
    fetch(`${URL}${questionID}`, {
        method: 'put',
        headers: {
            'authrization': `pracYas09${Token}`
        }, 
        body: data
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setQuesionAdded(true)
                setServerOperationLoading(false)
                setserverOperationError(null)
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

export default updateQuestion;