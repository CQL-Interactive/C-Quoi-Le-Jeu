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
            searchGames()
            fetch('/api/game/current')
            .then(res => res.json())
            .then(current => {
                reloadImage('img_current')
                .then(() => {
                    updateGameUI(e, res, current, settings)
                })
                .catch(() => {
                    updateGameUI(e, res, current, settings)
                })
            })
            .catch(err => {
                console.error("Erreur lors du chargement du jeu :", err)
                if (e) {
                    e.submitter.classList.remove('loadingBtn')
                    e.submitter.disabled = false;
                }
                notify.error("Erreur lors du chargement du jeu")
            })
        } else {
            notify.error(settings.message)
            if (e) {
                e.submitter.classList.remove('loadingBtn')
                e.submitter.disabled = false;
            }
        }
    })
    .catch(err => {
        console.error("Erreur lors de la récupération des paramètres :", err)
        if (e) {
            e.submitter.classList.remove('loadingBtn')
            e.submitter.disabled = false;
        }
        notify.error("Erreur serveur")
    })
}

function updateGameUI(e, res, current, settings) {
    const gameNameInput = document.getElementById('game_name')
    const vieDiv = document.getElementById('vie')
    const nbQuestionDiv = document.getElementById('nbQuestion')
    const nbScoreDiv = document.getElementById('nbScore')
    const loaderDiv = document.getElementById('loader')

    if (!gameNameInput || !vieDiv || !nbQuestionDiv || !nbScoreDiv) {
        console.error("Éléments HTML manquants")
        return;
    }

    gameNameInput.value = ""
    searchGames()
    gameNameInput.readOnly = false
    gameNameInput.focus()
    vieDiv.innerHTML = ""
    
    for (let index = 0; index < current.lives; index++) {
        vieDiv.innerHTML += `<img class='icon' src='/img/vie.png'>`
    }
    for (let index = 0; index < settings.data.lives - current.lives; index++) {
        vieDiv.innerHTML += `<img class='icon' src='/img/vieVide.png'>`
    }
    
    nbQuestionDiv.innerHTML = `Jeu ${current.question}/${settings.data.nbGames}`
    nbScoreDiv.innerHTML = `Score ${current.score}`
    
    if (e) {
        e.submitter.classList.remove('loadingBtn')
        e.submitter.disabled = false;
    }
    if (res) {
        notify.info(res.message)
    }
    if (loaderDiv) {
        loaderDiv.style.display = 'none'
    }
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
    .catch(err => {
        console.error("Erreur lors de la vérification :", err)
        notify.error("Erreur lors de la vérification")
        e.submitter.classList.remove('loadingBtn')
        e.submitter.disabled = false
        document.getElementById('game_name').readOnly = false
    })
})

let prop = "" 

function searchGames() {
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

document.getElementById('game_name').addEventListener('input', searchGames)