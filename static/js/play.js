function reloadImage(id) {
  const img = document.getElementById(id)
  const baseUrl = img.src.split('?')[0]
  img.src = `${baseUrl}?_=${Date.now()}`
}

function loadJeu() {
    fetch('/api/game/settings')
    .then(res => res.json())
    .then(settings => {
        if (settings.ok) {
            document.getElementById('vie').innerHTML = ""
            for (let index = 0; index < settings.data.lives; index++) {
                document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vie.png' >`
            }
            fetch('/api/game/current')
            .then(res => res.json())
            .then(current => {
                document.getElementById('nbQuestion').innerHTML = `Jeu ${current.question}/${settings.data.nbGames}`
                document.getElementById('nbScore').innerHTML = `Score ${current.score}`
                reloadImage('img_current')
            })
        } else {
            notify.error(settings.message)
        }
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadJeu()
})

document.getElementById('game_form').addEventListener('submit', (e) => {
    e.preventDefault()
    let pass = false
    const rep = document.getElementById('game_name').value
    if (!rep) {
        pass = true;
    }

    fetch('/api/game/verif', {
        method : "POST",
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            rep : rep,
            pass : pass
        })
    })
    .then(res => res.json())
    .then(res => {
        if (!res.ok) {
            notify.error("Une erreur est survenue !")
            return;
        }

        notify.info(res.message)
        loadJeu()
    })
})