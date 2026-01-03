document.addEventListener('DOMContentLoaded', async () => {
    fetch('/api/user/stats')
    .then(res => res.json())
    .then(res => {
      document.getElementById('stats_player_parts').innerHTML = res.data.playedGames
      document.getElementById('stats_great_score').innerHTML = res.data.greatScore
    })
})

document.getElementById('contaner_stats_games').addEventListener('click', (e) => {
    document.getElementById('contaner_stats_games').classList.add('pin')
    fetch('/api/user/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({
        pinId : 1
      })
    })
    .then(response => response.json())
    .then(res => {
      notify.info(res.msg)
    })
})

document.getElementById('contaner_stats_score').addEventListener('click', (e) => {
    document.getElementById('contaner_stats_score').classList.add('pin')
})