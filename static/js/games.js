function loadGames(nb) {
    fetch('/api/games')
    .then(res => res.json())
    .then(data => {
        let html = ""
        data.forEach(jeu => {
            html += `<div class="row"><p>${jeu.name}</p></div>` 
        });

        document.getElementById('games').innerHTML = html
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadGames()
})