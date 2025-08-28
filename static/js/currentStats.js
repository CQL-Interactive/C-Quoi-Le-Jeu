function getDuree(timestampDebut, timestampFin) {
    const dureeMs = timestampFin - timestampDebut;

    let secondes = Math.floor(dureeMs / 1000) % 60;
    let minutes = Math.floor(dureeMs / (1000 * 60)) % 60;
    let heures = Math.floor(dureeMs / (1000 * 60 * 60));
 
    if (heures === 0) {
        heures = ''
    }

    if (minutes === 0) {
        minutes = ''
    }


    return `${heures}${(Math.floor(dureeMs / (1000 * 60 * 60)) === 0) ? '' : 'h'} ${minutes}${(Math.floor(dureeMs / (1000 * 60)) % 60 == 0) ? '' : 'm'} ${secondes}s`;
}


document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/game/stats')
    .then(res => res.json())
    .then(res => {
        if (res.part) {
            document.getElementById('error').style.display = 'flex'
            return;
        }

        if (res.data[0].fin.vie === 0) {
            document.getElementById('win').innerHTML = `Defaite - ${res.data[0].fin.score}pts`
        } else {
            document.getElementById('win').innerHTML = `Victoire - ${res.data[0].fin.score}pts`
        }

        const dateDebut = new Date(res.data[0].dateDebut);

        let questions = ''

        res.data.forEach((question, index) => {
            if (index === 0) {
                return;
            }

            let link = ''

            if (!question.jeu.link) {
                link = `onclick="notify.info('Ce jeu n\\'a pas de site web')"`
            } else {
                link = `target="_blank" rel="noopener noreferrer" href="${question.jeu.link}"`
            }

            questions += `<div class='prop' >
                            <div class="space" ><p>${index} - <a ${link} >${question.jeu.name}</p></a><strong>${((question.win) ? '✅ Bonne réponse !' : '❌ Mauvaise réponse.')}</strong></div>
                                <p><strong>Votre réponse :</strong> ${question.rep}</p>
                                <p></p>
                        </div>`
        });


        document.getElementById('stats').insertAdjacentHTML('afterbegin', `
            <h2>Infos sur la partie</h2>
            <table>
                <tr>
                    <td>
                        <p><strong>Date :</strong>
                            Le ${dateDebut.getDate()}/0${dateDebut.getMonth() + 1}/${dateDebut.getFullYear()}
                            à ${dateDebut.getHours()}h${dateDebut.getMinutes()}
                        </p>
                    </td>
                    <td>
                        <p><strong>Nombre de questions :</strong> ${res.data[0].settings.nbGames}</p>
                    </td>
                </tr>
                <tr>
                    <td>
                        <p><strong>Durée de la partie : </strong>${getDuree(res.data[0].dateDebut,res.data[0].fin.date)}</p>
                    </td>
                    <td>
                        <p class='no-margin' ><strong class='no-marggin' >Nombre de vie(s) : </strong>${res.data[0].settings.lives}</p>
                        <p class='no-margin' ><strong class='no-marggin' >Vie perdus : </strong>${res.data[0].settings.lives - res.data[0].fin.vie}</p>
                    </td>
                </tr>
            </table>
            <hr>
            <h2>Détails par questions</h2>
            <div class='col' style="max-height: 30vh; overflow-y: auto;" >${questions}</div>
            <div class='center'><button onclick="window.location.href = '/'" >Continuer</button></div>
        `)
    })
})