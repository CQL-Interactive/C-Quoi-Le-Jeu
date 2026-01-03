let players = []

function displayPlayers(showId = false) {
    if (players.length === 0) {
        loadPlayers(showId)
    } else {
        document.getElementById('users').innerHTML = ``;
        players.forEach(player => {
        document.getElementById('users').innerHTML += `
            <div class="list space" onclick="window.location.href = '/admin/users/${player.id}'">
                <p>${showId ? `${player.id} - ` : ''}${player.username}</p>
                ${player.me ? '<p>(Vous)</p>' : ''}
            </div>
        `
        })
    }
}

function loadPlayers(showId = false) {
    fetch('/api/admin/users')
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            players = res.data;
            displayPlayers(showId)
        }
    })
}

document.getElementById('showId').addEventListener('change', (e) => {
    window.localStorage.setItem('AdminCheckUers', JSON.stringify(e.target.checked))
    displayPlayers(e.target.checked)
})

document.addEventListener('DOMContentLoaded', () => {
    if (!window.localStorage.getItem('AdminCheckUers')) {
        window.localStorage.setItem('AdminCheckUers', "false")
    }
    document.getElementById('showId').checked = JSON.parse(window.localStorage.getItem('AdminCheckUers'))
    displayPlayers(JSON.parse(window.localStorage.getItem('AdminCheckUers')))
})