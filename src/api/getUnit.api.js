const URL = 'https://backend-production-6752.up.railway.app/unit/getUnit'

const getUnit = (questionTypeID, subjectID, setAllUnit, setLoading) => {
    setLoading(true)
    fetch(`${URL}/${questionTypeID}/${subjectID}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllUnit(responseJson.allUnit)
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

export default getUnit;
