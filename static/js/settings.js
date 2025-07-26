document.getElementById('username-form').addEventListener('submit', (e) => {
    const username = document.getElementById('username-input').value

    document.getElementById('username-input').value = ""
    e.preventDefault()
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
        } else {
            notify.error(res.message)
        }
    })
})