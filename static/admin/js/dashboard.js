document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/admin/stats')
    .then(res => res.json())
    .then(res => {
        if (!res.err) {
            document.getElementById('nb_users').innerHTML = res.data.users.count
            document.getElementById('nb_games').innerHTML = res.data.games.count
            document.getElementById('nb_party').innerHTML = res.data.party.count
        }
    })
})