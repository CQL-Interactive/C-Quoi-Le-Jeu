document.addEventListener('DOMContentLoaded', () => {
    let coudownNav = setInterval(() => {
        const nav = document.getElementById('additonal_nav')

        /*if (nav) {
            nav.innerHTML = `
                <button class="nav-button" >Page</button>
                <button class="nav-button" >Carrière</button>
                <button class="nav-button" >Statistiques</button>
                <button class="nav-button" >Amis</button>
            `
            clearInterval(coudownNav)
        } else {
            console.error("Nav introuvable")
        }*/
    }, 100)
})