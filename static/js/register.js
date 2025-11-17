function register() {
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value
    const button = document.getElementById('button-register')
    button.innerHTML = "Chargement..."

    setTimeout(() => {
        if (password != password2) {
            notify.error("Les mots de passe ne correspondent pas !")
            button.innerHTML = "S'inscrire"
            return;
        }

        fetch('/api/auth/register', {
            method : 'POST',
            headers: {
            'Content-Type': 'application/json' // on envoie des données JSON
            },
            body : JSON.stringify({
                password : password,
                username : document.getElementById('username-register').value
            })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.ok) {
                notify.error(res.message)
            } else {
                window.location.href = '/?notif=Inscription réussie !%info'
                notify.info(res.message)
            }
            button.innerHTML = "S'inscrire"
        })
    }, 1000)
}


document.getElementById('form-register').addEventListener('submit', (e) => {
        e.preventDefault()
        register()
})