let nb = 0;

class notify {
    static #addNotification(type, html, time = 5000) {
        if (nb >= 1) return;

        const id = Date.now().toString();
        nb++;

        document.body.insertAdjacentHTML('afterbegin', `<div id="${id}" class="notif ${type}">${html}</div>`);

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