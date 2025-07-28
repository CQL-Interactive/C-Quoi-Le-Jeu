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
            })
        } else {
            notify.error(settings.message)
        }
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadJeu()
})

function verif() {
    fetch('/api/game/verif')
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            reloadImage('img_current')
            loadJeu()
        } else {
            window.location.href = '/?notif=Fin de la patie'
        }
    })
}