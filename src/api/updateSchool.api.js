const URL = 'https://abacus-2ntk.onrender.com/school/updateSchool'

const updateSchool = (data, schoolID, setserverOperationError, setServerOperationLoading, setAllSchools) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${schoolID}`, {
        method: 'put',
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
                document.querySelector('.update-school-popup').classList.replace('d-flex', 'd-none');
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

export default updateSchool;