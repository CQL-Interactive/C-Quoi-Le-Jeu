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
    window.location.href = `/login?redir=${window.location.pathname}&notif=Déconnexion réussie%info`
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
            console.log(user)
            html += `
                <div class="user-menu">
                    <button class="small">${user.username}</button>
                    <div class="dropdown-content">
                        <a href="/histo">Mes parties</a>
                        <a href="/settings">Paramètres</a>
                        ${user.isAdmin ? '<a href="/admin">Panel administrateur</a>' : ''}
                        <a onclick="logout()">Déconnexion</a>
                    </div>
                </div>
            `
        }

        el.innerHTML = html
    },

    "footer": async (el) => {
        const version = await (await fetch('/version')).json()
        el.innerHTML = `
            <p>&copy; 2025 C Quoi Le Jeu. Tous droits réservés. 
            Version ${version} - 
            <a href="/privacy-notice-FR">Politique de Confidentialité</a></p>
        `
    },

    "contact": (footerEl) => {
        footerEl.insertAdjacentHTML(
            'beforebegin',
            `<button onclick="window.location.href = '/contact'" class="small bottom-left">✉️Contactez-nous !</button>`
        )
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    for (const [selector, value] of Object.entries(window.config)) {
        const enabled = value !== false // ✅ vrai si true ou object, faux uniquement si `false`
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
})