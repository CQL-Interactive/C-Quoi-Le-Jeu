function loadSent() {
    fetch('/api/friends/request/sent')
    .then(response => response.json())
    .then(res => {
        const doc = document.getElementById('requests_sent')
        if (res.ok && res.data) {
            doc.innerHTML = ""
            if (res.data.length === 0) {
                doc.innerHTML = "Aucune demande envoyée pour le moment"
                return;
            }
            res.data.forEach(reque => {
                doc.innerHTML += `<div class='list space' style="width: 100%">
                <p>${reque.username}</p>                
            </div>`;
            });
        }
    })
}

function loadFriends() {
    fetch('/api/friends/list')
    .then(response => response.json())
    .then(res => {
        const doc = document.getElementById('friends_list')
        if (res.ok && res.data) {
            doc.innerHTML = ""
            if (res.data.length === 0) {
                doc.innerHTML = "Aucun ami pour le moment."
                return;
            }
            res.data.forEach(fr => {
                doc.innerHTML += `<div class='list space' style="width: 100%">
                <p>${fr.username}</p>
                <a class="hover" id="btn_remove_friend_${fr.id}" >Retirer l'ami</a>                
            </div>`;
            document.getElementById(`btn_remove_friend_${fr.id}`).addEventListener('click' ,() => {
                fetch('/api/friends/remove', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body : JSON.stringify({
                    friendId : fr.friend_id
                  })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.ok) {
                    notify.info("Ami retiré avec succès")
                    loadFriends()
                  } else {
                    notify.info(data.msg)
                  }
                })
            })
            });
        }
    })
}


document.getElementById('friends_form').addEventListener('submit', (e) => {

    e.preventDefault()

    e.submitter.classList.add('loadingBtn')
    e.submitter.disabled = true


    fetch('/api/friends/request/friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify({
            user2Name : document.getElementById('input_friend').value
        })
    })
    .then(response => response.json())
    .then(res => {
        notify.info(res.msg)
        if (res.ok) {
            document.getElementById('input_friend').value = ""
            loadSent()
        }
        e.submitter.classList.remove('loadingBtn')
        e.submitter.disabled = false
    })
})

function loadRecevied() {
    fetch('/api/friends/request/received')
    .then(response => response.json())
    .then(res => {
        const doc = document.getElementById('requests_received')
        if (res.ok && res.data) {
            doc.innerHTML = ""
            if (res.data.length === 0) {
                doc.innerHTML = "Aucune demande reçue pour le moment"
                return;
            }
            
            let id = 0

            res.data.forEach(reque => {
                doc.innerHTML += `<div class='list space' style="width: 100%">
                <p>${reque.username}</p>
                <div class="row hover">
                    <a id="acc_${id}" >Accepter</a>
                    <a id="refu_${id}" >Refuser</a>
                </div>
            </div>`;
            document.getElementById(`refu_${id}`).addEventListener('click' , () => {
                fetch('/api/friends/decline', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body : JSON.stringify({
                    requestId : reque.id
                  })
                })
                .then(response => response.json())
                .then(res => {
                  notify.info(res.msg)
                  if (res.ok) {
                    loadFriends()
                    loadRecevied()
                  }
                })
            })
            document.getElementById(`acc_${id}`).addEventListener('click', () => {
                fetch('/api/friends/request/accept', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body : JSON.stringify({
                    requestId : reque.id
                  })
                })
                .then(response => response.json())
                .then(res => {
                  notify.info(res.msg)
                  if (res.ok) {
                    loadFriends()
                    loadRecevied()
                  }
                })
            })
            id ++
            });
        }
    })
}

document.addEventListener('DOMContentLoaded', () => {
    loadFriends()
    loadSent()
    loadRecevied()
})