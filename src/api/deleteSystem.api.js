const URL = 'https://backend-production-6752.up.railway.app/system/deleteSystem';

const deleteSystem = (systemID, setserverOperationError, setServerOperationLoading, setAllSystem) => {
    setServerOperationLoading(true);
    fetch(`${URL}/${systemID}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message === 'success') {
            document.querySelector('.delete-system-popup').classList.replace('d-flex', 'd-none');
            setServerOperationLoading(false);
            setserverOperationError(null);
            setAllSystem(responseJson.allSystem);
        } else {
            setserverOperationError(responseJson.message);
            setServerOperationLoading(false);
        }
    })
    .catch((error) => {
        setserverOperationError(error.message);
        setServerOperationLoading(false);
    });
};

export default deleteSystem;
