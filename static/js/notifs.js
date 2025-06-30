let nb = 0

class notify {
    static error(html, time = 5000) {
        if (nb >= 5) {
            return;
        }
        const id = Date.now().toString()
        nb ++
        document.body.insertAdjacentHTML('afterbegin', `<div id="${id}" class="nootif">${html}</div>`)
        if (time === false) {
            return id;
        } else {
            setTimeout(() => {
                document.getElementById(id).remove()
                nb --
            }, time)
            return;
        }
    }

    static remove(id) {
        document.getElementById(id).remove()
        nb --
    }

    // warn - info à faire
}