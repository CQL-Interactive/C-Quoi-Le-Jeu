let nb = 0;
let idSurvol = 0;
const lsitAttente = []

class notify {
static #addNotification(type, html, time = 5000) {
    return new Promise((resolve) => {
            if (nb >= 3) {
                lsitAttente.push({ type, html, time, resolve });
                return;
            }

            const id = Date.now().toString();
            if (nb === 0) {
                document.body.insertAdjacentHTML('afterbegin', `<div id='notif-contaner'></div>`)
            }
            nb++;

            if (type === 'confirm') {
                document.getElementById('notif-contaner').insertAdjacentHTML('afterbegin', `
                    <div class="notif ${type} col" id="${id}">
                        <div>${html}</div>
                        <div class='center row'>
                            <button id='${id}-true'>Ok</button>
                            <button id='${id}-false'>Annuler</button>
                        </div>
                    </div>`);

                document.getElementById(`${id}-true`).addEventListener('click', () => {
                    notify.remove(id);
                    resolve(true);
                });

                document.getElementById(`${id}-false`).addEventListener('click', () => {
                    notify.remove(id);
                    resolve(false);
                });

                return; 
            }

            document.getElementById('notif-contaner').insertAdjacentHTML('afterbegin', `<div id="${id}" class="notif ${type}">${html}</div>`);

            if (time !== false) {
                setTimeout(() => notify.remove(id), time);
            }

            return id;
        })
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

    static confirm(html) {
        return this.#addNotification('confirm', html, false)
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