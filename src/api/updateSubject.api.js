const URL = 'https://abacus-2ntk.onrender.com/subject/updateSubject'

const updateSubject = (data, subjectID, setserverOperationError, setServerOperationLoading, setAllSystem) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${subjectID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.update-subject-popup').classList.replace('d-flex', 'd-none');
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

export default updateSubject;
