// Charger et afficher la bio au démarrage
document.addEventListener('DOMContentLoaded', () => {
    const bioInput = document.getElementById('bio_input')
    if (bioInput && bioInput.value) {
        const bio = bioInput.value
        fetch('/api/user/bio/markdown', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bio: bio })
        })
        .then(response => response.json())
        .then(res => {
            document.getElementById('bio_display').innerHTML = res.html || '<p>' + bio + '</p>'
        })
        .catch(() => {
            document.getElementById('bio_display').innerHTML = '<p>' + bio + '</p>'
        })
    }

    // Initialiser le compteur de caractères au chargement
    const counter = document.getElementById('bio_counter')
    if (bioInput && counter) {
        const count = bioInput.value.length
        counter.textContent = `${count}/140 caractères`
    }
})

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
        // Convertir le Markdown en HTML
        fetch('/api/user/bio/markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bio: bio })
        })
        .then(response => response.json())
        .then(markdownRes => {
          document.getElementById('bio_display').innerHTML = markdownRes.html || (bio ? '<p>' + bio + '</p>' : 'Aucune bio')
          document.getElementById('bio_settings').style.display = "none"
          e.submitter.classList.remove('loadingBtn')
          e.submitter.disabled = false
          notify.info(res.msg)
        })
      } else {
        e.submitter.classList.remove('loadingBtn')
        e.submitter.disabled = false
        notify.error(res.msg)
      }
    })
})

// Mise à jour du compteur de caractères
document.getElementById('bio_input').addEventListener('input', (e) => {
    const count = e.target.value.length
    const counter = document.getElementById('bio_counter')
    if (counter) {
        counter.textContent = `${count}/140 caractères`
    }
})