const URL = 'https://backend-production-6752.up.railway.app/organization/getOrganizations'

const getAllOrganizations = (setAllOrganizations, setLoading) => {
    if (setLoading) setLoading(true)
    fetch(`${URL}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllOrganizations(responseJson.allOrganizations || [])
            }
            if (setLoading) setLoading(false)
        })
        .catch((error) => {
            console.error('Error fetching organizations:', error.message)
            if (setLoading) setLoading(false)
        });
}

export default getAllOrganizations
