function login() {
    const password = document.getElementById('password').value
    const button = document.getElementById('button-login')
    button.innerHTML = "Chargement..."

    setTimeout(() => {
        fetch('/api/auth/login', {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body : JSON.stringify({
                password : password,
                username : document.getElementById('username').value
            })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.ok) {
                notify.error(res.message)
            } else {
                const url = new URL(window.location.href);
                const Param = url.searchParams.get("redir");
                const redir = Param ? Param : ""
                window.location.href = `${redir}?notif=Connexion réussie !%info`
                notify.info(res.message)
            }
            button.innerHTML = "Se connecter"
        })
    }, 1000)
}


document.getElementById('form-login').addEventListener('submit', (event) => {
    event.preventDefault()
    login()
})