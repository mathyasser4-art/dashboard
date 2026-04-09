const URL = 'https://backend-production-6752.up.railway.app/chapter/getChapterQuestion/'

const getChapter = (chapterID, setChapterDetails, setLoading) => {
    setLoading(true)
    fetch(`${URL}${chapterID}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setChapterDetails(responseJson.chapter)
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

export default getChapter;
