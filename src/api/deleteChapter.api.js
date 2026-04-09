const URL = 'https://backend-production-6752.up.railway.app/chapter/deleteChapter/'

const deleteChapter = (chapterID, setserverOperationError, setServerOperationLoading, navigate, questionTypeID, unitID, questionTypeName, subjectID) => {
    setServerOperationLoading(true)
    fetch(`${URL}${chapterID}/${unitID}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json'
        },
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                navigate(`/unit/${questionTypeName}/${questionTypeID}/${subjectID}`)
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

export default deleteChapter;
