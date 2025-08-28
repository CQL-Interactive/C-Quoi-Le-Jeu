

document.getElementById('game_form').addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData();
    formData.append("imgJeu", document.getElementById('game_img').files[0]); 
    formData.append("game_name", "game_url"); 
    fetch('/api/games', {
        method: 'POST',
        body : formData
    })
    .then(res => res.json())
    .then(res => {
        console.log(res)
    })
})