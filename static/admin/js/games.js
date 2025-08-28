let games = []

function displayPlayers() {
    if (games.length === 0) {
        loadPlayers()
    } else {
        document.getElementById('games').innerHTML = ``;
        games.forEach((game, index) => {
        document.getElementById('games').innerHTML += `
            <div onclick='window.location.href = "/admin/games/${index}"' class="list space">
                <p>${game.name}</p>
            </div>
        `
        })
    }
}

function loadPlayers() {
    fetch('/api/games')
    .then(res => res.json())
    .then(res => {
        games = res;
        displayPlayers()
    })
}


document.addEventListener('DOMContentLoaded', () => {
    displayPlayers()
})