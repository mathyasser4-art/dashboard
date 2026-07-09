const URL = 'https://sat-backend-production.up.railway.app/system/deleteSystem';
const Token = localStorage.getItem('O_authDB');

const deleteSystem = (systemID, setserverOperationError, setServerOperationLoading, setAllSystem) => {
    setServerOperationLoading(true);
    fetch(`${URL}/${systemID}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `pracYas09${Token}`
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
