const URL = 'https://backend-production-6752.up.railway.app/question/addGraphQuestion'

const addGraphQuestion = (data, quesionID, setServerGraphError, setServerGraphLoading, setQuesionAdded) => {
    setServerGraphLoading(true)
    fetch(`${URL}/${quesionID}`, {
        method: 'put',
        body: data
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setQuesionAdded(true)
                setServerGraphLoading(false)
                setServerGraphError(null)
            } else {
                setServerGraphError(responseJson.message)
                setServerGraphLoading(false)
            }
        })
        .catch((error) => {
            setServerGraphError(error.message)
            setServerGraphLoading(false)
        });
}

export default addGraphQuestion;
