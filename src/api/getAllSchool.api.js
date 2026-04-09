const URL = 'https://abacus-2ntk.onrender.com/school/getSchool'

const getAllSchool = (setAllSchools, setLoading) => {
    setLoading(true)
    fetch(`${URL}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllSchools(responseJson.allSchools)
                setLoading(false)
            } else {
                setLoading(false)
            }
        })
        .catch((error) => {
            console.log(error.message)
            setLoading(false)
        });
}

export default getAllSchool;