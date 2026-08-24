const URL = 'https://backend-production-6752.up.railway.app/organization/deleteOrganization'

const deleteOrganization = (orgID, setserverOperationError, setServerOperationLoading, setAllOrganizations) => {
    setServerOperationLoading(true)
    fetch(`${URL}/${orgID}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllOrganizations(responseJson.allOrganizations || [])
                setServerOperationLoading(false)
                setserverOperationError(null)
                const popup = document.querySelector('.delete-org-popup')
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

export default deleteOrganization
