const inputs = {
    nbGames : document.getElementById('seettings_nbGames'),
    lives : document.getElementById('settings_lives')
}

let games = []

function randomNb(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


document.addEventListener('DOMContentLoaded', () => {
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
    .then(res => {
        if (res.continue) {
            if(confirm("Une partie est en cours, voulez vous la continuer ?")) {
                window.location.href = '/solo/game'
                return;
            }
            fetch('/api/game/fin')
        }
    })

    // Ajouter l'event listener pour le mode hardcore
    const hardcoreCheckbox = document.getElementById('hardcore-mode');
    if (hardcoreCheckbox) {
        hardcoreCheckbox.addEventListener('change', toggleHardcoreMode);
    }
})

async function changeSettings() {
    inputs.nbGames.value = randomNb(5, games.length)
    inputs.lives.value = randomNb(1, 10)
}

function play() {
    const hardcoreMode = document.getElementById('hardcore-mode').checked;
    const hardcoreTimeout = hardcoreMode ? Number(document.getElementById('hardcore-timeout').value) : null;

    fetch('/api/game/settings', {
        method : "POST",
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            nbGames : Number(document.getElementById('seettings_nbGames').value),
            lives : Number(document.getElementById('settings_lives').value),
            hardcore : hardcoreMode,
            hardcoreTimeout : hardcoreTimeout
        })
    })
    .then(res => res.json())
    .then(res => {
        if(res.ok) {
            window.location.href = '/solo/game?notif=Paramètres enregistrés%info'
        } else {
            notify.error(res.message)
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

function openGameSettings() {
    document.getElementById('game-settings').style.display = 'block'
}

function closeGameSettings() {
    document.getElementById('game-settings').style.display = 'none'
}

function displayInputTemps() {
    const input = document.getElementById('temps-input');

    input.style.display = input.style.display === 'none' ? 'block' : 'none'
}

function toggleHardcoreMode() {
    const checkbox = document.getElementById('hardcore-mode');
    const timeoutSelect = document.getElementById('hardcore-timeout');

    timeoutSelect.style.display = checkbox.checked ? 'block' : 'none';
}