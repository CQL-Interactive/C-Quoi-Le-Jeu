document.addEventListener('DOMContentLoaded', function() {
    let score = 0;
    let remainingAttempts = 3;
    let isQuizFinished = false;
    let errorCount = 0;
    let currentGameIndex = 0;
    let currentGameName = "";
    let full_games_list = [];
    let gameId = null;

    function loadGame() {
        fetch('/get-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gameId: gameId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.name === "Finished") {
                    alert("Bravo, tous les jeux ont été trouvés !");
                    document.getElementById('game-image').src = '';
                    document.getElementById('return-home-button').style.display = 'block';
                    document.getElementById('game-image-container').style.justifyContent = 'center';
                    isQuizFinished = true;
                } else {
                    document.getElementById('game-image').src = `/static/${data.image}`;
                    document.getElementById('game-image-container').style.justifyContent = 'flex-start';
                    document.getElementById('game-name-input').value = '';
                    document.getElementById('feedback').innerText = '';
                    remainingAttempts = 3;
                    errorCount = 0;
                    currentGameName = data.name;
                    updateScoreDisplay();
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function loadGamesList() {
        fetch('/get-games-list')
            .then(response => response.json())
            .then(data => {
                full_games_list = data;
            })
            .catch(error => console.error('Error:', error));
    }

    document.getElementById('start-button').addEventListener('click', function() {
        const gameCount = document.getElementById('game-count').value;
        loadGamesList();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('game-page').style.display = 'flex';
        document.getElementById('return-home-button').style.display = 'none';
        isQuizFinished = false;
        errorCount = 0;
        score = 0;
        currentGameIndex = 0;

        fetch('/creat_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ count: gameCount })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    gameId = data.game_id;
                    loadGame();
                } else {
                    alert("Erreur lors de la création du jeu. Veuillez réessayer.");
                }
            })
            .catch(error => console.error('Error:', error));
    });

    document.getElementById('submit-button').addEventListener('click', checkGameName);
    document.getElementById('game-name-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            checkGameName();
        }
    });

    document.getElementById('return-home-button').addEventListener('click', function() {
        fetch('/reset-game', { method: 'POST' })
            .then(() => {
                document.getElementById('game-page').style.display = 'none';
                document.getElementById('home-page').style.display = 'flex';
                isQuizFinished = false;
                errorCount = 0;
                score = 0;
                currentGameIndex = 0;
                loadGame();
            })
            .catch(error => console.error('Error:', error));
    });

    document.getElementById('skip-button').addEventListener('click', function() {
        if (!isQuizFinished) {
            if (score >= 50) {
                score -= 50;
            } else {
                score = 0;
            }
            updateScoreDisplay();
            document.getElementById('feedback').innerText = 'Plus d\'essais ! La réponse était ' + currentGameName + '.';
            setTimeout(function() {
                fetch('/skip-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameId: gameId })
                })
                    .then(response => response.json())
                    .then(nextGameData => {
                        if (nextGameData.name === "Finished") {
                            alert("Bravo, tous les jeux ont été trouvés !");
                            document.getElementById('game-image').src = '';
                            document.getElementById('return-home-button').style.display = 'block';
                            document.getElementById('game-image-container').style.justifyContent = 'center';
                            isQuizFinished = true;
                        } else {
                            document.getElementById('game-image').src = `/static/${nextGameData.image}`;
                            document.getElementById('game-name-input').value = '';
                            document.getElementById('feedback').innerText = '';
                            remainingAttempts = 3;
                            errorCount = 0;
                            currentGameName = nextGameData.name;
                            updateScoreDisplay();
                        }
                    })
                    .catch(error => console.error('Error:', error));
            }, 2000);
        }
    });

    function updateScoreDisplay() {
        document.getElementById('score').innerText = score;
        document.getElementById('remaining-attempts').innerText = remainingAttempts;
    }

    function checkGameName() {
        if (isQuizFinished) {
            return;
        }

        const userAnswer = document.getElementById('game-name-input').value.trim();
        const feedbackElement = document.getElementById('feedback');

        if (remainingAttempts > 0) {
            fetch('/check-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: userAnswer, gameId: gameId })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.is_correct) {
                        feedbackElement.innerText = "Correct !";
                        score += 100;
                        updateScoreDisplay();
                        document.getElementById('game-image').classList.add('correct-answer');
                        setTimeout(function() {
                            document.getElementById('game-image').classList.remove('correct-answer');
                            fetch('/next-game', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ gameId: gameId })
                            })
                                .then(response => response.json())
                                .then(nextGameData => {
                                    if (nextGameData.name === "Finished") {
                                        alert("Bravo, tous les jeux ont été trouvés !");
                                        document.getElementById('game-image').src = '';
                                        document.getElementById('return-home-button').style.display = 'block';
                                        document.getElementById('game-image-container').style.justifyContent = 'center';
                                        document.getElementById('game-image').src = '/static/' + nextGameData.image;
                                        isQuizFinished = true;
                                    } else {
                                        document.getElementById('game-image').src = `/static/${nextGameData.image}`;
                                        document.getElementById('game-name-input').value = '';
                                        feedbackElement.innerText = '';
                                        remainingAttempts = 3;
                                        errorCount = 0;
                                        currentGameName = nextGameData.name;
                                        updateScoreDisplay();
                                    }
                                })
                                .catch(error => console.error('Error:', error));
                        }, 1000);
                    } else {
                        feedbackElement.innerText = "Faux, essayez encore !";
                        errorCount += 1;
                        if (errorCount === 3) {
                            score -= 50;
                            errorCount = 0;
                            remainingAttempts = 0;
                            feedbackElement.innerText = 'Plus d\'essais ! La réponse était "' + currentGameName + '".';
                            setTimeout(function() {
                                fetch('/next-game', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ gameId: gameId })
                                })
                                    .then(response => response.json())
                                    .then(nextGameData => {
                                        if (nextGameData.name === "Finished") {
                                            alert("Bravo, tous les jeux ont été trouvés !");
                                            document.getElementById('game-image').src = '';
                                            document.getElementById('return-home-button').style.display = 'block';
                                            document.getElementById('game-image-container').style.justifyContent = 'center';
                                            isQuizFinished = true;
                                        } else {
                                            document.getElementById('game-image').src = `/static/${nextGameData.image}`;
                                            document.getElementById('game-name-input').value = '';
                                            feedbackElement.innerText = '';
                                            remainingAttempts = 3;
                                            errorCount = 0;
                                            currentGameName = nextGameData.name;
                                            updateScoreDisplay();
                                        }
                                    })
                                    .catch(error => console.error('Error:', error));
                            }, 2000);
                        } else {
                            remainingAttempts -= 1;
                            updateScoreDisplay();
                            document.getElementById('game-image').classList.add('wrong-answer');
                            setTimeout(function() {
                                document.getElementById('game-image').classList.remove('wrong-answer');
                            }, 1000);
                            document.getElementById('game-name-input').value = '';
                            setTimeout(function() {
                                feedbackElement.innerText = '';
                            }, 1500);
                        }
                    }
                })
                .catch(error => console.error('Error:', error));
        } else {
            feedbackElement.innerText = 'Plus d\'essais ! La réponse était "' + currentGameName + '".';
            document.getElementById('game-image').classList.add('wrong-answer');
            setTimeout(function() {
                document.getElementById('game-image').classList.remove('wrong-answer');
                fetch('/next-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameId: gameId })
                })
                    .then(response => response.json())
                    .then(nextGameData => {
                        if (nextGameData.name === "Finished") {
                            alert("Bravo, tous les jeux ont été trouvés !");
                            document.getElementById('game-image').src = '';
                            document.getElementById('return-home-button').style.display = 'block';
                            document.getElementById('game-image-container').style.justifyContent = 'center';
                            isQuizFinished = true;
                        } else {
                            document.getElementById('game-image').src = `/static/${nextGameData.image}`;
                            document.getElementById('game-name-input').value = '';
                            feedbackElement.innerText = '';
                            remainingAttempts = 3;
                            errorCount = 0;
                            currentGameName = nextGameData.name;
                            updateScoreDisplay();
                        }
                    })
                    .catch(error => console.error('Error:', error));
            }, 2000);
        }
    }

    document.getElementById('game-name-input').addEventListener('input', function() {
        const input = this.value.toLowerCase();
        const suggestionsContainer = document.getElementById('suggestions-container');
        suggestionsContainer.innerHTML = '';

        if (input.length > 0) {
            const filteredGames = full_games_list.filter(game =>
                game.name.toLowerCase().includes(input) ||
                game.answers.some(answer => answer.toLowerCase().includes(input))
            );

            if (filteredGames.length > 0) {
                filteredGames.forEach(game => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = game.name;
                    suggestionItem.addEventListener('click', function() {
                        document.getElementById('game-name-input').value = game.name;
                        suggestionsContainer.style.display = 'none';
                    });
                    suggestionsContainer.appendChild(suggestionItem);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', function(event) {
        const suggestionsContainer = document.getElementById('suggestions-container');
        if (!event.target.closest('#game-name-input') && !event.target.closest('#suggestions-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
});
