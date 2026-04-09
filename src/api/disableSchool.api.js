const URL = 'https://backend-production-6752.up.railway.app/school/disableSchool'

const disableSchool = (schoolID, setAllSchools) => {
    fetch(`${URL}/${schoolID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllSchools(responseJson.allSchools)
            } else {
                console.log(responseJson.message)
            }
        })
        .catch((error) => {
            console.log(error.message)
        });
}

export default disableSchool;
