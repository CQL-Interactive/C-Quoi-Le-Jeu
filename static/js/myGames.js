

document.addEventListener('DOMContentLoaded', async () => {
    fetch('/api/user/games')
    .then(res => res.json())
    .then(res => {
        if (!res.ok) {
            notify.error('Erreur interne, merci de recharger la page.')
            return;
        }

        const contaner = document.getElementById('games-history');
        contaner.innerHTML = ''

        if (res.data.length === 0) {
            contaner.innerHTML = "<div class='center'>Pas de parties jouées pour le moment</div>"
        }


        res.data.forEach(jeu => {

            const date = new Date(jeu.played_at.replace(" ", "T")); 

            const day = String(date.getDate()).padStart(2, "0");    
            const month = String(date.getMonth() + 1).padStart(2, "0"); 
            const year = String(date.getFullYear()).slice(2);      
            const hours = String(date.getHours()).padStart(2, "0"); 
            const minutes = String(date.getMinutes()).padStart(2, "0"); 
            contaner.innerHTML += `<div class='list space'><p>${day}/${month}/${year} - ${hours}h${minutes}</p><p  style="width : 70px" >${jeu.score}</p><p>${jeu.end_lives === 0 ? 'Defaite' : 'Victoire'}</p></div>`
        });
    }) 
})