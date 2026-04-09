const URL = 'https://backend-production-6752.up.railway.app/school/addSchool'

const addSchool = (data, setserverOperationError, setServerOperationLoading, setAllSchools) => {
    setServerOperationLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllSchools(responseJson.allSchools)
                setServerOperationLoading(false)
                setserverOperationError(null)
                document.querySelector('.add-school-popup').classList.replace('d-flex', 'd-none');
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

export default addSchool;
