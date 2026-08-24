const URL = 'https://backend-production-6752.up.railway.app/organization/addOrganization'

const addOrganization = (data, setserverOperationError, setServerOperationLoading, setAllOrganizations) => {
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
                setAllOrganizations(responseJson.allOrganizations || [])
                setServerOperationLoading(false)
                setserverOperationError(null)
                const popup = document.querySelector('.add-org-popup')
                if (popup) popup.classList.replace('d-flex', 'd-none')
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

export default addOrganization
