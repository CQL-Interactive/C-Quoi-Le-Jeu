document.getElementById('username-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const username = document.getElementById('username-input').value
    fetch('/api/user/change/username', {
        method : 'PATCH',
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            username : username
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            notify.info(`Le nom d'utlisateur à bien été modifié<br>Acien nom d'utilisateur : ${res.before}<br>Nouveau nom d'utlisateur : ${username}`)
            document.getElementById('username-input').value = ""
        } else {
            notify.error(res.message)
        }
    })
})

document.getElementById('mdp-from').addEventListener('submit', (e) => {
    e.preventDefault()
    const password = document.getElementById('new_password')
    fetch('/api/user/change/password', {
        method : 'PATCH',
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            password : password.value
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            notify.info(`Le mot de passe à bien été modifié !`)
            password.value = ""
        } else {
            notify.error(res.message)
        }
    })
})

document.getElementById('delete-form').addEventListener('submit', (e) => {
    e.preventDefault()
    if(!confirm("Etes vous sûr de vouloir supprimer votre compte ? Cettez action est iréversiible.")) {
        return;
    }
    const password = document.getElementById('password_user')
    fetch('/api/user/', {
        method : 'DELETE',
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            password : password.value
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            notify.info(res.message)
            setTimeout(() => {
                window.location.href = '/register/?notif=Votre compté à été supprimer aavec succès avec succès !'
            }, 3000)
            password.value = ""
        } else {
            notify.error(res.message)
        }
    })
})