let nb = 0;
let idSurvol = 0;
const lsitAttente = []

class notify {
    static #addNotification(type, html, time = 5000) {
        if (nb >= 3) {
            lsitAttente.push({
                type, 
                html,
                time
            })
            return;
        }
        const id = Date.now().toString();
        if (nb === 0) {
            document.body.insertAdjacentHTML('afterbegin', `
                <div id='notif-contaner'></div>
            `)
        }
        nb++;

        document.getElementById('notif-contaner').insertAdjacentHTML('afterbegin', `<div id="${id}" class="notif ${type}">${html}</div>`);

        if (time !== false) {
            setTimeout(() => notify.remove(id), time);
        }

        return id;
    }

    static error(html, time = 5000) {
        console.error(`[ERROR] ${html}`);
        return this.#addNotification('error', html, time);
    }

    static warn(html, time = 5000) {
        console.warn(`[WARN] ${html}`);
        return this.#addNotification('warn', html, time);
    }

    static info(html, time = 5000) {
        console.info(`[INFO] ${html}`);
        return this.#addNotification('info', html, time);
    }

    static remove(id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.add('anim');
        setTimeout(() => {
            el.remove();
            nb--;
            if (lsitAttente.length > 0) {
                notify[lsitAttente[0].type](lsitAttente[0].html, lsitAttente[0].time)
                lsitAttente.shift()
            }
            if (nb === 0) {
                document.getElementById('notif-contaner').remove()
            }
        }, 900);
    }

    static fromURL() {
        const url = new URL(window.location.href);
        const notifParam = url.searchParams.get("notif");

        if (notifParam) {
            const parts = notifParam.split("%");
            const content = parts[0] || "";
            const type = parts[1] || "info";
            const time = parts[2] !== undefined ? parseInt(parts[2]) : 5000;

            notify[type]?.(decodeURIComponent(content), time);

            url.searchParams.delete("notif");
            window.history.replaceState({}, "", url.toString());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    notify.fromURL()
})