const URL = 'https://abacus-2ntk.onrender.com/question/getQuestionDetails/'

const getQuestionDetails = (questionID, setQuestionDetails, setLoading, setQuestion, setAllAnswer, setQuestionPoint, setQuestionType, setMcqAnswerFs, setMcqAnswerSe, setMcqAnswerTh, setMcqAnswerFr) => {
    setLoading(true)
    fetch(`${URL}${questionID}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setQuestionDetails(responseJson.question)
                setQuestion(responseJson.question.question)
                setAllAnswer(responseJson.question.answer)
                setQuestionPoint(responseJson.question.questionPoints)
                setQuestionType(responseJson.question.typeOfAnswer)
                if (responseJson.question.typeOfAnswer == 'MCQ') {
                    const wrongAnswers = responseJson.question.wrongAnswer
                    for (let index = 0; index < wrongAnswers.length; index++) {
                        const element = wrongAnswers[index];
                        if (index == 0) {
                            setMcqAnswerFs(element)
                        } else if (index == 1) {
                            setMcqAnswerSe(element)
                        } else if (index == 2) {
                            setMcqAnswerTh(element)
                        } else {
                            setMcqAnswerFr(element)
                        }
                    }
                }
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

export default getQuestionDetails;