let players = []

function deletePlayer(playerId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
        fetch(`/api/admin/users/${playerId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(res => {
            if (res.ok) {
                notify(res.msg, 'success')
                players = players.filter(p => p.id !== playerId)
                displayPlayers(JSON.parse(window.localStorage.getItem('AdminCheckUers')))
            } else {
                notify(res.msg, 'error')
            }
        })
        .catch(err => {
            console.error(err)
            notify('Erreur lors de la suppression', 'error')
        })
    }
}

function displayPlayers(showId = false) {
    if (players.length === 0) {
        loadPlayers(showId)
    } else {
        document.getElementById('users').innerHTML = ``;
        players.forEach(player => {
        document.getElementById('users').innerHTML += `
            <div class="list space">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <p>${showId ? `${player.id} - ` : ''}${player.username}</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${player.me ? '<p style="margin: 0; color: #888;">(Vous)</p>' : ''}
                        ${!player.me ? `<button onclick="deletePlayer(${player.id})" style="padding: 5px 10px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Supprimer</button>` : ''}
                    </div>
                </div>
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