const URL = 'http://localhost:8000/system/updateSystem'
const Token = localStorage.getItem('O_authDB')

const updateSystem = (data, systemID, setserverOperationError, setServerOperationLoading, setAllSystem) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${systemID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.update-system-popup').classList.replace('d-flex', 'd-none');
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

export default updateSystem;