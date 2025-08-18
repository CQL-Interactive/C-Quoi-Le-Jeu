const socket = io()
let currentCode = null
let playerName = null
let maxRoundsCap = null
let hardcoreRevealData = null // Stocke les données de révélation aléatoire


async function getPlayerName() {
  try {
    const res = await fetch('/api/user')
    const user = await res.json()
    return user?.username || null
  } catch {
    return null
  }
}

// Génère des données de révélation aléatoire pour une nouvelle manche
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

function reloadRoomImage() {
  if (!currentCode) return
  const img = document.getElementById('img_current')
  const base = `/multi/img/${currentCode}`
  img.src = `${base}?_=${Date.now()}`

  // Appliquer le mode hardcore après le chargement de l'image
  img.onload = function() {
    console.log('Image loaded, hardcore mode:', window.currentHardcoreMode)
    if (window.currentHardcoreMode) {
      img.classList.add('hardcore')
      applyHardcoreClipPath(img, 0) // Commencer au niveau 0
      console.log('Applied hardcore mode with random reveal')
    } else {
      img.classList.remove('hardcore')
      img.style.clipPath = 'none'
      console.log('Removed hardcore mode')
    }
  }
}

// Limiter les manches côté client selon games_list.json
async function capRoundsInput() {
  try {
    const res = await fetch('/api/games')
    const games = await res.json()
    const max = Array.isArray(games) ? games.length : 50
    maxRoundsCap = max
    const input = document.getElementById('create-rounds')
    if (input) {
      input.max = String(max)
      if (Number(input.value) > max) input.value = String(max)
      input.placeholder = `Manches (max ${max})`
      // Force le cap à chaque saisie
      input.addEventListener('input', () => {
        const val = Number(input.value)
        if (val > max) input.value = String(max)
        if (val < 1) input.value = '1'
      })
      input.addEventListener('blur', () => {
        const val = Number(input.value)
        if (!val || val < 1) input.value = '1'
        if (val > max) input.value = String(max)
      })
    }
  } catch {}
  // Sécurise la valeur envoyée au serveur
  const cr = document.getElementById('create-rounds')
  cr.addEventListener('change', () => {
    const v = Number(cr.value)
    if (maxRoundsCap && v > maxRoundsCap) cr.value = String(maxRoundsCap)
    if (v < 1) cr.value = '1'
  })

}

document.addEventListener('DOMContentLoaded', async () => {
  playerName = await getPlayerName()

  // Cap manches selon le nombre de jeux
  capRoundsInput()

  // Création avec options
  document.getElementById('create-room').addEventListener('click', () => {
    const maxPlayers = Number(document.getElementById('create-max').value)
    const timePerRound = Number(document.getElementById('create-time').value)
    const nbRounds = Number(document.getElementById('create-rounds').value)
    const isPublic = !!document.getElementById('create-public').checked
    const isHardcore = !!document.getElementById('create-hardcore').checked
    socket.emit('multi:create', { nbRounds, name: playerName, maxPlayers, timePerRound, isPublic, isHardcore })
  })

  // Rejoindre via code
  document.getElementById('join-room').addEventListener('click', () => {
    const code = document.getElementById('join-code').value.trim().toUpperCase()
    if (!code) return notify.warn('Entrez un code de salle')
    socket.emit('multi:join', { code, name: playerName })
  })

  // Prêt dans le lobby
  document.getElementById('toggle-ready').addEventListener('click', () => {
    if (!currentCode) return
    socket.emit('multi:ready', { code: currentCode })
  })

  // Démarrer (host seulement)
  document.getElementById('start-game').addEventListener('click', () => {
    if (!currentCode) return
    socket.emit('multi:start', { code: currentCode })
  })

  // Réponse
  document.getElementById('guess-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const guess = document.getElementById('guess').value
    if (!currentCode || !guess) return
    socket.emit('multi:guess', { code: currentCode, guess })
    document.getElementById('guess').value = ''
  })

  // Chat
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const msg = document.getElementById('chat-input').value
    if (!msg || !currentCode) return
    socket.emit('multi:chat', { code: currentCode, msg })
    document.getElementById('chat-input').value = ''
  })

  // Copier code
  document.getElementById('copy-code').addEventListener('click', async () => {
    const txt = document.getElementById('room-info').innerText.replace('Code de salle: ', '')
    try {
      await navigator.clipboard.writeText(txt)
      notify.info('Code copié !')
    } catch {
      notify.error('Impossible de copier le code')
    }
  })

  // Charger parties publiques
  socket.emit('multi:list-public')
})

