const URL = 'https://abacus-2ntk.onrender.com/school/addSchool'
const Token = localStorage.getItem('O_authDB')

const addSchool = (data, setserverOperationError, setServerOperationLoading, setAllSchools) => {
    setServerOperationLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
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