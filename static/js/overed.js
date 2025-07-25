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