socket.on('multi:public', (rooms) => {
  const list = document.getElementById('public-list')
  if (!list) return
  list.innerHTML = ''
  rooms.forEach(r => {
    const div = document.createElement('div')
    div.className = 'list'
    const hardcoreText = r.hardcore ? ' · 🔥 Hardcore' : ''
    div.innerHTML = `<div class="row space"><span>${r.code} · ${r.players}/${r.maxPlayers} joueurs · ${r.nbRounds} manches · ${r.timePerRound}s${hardcoreText}</span><button data-code="${r.code}">Rejoindre</button></div>`
    div.querySelector('button').addEventListener('click', () => {
      socket.emit('multi:join', { code: r.code, name: playerName })
    })
    list.appendChild(div)
  })
})

socket.on('multi:created', ({ code }) => {
  currentCode = code
  document.getElementById('room-info').innerText = `Code de salle: ${code}`
  document.getElementById('copy-code').style.display = 'inline-block'
  notify.info(`Salle créée: ${code}`)
  // Le host n’auto-démarre plus: on passe par le lobby
  document.getElementById('prestart').style.display = 'block'
})

socket.on('multi:joined', ({ code }) => {
  currentCode = code
  document.getElementById('room-info').innerText = `Code de salle: ${code}`
  document.getElementById('copy-code').style.display = 'inline-block'
  notify.info(`Rejoint la salle: ${code}`)
  document.getElementById('prestart').style.display = 'block'
})

socket.on('multi:update', (state) => {
  if (!state) return
  // lobby visibility
  const allReady = state.players.length > 0 && state.players.every(p => p.ready)
  document.getElementById('start-game').style.display = allReady ? 'inline-block' : 'none'
  // players list
  const pl = document.getElementById('players-list')
  if (pl) {
    pl.innerHTML = ''
    state.players.forEach(p => {
      const li = document.createElement('div')
      li.textContent = `${p.name} ${p.ready ? '✅' : '⏳'}`
      pl.appendChild(li)
    })
  }
  // game started
  if (state.started) {
    document.getElementById('lobby').style.display = 'none'
    document.getElementById('game').style.display = 'block'
  }
  updateScores(state.players)
})

socket.on('multi:round', ({ round, total, hardcore }) => {
  const t = document.getElementById('round-title')
  if (t) t.dataset.round = String(round)
  const hardcoreText = hardcore ? ' 🔥' : ''
  document.getElementById('round-title').innerText = `Manche ${round} · Temps: ${total}s${hardcoreText}`

  // Stocker l'état hardcore et générer de nouvelles données aléatoires pour cette manche
  window.currentHardcoreMode = hardcore
  if (hardcore) {
    hardcoreRevealData = generateRandomRevealData()
    console.log('Generated new random reveal data:', hardcoreRevealData)
  } else {
    hardcoreRevealData = null
  }

  reloadRoomImage()
})

// Affichage du compte à rebours
socket.on('multi:tick', ({ remaining, hardcoreRevealLevel }) => {
  const t = document.getElementById('round-title')
  const r = t?.dataset?.round || ''
  const hardcoreText = (hardcoreRevealLevel !== undefined) ? ' 🔥' : ''
  if (t) t.innerText = `Manche ${r} · Temps: ${remaining}s${hardcoreText}`

  // Mettre à jour le niveau de révélation hardcore
  if (hardcoreRevealLevel !== undefined) {
    const img = document.getElementById('img_current')
    if (img && img.classList.contains('hardcore')) {
      applyHardcoreClipPath(img, hardcoreRevealLevel)
    }
  }
})

socket.on('multi:timeout', ({ answer }) => {
  notify.warn(`Temps écoulé ! La bonne réponse était: ${answer || 'inconnue'}`)
  // Nettoyer le mode hardcore
  const img = document.getElementById('img_current')
  if (img) {
    img.classList.remove('hardcore')
    img.style.clipPath = 'none'
  }
  hardcoreRevealData = null
  reloadRoomImage()
})


socket.on('multi:correct', ({ winner, answer, scores, bonus }) => {
  const extra = bonus ? ` (+${bonus})` : ''
  notify.info(`${winner} a trouvé: ${answer}${extra}`)
  updateScores(scores)
  // Nettoyer le mode hardcore
  const img = document.getElementById('img_current')
  if (img) {
    img.classList.remove('hardcore')
    img.style.clipPath = 'none'
  }
  hardcoreRevealData = null
  reloadRoomImage()
})

socket.on('multi:gameover', ({ ranking }) => {
  updateScores(ranking)
  notify.info('Partie terminée!')
})

socket.on('multi:chat', ({ from, msg }) => {
  const log = document.getElementById('chat-log')
  const line = document.createElement('div')
  line.textContent = `${from}: ${msg}`
  log.appendChild(line)
  log.scrollTop = log.scrollHeight
})

socket.on('multi:error', ({ message }) => notify.error(message))

function updateScores(scores) {
  const el = document.getElementById('scores')
  el.innerHTML = ''
  scores.forEach(s => {
    const div = document.createElement('div')
    div.textContent = `${s.name}: ${s.score}`
    el.appendChild(div)
  })
}
