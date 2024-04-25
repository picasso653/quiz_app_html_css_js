const question = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName("choice-text"));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const timerText = document.getElementById('timer');

const loader = document.getElementById('loader')
const game = document.getElementById('game');

let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];
let timer;
let timePerQuestion = 10; // Initial time per question in seconds

let questions = [];

const CORRECT_BONUS = 10;
let maxQuestions = localStorage.getItem("numberOfQuestions");
const MAX_QUESTIONS = maxQuestions ? parseInt(maxQuestions) : 3;
let difficulty = localStorage.getItem("difficulty") || 'easy';
let category = localStorage.getItem("category") || 'any';

console.log('Max Questions:', MAX_QUESTIONS);
console.log('Difficulty:', difficulty);
console.log('Category:', category);

startGame = () =>{
    questionCounter = 0;
    score = 0;
    availableQuestions = [];

    console.log('Fetching questions...');
    fetch(`https://opentdb.com/api.php?amount=${MAX_QUESTIONS}&category=${category}&difficulty=${difficulty}&type=multiple`)
        .then(res => {
            console.log('Received response:', res);
            return res.json();
        })
        .then(loadedQuestions => {
            console.log('Loaded questions:', loadedQuestions);
            questions = loadedQuestions.results.map(loadedQuestion => {
                const formattedQuestion = {
                    question: loadedQuestion.question
                };

                const answerChoices = [...loadedQuestion.incorrect_answers];
                formattedQuestion.answer = Math.floor(Math.random() * 3) + 1;
                answerChoices.splice(
                    formattedQuestion.answer - 1,
                    0,
                    loadedQuestion.correct_answer
                );

                answerChoices.forEach((choice, index) =>{
                    formattedQuestion["choice" + (index +1)] = choice;
                });
                return formattedQuestion;
            });

            console.log('Questions:', questions);

            availableQuestions = [...questions]; // Populate availableQuestions array

            game.classList.remove("hidden");
            loader.classList.add("hidden");

            getNewQuestion();
            startTimer();
        })
        .catch(err => {
            console.error('Error loading questions:', err);
        });
};

startTimer = () => {
    timerText.innerText = timePerQuestion;
    timer = setInterval(() => {
        timePerQuestion--;
        timerText.innerText = timePerQuestion;
        if (timePerQuestion === 0) {
            clearInterval(timer);
            getNewQuestion();
            startTimer();
        }
    }, 1000);
}

getNewQuestion = () =>{
    if(availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS){
        clearInterval(timer);
        localStorage.setItem("mostRecentScore", score);
        return window.location.assign('end.html');
    }

    timePerQuestion = 10; // Reset time per question
    timerText.innerText = timePerQuestion;

    questionCounter++;
    progressText.innerText = ` Question ${questionCounter}/${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerHTML = currentQuestion.question;

    choices.forEach(choice =>{
        const number = choice.dataset['number'];
        choice.innerHTML = currentQuestion['choice' + number];
        choice.parentElement.classList.remove('correct', 'incorrect');
    });

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
};

choices.forEach(choice =>{
    choice.addEventListener('click', e => {
        if(!acceptingAnswers) return;

        acceptingAnswers = false;
        clearInterval(timer);

        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset['number'];

        const classToApply = selectedAnswer == currentQuestion.answer ? 'correct' : 'incorrect';

        if(classToApply === 'correct'){
            incrementScore(CORRECT_BONUS);
        } else {
            const correctChoice = choices.find(choice => choice.dataset['number'] == currentQuestion.answer);
            correctChoice.parentElement.classList.add('correct');
        }

        selectedChoice.parentElement.classList.add(classToApply);

        setTimeout(() =>{
            getNewQuestion();
            startTimer();
        },2000);
    });
});

incrementScore = num => {
    score += num;
    scoreText.innerText = score;
}

startGame();
