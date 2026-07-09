const URL = 'https://backend-production-6752.up.railway.app/subject/deleteSubject'

const deleteSubject = (subjectID, setserverOperationError, setServerOperationLoading, setAllSystem) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${subjectID}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.delete-subject-popup').classList.replace('d-flex', 'd-none');
                setServerOperationLoading(false)
                setserverOperationError(null)
                setAllSystem(responseJson.allSystem)
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

export default deleteSubject;
