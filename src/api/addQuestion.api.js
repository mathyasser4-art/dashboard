const URL = 'https://backend-production-6752.up.railway.app/question/addQuestion'
const addQuestion = (data, setserverOperationError, setServerOperationLoading, setQuesionAdded, setQuesionID, questionType, setQuesionGraphAdded) => {
    setServerOperationLoading(true)
    fetch(`${URL}`, {
        method: 'post',
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
