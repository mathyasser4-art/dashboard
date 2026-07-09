const URL = 'https://backend-production-6752.up.railway.app/system/reorderSubjects'

const reorderSubjects = (systemID, subjects, setAllSystem) => {
    fetch(`${URL}/${systemID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subjects })
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllSystem(responseJson.allSystem)
            } else {
                console.error(responseJson.message)
            }
        })
        .catch((error) => {
            console.error(error.message)
        });
}

export default reorderSubjects;
