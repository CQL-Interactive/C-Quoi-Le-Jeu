function loadGames(nb) {
    fetch('/api/games')
    .then(res => res.json())
    .then(data => {
        let html = ""
        data.forEach(jeu => {
            if (jeu.link) {
                html += `<div class="row"><p onclick="window.open('${jeu.link}')" >${jeu.name}</p></div>` 
            } else {
                html += `<div class="row"><p onclick="notify.info(\`Le jeu n'a pas de site web\`, 1000)" >${jeu.name}</p></div>` 
            }

           
        });


        document.getElementById('games').innerHTML = html
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadGames()
})