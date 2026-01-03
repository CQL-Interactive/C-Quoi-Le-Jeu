document.addEventListener('DOMContentLoaded', () => {
    let coudownNav = setInterval(() => {
        const nav = document.getElementById('additonal_nav')

        if (nav) {
            nav.innerHTML = `
                <button onclick="window.location.href = '/page'" class="nav-button" >Page</button>
                <button onclick="window.location.href = '/historique'" class="nav-button" >Carrière</button>
                <button onclick="window.location.href = '/stats'" class="nav-button" >Statistiques</button>
                <button onclick="window.location.href = '/friends'"  class="nav-button" >Amis</button>
            `
            clearInterval(coudownNav)
        } else {
            console.error("Nav introuvable")
        }
    }, 100)
})