function reloadImage(id) {
    return new Promise((resolve, reject) => {
        const img = document.getElementById(id);
        if (!img) return reject(new Error("Image non trouvée"));

        const baseUrl = img.src.split('?')[0];

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = tempImg.src;
            resolve();
        };
        tempImg.onerror = reject; 
        tempImg.src = `${baseUrl}?_=${Date.now()}`; 
    });
}
function loadJeu(e, res) {
    fetch('/api/game/settings')
    .then(res => res.json())
    .then(settings => {
        if (settings.ok) {
            serchGames()
            fetch('/api/game/current')
            .then(res => res.json())
            .then(current => {
                reloadImage('img_current')
                .then(() => {
                    document.getElementById('game_name').value = ""
                    serchGames()
                    document.getElementById('game_name').readOnly  = false;
                    document.getElementById('game_name').focus() 
                    document.getElementById('vie').innerHTML = ""
                    for (let index = 0; index < current.lives; index++) {
                        document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vie.png' >`
                    }
                    for (let index = 0; index < settings.data.lives - current.lives; index++) {
                        document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vieVide.png' >`
                    }
                    document.getElementById('nbQuestion').innerHTML = `Jeu ${current.question}/${settings.data.nbGames}`
                    document.getElementById('nbScore').innerHTML = `Score ${current.score}`
                    if (e) {
                        e.submitter.classList.remove('loadingBtn')
                        e.submitter.disabled = false;
                    }
                    if (res) {
                        notify.info(res.message)
                    }
                    setTimeout(() => {
                        document.getElementById('loader').style.display = 'none'
                    }, 1000)
                })
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
    e.submitter.classList.add('loadingBtn')
    e.submitter.disabled = true
    document.getElementById('game_name').readOnly  = true
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
            window.location.href = '/solo/game/stats?notif=Fin de la partie. Vous avez perdu.'
            return;
        }

        if (res.win) {
            window.location.href = '/solo/game/stats?notif=Fin de la partie. Vous avez gagné.'
            return;
        }
        
        if (!res.ok) {
            notify.error("Une erreur est survenue !")
            window.location.reload()
            return;
        }

        setTimeout(() => {
            loadJeu(e, res)
        }, 200)
    })
})

let prop = "" 

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
        prop = res[0].name
        res.forEach(jeux => {
            document.getElementById('propositions').innerHTML += `<div class='list' onclick="rep('${jeux.name}')" ><p>${jeux.name}</p></div>`
        });
    })
}

function rep(value) {
    document.getElementById('game_name').value = value
    document.getElementById('propositions').style.display = 'none'
} 

document.addEventListener('keydown', (e) => {
    if (e.key === "Tab" && document.getElementById('propositions').style.display === 'block') {
        e.preventDefault()
        rep(prop)
    }
})