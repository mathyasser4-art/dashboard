const URL = 'https://abacus-2ntk.onrender.com/question/updateAnswerPic/'
const Token = localStorage.getItem('O_authDB')

const addAnswerPic = (data, quesionID, setserverOperationError, setServerLoadingPic, setQuesionFullAdded, endPoint, navigate, chapterID, questionTypeID, unitID, questionTypeName, subjectID) => {
    setServerLoadingPic(true)
    fetch(`${URL}${quesionID}`, {
        method: 'put',
        headers: {
            'authrization': `pracYas09${Token}`
        }, 
        body: data
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setServerLoadingPic(false)
                setserverOperationError(null)
                if (endPoint == 'add') {
                    setQuesionFullAdded(true)
                } else {
                    navigate(`/chapter/${questionTypeName}/${chapterID}/${questionTypeID}/${unitID}/${subjectID}`)
                }
            } else {
                setserverOperationError(responseJson.message)
                setServerLoadingPic(false)
            }
        })
        .catch((error) => {
            setserverOperationError(error.message)
            setServerLoadingPic(false)
        });
}

export default addAnswerPic;