const URL = 'https://abacus-2ntk.onrender.com/question/addQuestion'
const Token = localStorage.getItem('O_authDB')

const addQuestion = (data, setserverOperationError, setServerOperationLoading, setQuesionAdded, setQuesionID, questionType, setQuesionGraphAdded) => {
    setServerOperationLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'authrization': `pracYas09${Token}`
        },
        body: data
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                if (questionType == 'Graph Question') {
                    setQuesionGraphAdded(true)
                } else {
                    setQuesionAdded(true)
                }
                setQuesionID(responseJson.questionData._id)
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

export default addQuestion;