const URL = 'https://abacus-2ntk.onrender.com/unit/updateUnit'

const updateUnit = (data, questionTypeID, unitID, subjectID, setserverOperationError, setServerOperationLoading, setAllUnit) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${questionTypeID}/${unitID}/${subjectID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.update-unit-popup').classList.replace('d-flex', 'd-none');
                setServerOperationLoading(false)
                setserverOperationError(null)
                setAllUnit(responseJson.allUnit)
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

export default updateUnit;
