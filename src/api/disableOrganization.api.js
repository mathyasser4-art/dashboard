const URL = 'https://backend-production-6752.up.railway.app/organization/disableOrganization'

const disableOrganization = (orgID, setAllOrganizations) => {
    fetch(`${URL}/${orgID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllOrganizations(responseJson.allOrganizations || [])
            }
        })
        .catch((error) => {
            console.error('Error toggling organization status:', error.message)
        });
}

export default disableOrganization
