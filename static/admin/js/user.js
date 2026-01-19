document.getElementById('delete_user').addEventListener('click', (e) => {
    e.target.classList.add('loadingBtn')
    e.target.disabled = true

    fetch('/api/admin/delete/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
       body : JSON.stringify({
            id : window.user.id
       })
    })
    .then(response => response.json())
    .then(res => {
        e.target.classList.remove('loadingBtn')
        e.target.disabled = false
      if (res.ok) {
        window.location.href = './?notif=Utilisateur supprimé'
      } else {
        notify.info(res.msg)
      }
    })
    .catch (() => {
        e.target.classList.remove('loadingBtn')
        e.target.disabled = false
        notify.info("Erreur serveur")
    })
})