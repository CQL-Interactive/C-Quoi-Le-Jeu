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
            document.getElementById('game_name').value = ""
            serchGames()
            fetch('/api/game/current')
            .then(res => res.json())
            .then(current => {
                document.getElementById('vie').innerHTML = ""
                for (let index = 0; index < current.lives; index++) {
                    document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vie.png' >`
                }
                for (let index = 0; index < settings.data.lives - current.lives; index++) {
                    document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vieVide.png' >`
                }
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
    if (rep.length === 0) {
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
        if (res.perdu) {
            window.location.href = '/?notif=Fin de la partie. Vous avez perdu.'
            return;
        }

        if (res.win) {
            window.location.href = '/?notif=Fin de la partie. Vous avez gagné.'
        }
        
        if (!res.ok) {
            notify.error("Une erreur est survenue !")
            window.location.reload()
            return;
        }

        notify.info(res.message)
        loadJeu()
    })
})

function serchGames() {
    const query = document.getElementById('game_name').value;

    if (query.length === 0) {
        document.getElementById('propositions').style.display = 'none'
        return;
    } else {
        document.getElementById('propositions').style.display = 'block'
    }

    fetch(`/api/game/searchGames?query=${query}`)
    .then(res => res.json())
    .then(res => {
        document.getElementById('propositions').innerHTML = ''
        if (!res || res.length === 0) {
            document.getElementById('propositions').style.display = 'none'
            return;
        }
        res.forEach(jeux => {
            document.getElementById('propositions').innerHTML += `<div class='list' onclick="rep('${jeux.name}')" ><p>${jeux.name}</p></div>`
        });
    })
}

function rep(value) {
    document.getElementById('game_name').value = value
    serchGames()
} 