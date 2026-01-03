window.config = window.config || {
    contact: true,
    ".header": {
        "logo-container": true,
        "menu": true
    },
    "footer": true
}

function logout() {
    fetch('/api/auth/logout')
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            window.location.href = `/?notif=Déconnecté avec succès`
        } else {
            window.location.href = `/login?redir=${window.location.pathname}`
        }
    })
}

function loadNotifs()  {
    fetch('/api/user/notifs')
    .then(response => response.json())
    .then(async res => {
        const doc = document.getElementById('notifs_co')

        const notifs = await fetch('/api/user/notifs').then(res => res.json())
        if (notifs.ok) {
            document.getElementById('notif_btn').innerHTML = `${notifs.data.length === 0 ? "" : `<div style="margin-top : 2px" >${notifs.data.length}</div>`} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bell"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>`
        }
    
        if (!res.ok) {
            return doc.innerHTML = `<div class="center" ><p>Ereur de chargement...</p></div>`
        }
        if (res.data.length === 0) {
            return doc.innerHTML =  `<div class="center" ><p>Aucune notification pour le moment...</p></div>`
        }

        doc.innerHTML = ``

        res.data.forEach(notif => {
            doc.insertAdjacentHTML('beforeend' ,`<div class="list" id="notif_${notif.id}" >
                                <div class="space" ><h3>${notif.title}</h3><p id="notif_btn_${notif.id}" class="cross" >⨉</p></div>
                                <p>${notif.description}</p>
                            </div>`)
            
            function acceptNotif() {
                fetch('/api/user/notif/' + notif.id, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                })
                .then(response => response.json())
                .then(async res => {
                  notify.info(res.message)
                  if (res.ok) {
                    loadNotifs()
                  }
                })
            }

            document.getElementById('notif_btn_' + notif.id).addEventListener('click', (e) => {
                acceptNotif()
            })
            if (notif.link) {
                document.getElementById('notif_' + notif.id).addEventListener('click', (e) => {
                    if (e.target.id == 'notif_btn_' + notif.id) return
                    acceptNotif()
                    window.location.href = notif.link
                })
            }
        });
    })
}

const components = {
    ".header": async (el, subConfig = {}) => {
        let html = ""

        if (subConfig["logo-container"]) {
            html += `
                <div class="logo-container" onclick="location.href='/'">
                    <img src="/img/logo.svg" alt="Logo" class="logo">
                    <span class="site-name">C Quoi Le Jeu</span>
                </div>
            `
        }

        if (subConfig["menu"]) {
            const user = await fetch('/api/user').then(res => res.json())
            if (user.username) {
                    html += `<nav id="additonal_nav" ></nav>`
                    const notifs = await fetch('/api/user/notifs').then(res => res.json())

                    if (notifs.ok) {
                    html += `
                    <div class="row start" >
                        <button class="small center row" id="notif_btn" >${notifs.data.length === 0 ? "" : `<div style="margin-top : 2px" >${notifs.data.length}</div>`} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bell"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg></button>
                        <div class="user-menu">
                            <button onmouseenter="document.getElementById('notif_fen').style.display = 'none'" class="small">${user.username}</button>
                            <div class="dropdown-content">
                                <a href="/page">Profil</a>
                                <a href="/settings">Paramètres</a>
                                ${user.isAdmin ? '<a href="/admin">Admin</a>' : ''}
                                <a onclick="logout()">Déconnexion</a>
                            </div>
                        </div>
                    </div>
                    `
                    }
                    
            } else {
                    html += `
                        <div class="user-menu">
                            <button id="idbtn" class="small">S'identifier</button>
                        </div>
                    `
                    el.innerHTML = html 

                    document.getElementById('idbtn').addEventListener('click', () => {
                        window.location.href = '/login'
                    })     
                    return;       
            }
        }

        el.innerHTML = html
    },

    "footer": async (el) => {
        const infos = await (await fetch('/version')).json()
        el.innerHTML = `
            <p>&copy; 2025-2026 <a onclick="window.open('https://cql-interactive.fr/')" >CQL Interactive</a>. Tous droits réservés. 
            Version ${infos.version} - 
            <a href="/privacy-notice-FR">Politique de Confidentialité</a> - <a href="/games" target="_blank">Liste des jeux</a></p>
        `
    },

    "contact": (footerEl) => {
        footerEl.insertAdjacentHTML(
            'beforebegin',
            `<button onclick="window.open('https://cql-interactive.fr/#contact')" class="small bottom-left">Contactez-nous !</button>`
        )
    }
}

async function loadNav() {
    for (const [selector, value] of Object.entries(window.config)) {
        const enabled = value !== false 
        if (!enabled) continue

        const targetEl = selector === "contact"
            ? document.querySelector("footer")
            : document.querySelector(selector)

        if (!targetEl) continue

        const renderer = components[selector]
        if (typeof renderer === "function") {
            await renderer(targetEl, typeof value === "object" ? value : undefined)
        }
    }

    document.body.insertAdjacentHTML('afterbegin', `
        <div id="notif_fen" class="fen notifs" style="display : none">
            <h1>Notifications</h1>
            <div id="notifs_co" class="col list-contaner" >
                <div class="center"><p>Chargement...</p></div>
            </div>
        </div>
    `)
    
    document.getElementById('notif_btn').addEventListener('click', () => {
        document.getElementById('notif_fen').style.display = "block"
        document.addEventListener('click', (e) => {
            if (document.getElementById('notif_btn').contains(e.target)) return
            if (!document.getElementById('notif_fen').contains(e.target)) {
                document.getElementById('notif_fen').style.display = 'none'
            }
        })
        loadNotifs()
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadNav()
})