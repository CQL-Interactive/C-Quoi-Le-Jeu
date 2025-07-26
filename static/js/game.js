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