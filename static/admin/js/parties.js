let parties = []

function displayParties(showId = false) {
    if (parties.length === 0) {
        loadParties(showId)
    } else {
        document.getElementById('parties').innerHTML = ``;
        parties.forEach(partie => {
        document.getElementById('parties').innerHTML += `
            <div class="list space">
                <p>${showId ? `${partie.id} - ` : ''}${partie.user}</p><p>${partie.score}</p>
            </div>
        `
        })
    }
}

function loadParties(showId = false) {
    fetch('/api/admin/parties')
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            parties = res.data;
            displayParties(showId)
        }
    })
}

document.getElementById('showId').addEventListener('change', (e) => {
    window.localStorage.setItem('AdminCheckParties', JSON.stringify(e.target.checked))
    displayParties(e.target.checked)
})

document.addEventListener('DOMContentLoaded', () => {
    if (!window.localStorage.getItem('AdminCheckParties')) {
        window.localStorage.setItem('AdminCheckParties', "false")
    }
    document.getElementById('showId').checked = JSON.parse(window.localStorage.getItem('AdminCheckParties'))
    displayParties(JSON.parse(window.localStorage.getItem('AdminCheckParties')))
})