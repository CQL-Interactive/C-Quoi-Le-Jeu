document.getElementById('bio_form').addEventListener('submit', (e) => {
    e.preventDefault()

    e.submitter.classList.add('loadingBtn')
    e.submitter.disabled = true

    const bio = document.getElementById('bio_input').value

    fetch('/api/user/bio', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({
        bio : bio
      })
    })
    .then(response => response.json())
    .then(res => {
      if (res.ok) {
        document.getElementById('bio_display').innerHTML = bio || 'Aucune bio'
        document.getElementById('bio_settings').style.display = "none"
      }
        e.submitter.classList.remove('loadingBtn')
        e.submitter.disabled = false
        notify.info(res.msg)
    })
})