const inputs = {
    nbGames : document.getElementById('seettings_nbGames'),
    lives : document.getElementById('settings_lives')
}

let games = []

function randomNb(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


document.addEventListener('DOMContentLoaded', async () => {
    const infos = await (await fetch('/api/user/patch')).json()
    
    const vers = await (await fetch('/version')).json()
    
    if(infos) {
        document.body.insertAdjacentHTML('beforeend', vers.patch)
    }

    fetch('/api/game/settings')
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            inputs.nbGames.value = res.data.nbGames
            inputs.lives.value = res.data.lives
        }
    })
    fetch('/api/games')
    .then(res => res.json())
    .then(res => {
        games = res
        inputs.nbGames.placeholder = `Nombre de jeux (max ${res.length})`
    })
    fetch('/api/game/current')
    .then(res => res.json())
    .then(async res => {
        if (res.continue) {
            const result = await notify.confirm("Une partie est en cours, voulez vous la continuer ?")
            if(result) {
                window.location.href = '/solo/game'
                return;
            } 
            fetch('/api/game/fin')
        }
    })
})

async function changeSettings() {
    inputs.nbGames.value = randomNb(5, games.length)
    inputs.lives.value = randomNb(1, 10)
}

async function play() {
    document.getElementById('play_btn').classList.add('loadingBtn')
    const user = await fetch('/api/user').then(res => res.json())
    if (!user.username) {
        window.location.href = '/login?notif=Merci de vous connecter pour jouer'
        return;
    }
    fetch('/api/game/settings', {
        method : "POST",
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            nbGames : Number(document.getElementById('seettings_nbGames').value),
            lives : Number(document.getElementById('settings_lives').value)
        })
    })
    .then(res => res.json())
    .then(res => {
        if(res.ok) {
            window.location.href = '/solo/game?notif=Paramètres enregistrés%info'
        } else {
            notify.error(res.message)
            document.getElementById('play_btn').classList.remove('loadingBtn')
        }
    })
}

document.querySelector('.new-game').addEventListener('mouseenter', () => {
    document.querySelector('.fen-new-game').classList.add('overed');
    document.querySelector('.new-game').classList.add('overed');
})

document.querySelector('.new-game-infos').addEventListener('mouseenter', () => {
    document.querySelector('.fen-new-game').classList.add('overed');
    document.querySelector('.new-game').classList.add('overed');
})

document.querySelector('.new-game-infos').addEventListener('mouseleave', () => {
    document.querySelector('.fen-new-game').classList.remove('overed');
    document.querySelector('.new-game').classList.remove('overed');
})

document.querySelector('.new-game').addEventListener('mouseleave', () => {
    document.querySelector('.fen-new-game').classList.remove('overed');
    document.querySelector('.new-game').classList.remove('overed');
})

async function openGameSettings() {
    const user = await fetch('/api/user').then(res => res.json())

    if (user.username) {
        document.getElementById('game-settings').style.display = 'block'
    } else {
        window.location.href = "/login?notif=Connectez vous pour jouer."
    }
}

function closeGameSettings() {
    document.getElementById('game-settings').style.display = 'none'
}

function displayInputTemps() {
    const input = document.getElementById('temps-input');

    input.style.display = input.style.display === 'none' ? 'block' : 'none'
}