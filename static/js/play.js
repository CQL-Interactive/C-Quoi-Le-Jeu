function reloadImage(id) {
  const img = document.getElementById(id)
  const baseUrl = img.src.split('?')[0]
  img.src = `${baseUrl}?_=${Date.now()}`

  // Appliquer le mode hardcore après le chargement de l'image si nécessaire
  if (id === 'img_current') {
    img.onload = function() {
      // Vérifier si le mode hardcore doit être appliqué
      fetch('/api/game/settings')
      .then(res => res.json())
      .then(settings => {
        if (settings.ok && settings.data.hardcore) {
          // Générer de nouvelles données aléatoires pour cette question
          hardcoreRevealData = generateRandomRevealData()
          console.log('Generated new random reveal data for solo:', hardcoreRevealData)

          img.classList.add('hardcore')
          applyHardcoreClipPath(img, 0) // Commencer au niveau 0

          if (!hardcoreInterval) {
            startHardcoreMode()
          }
        }
      })
      .catch(err => console.error('Erreur lors de la vérification hardcore:', err))
    }
  }
}

let hardcoreInterval = null;
let hardcoreRevealData = null; // Stocke les données de révélation aléatoire

// Génère des données de révélation aléatoire pour une nouvelle question
function generateRandomRevealData() {
  // Position aléatoire pour le centre du point de départ
  const centerX = 20 + Math.random() * 60 // Centre entre 20% et 80%
  const centerY = 20 + Math.random() * 60 // Centre entre 20% et 80%

  return {
    centerX,
    centerY,
    // Rayons progressifs depuis le centre (en pourcentage)
    radii: [
      15, // Niveau 0 - petit cercle (15% de rayon)
      25, // Niveau 1 - cercle moyen (25% de rayon)
      40, // Niveau 2 - grand cercle (40% de rayon)
      60, // Niveau 3 - très grand cercle (60% de rayon)
      100 // Niveau 4 - image complète
    ]
  }
}

// Applique le clip-path basé sur le niveau de révélation
function applyHardcoreClipPath(img, level) {
  if (!hardcoreRevealData || level >= 4) {
    img.style.clipPath = 'none'
    return
  }

  const { centerX, centerY, radii } = hardcoreRevealData
  const radius = radii[level]

  // Calculer les coordonnées du rectangle visible centré sur le point aléatoire
  const left = Math.max(0, centerX - radius)
  const top = Math.max(0, centerY - radius)
  const right = Math.min(100, centerX + radius)
  const bottom = Math.min(100, centerY + radius)

  // Créer un clip-path qui montre seulement le rectangle spécifié
  // inset(top right bottom left)
  const clipPath = `inset(${top}% ${100 - right}% ${100 - bottom}% ${left}%)`
  img.style.clipPath = clipPath

  console.log(`Applied clip-path level ${level}: center(${centerX.toFixed(1)}, ${centerY.toFixed(1)}) radius=${radius}% -> ${clipPath}`)
}

function loadJeu() {
    fetch('/api/game/settings')
    .then(res => res.json())
    .then(settings => {
        if (settings.ok) {
            document.getElementById('game_name').value = ""
            serchGames()
            fetch('/api/game/current')
            .then(res => res.json())
            .then(current => {
                document.getElementById('vie').innerHTML = ""
                for (let index = 0; index < current.lives; index++) {
                    document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vie.png' >`
                }
                for (let index = 0; index < settings.data.lives - current.lives; index++) {
                    document.getElementById('vie').innerHTML += `<img class='icon' src='/img/vieVide.png' >`
                }
                document.getElementById('nbQuestion').innerHTML = `Jeu ${current.question}/${settings.data.nbGames}`
                document.getElementById('nbScore').innerHTML = `Score ${current.score}`
                reloadImage('img_current')

                // Démarrer le mode hardcore si activé
                if (settings.data.hardcore) {
                    startHardcoreMode()
                } else {
                    stopHardcoreMode()
                }
            })
        } else {
            notify.error(settings.message)
        }
    })
}

function startHardcoreMode() {
    const img = document.getElementById('img_current')

    // Vérifier le statut hardcore toutes les secondes
    hardcoreInterval = setInterval(() => {
        fetch('/api/game/hardcore-status')
        .then(res => res.json())
        .then(status => {
            if (!status.enabled) {
                stopHardcoreMode()
                return
            }

            if (status.timeout) {
                notify.warn(status.message)
                loadJeu() // Recharger pour passer à la question suivante
                return
            }

            // Mettre à jour le niveau de révélation avec clip-path aléatoire
            if (img.classList.contains('hardcore')) {
                applyHardcoreClipPath(img, status.revealLevel)
            }

            // Afficher le temps restant dans le titre
            const titleElement = document.getElementById('nbQuestion')
            if (titleElement) {
                const baseText = titleElement.textContent.split(' · ')[0]
                titleElement.textContent = `${baseText} · Temps: ${status.remaining}s 🔥`
            }
        })
        .catch(err => {
            console.error('Erreur hardcore status:', err)
        })
    }, 1000)
}

function stopHardcoreMode() {
    if (hardcoreInterval) {
        clearInterval(hardcoreInterval)
        hardcoreInterval = null
    }

    const img = document.getElementById('img_current')
    img.classList.remove('hardcore')
    img.style.clipPath = 'none'
    hardcoreRevealData = null

    // Restaurer le titre normal
    const titleElement = document.getElementById('nbQuestion')
    if (titleElement && titleElement.textContent.includes('·')) {
        titleElement.textContent = titleElement.textContent.split(' · ')[0]
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadJeu()
})

document.getElementById('game_form').addEventListener('submit', (e) => {
    e.preventDefault()
    let pass = false
    const rep = document.getElementById('game_name').value
    if (rep.length === 0) {
        pass = true;
    }

    // Arrêter temporairement le mode hardcore pendant la vérification
    const wasHardcore = hardcoreInterval !== null
    if (wasHardcore) {
        stopHardcoreMode()
    }

    fetch('/api/game/verif', {
        method : "POST",
        headers : {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({
            rep : rep,
            pass : pass
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.perdu) {
            window.location.href = '/?notif=Fin de la partie. Vous avez perdu.'
            return;
        }

        if (res.win) {
            window.location.href = '/?notif=Fin de la partie. Vous avez gagné.'
        }

        if (!res.ok) {
            notify.error("Une erreur est survenue !")
            window.location.reload()
            return;
        }

        notify.info(res.message)
        loadJeu()
    })
})

function serchGames() {
    const query = document.getElementById('game_name').value;

    if (query.length === 0) {
        document.getElementById('propositions').style.display = 'none'
        return;
    } else {
        document.getElementById('propositions').style.display = 'block'
    }

    fetch(`/api/game/searchGames?query=${query}`)
    .then(res => res.json())
    .then(res => {
        document.getElementById('propositions').innerHTML = ''
        if (!res || res.length === 0) {
            document.getElementById('propositions').style.display = 'none'
            return;
        }
        res.forEach(jeux => {
            document.getElementById('propositions').innerHTML += `<div class='list' onclick="rep('${jeux.name}')" ><p>${jeux.name}</p></div>`
        });
    })
}

function rep(value) {
    document.getElementById('game_name').value = value
    serchGames()
} 