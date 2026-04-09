const URL = 'https://abacus-2ntk.onrender.com/user/get'

const getUsers = (pageNumber, setLoading, setAllClients, setPageNumber, setTotalPage) => {
    setLoading(true)
    fetch(`${URL}?page=${pageNumber}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                console.log(responseJson.users);
                setAllClients(responseJson.users)
                setPageNumber(responseJson.page)
                setTotalPage(responseJson.totalPages)
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

export default getUsers;