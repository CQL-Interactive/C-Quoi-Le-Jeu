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
                    html += `
                        <div class="user-menu">
                            <button class="small">${user.username}</button>
                            <div class="dropdown-content">
                                <a href="/historique">Profil</a>
                                <a href="/settings">Paramètres</a>
                                ${user.isAdmin ? '<a href="/admin">Admin</a>' : ''}
                                <a onclick="logout()">Déconnexion</a>
                            </div>
                        </div>
                    `
            } else {
                    html += `
                        <div class="user-menu">
                            <button id="idbtn" class="small">Identification</button>
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
            <p>&copy; 2025 CQL Interactive. Tous droits réservés. 
            Version ${infos.version} - 
            <a href="/privacy-notice-FR">Politique de Confidentialité</a></p>
        `
    },

    "contact": (footerEl) => {
        footerEl.insertAdjacentHTML(
            'beforebegin',
            `<button onclick="window.location.href = '/liens'" class="small bottom-left">🔗 Nos liens</button>`
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
}

document.addEventListener('DOMContentLoaded', () => {
    loadNav()
})