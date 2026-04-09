const URL = 'https://abacus-2ntk.onrender.com/chapter/updateChapter/'

const updateChapter = (data, chapterID, setserverOperationError, setServerOperationLoading, setChapterDetails) => {
    setServerOperationLoading(true)
    fetch(`${URL}${chapterID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })

        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                document.querySelector('.update-chapter-popup').classList.replace('d-flex', 'd-none');
                setServerOperationLoading(false)
                setserverOperationError(null)
                setChapterDetails(responseJson.chapter)
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

export default updateChapter;