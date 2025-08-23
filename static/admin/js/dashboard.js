document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/admin/stats')
    .then(res => res.json())
    .then(res => {
        if (!res.err) {
            document.getElementById('nb_users').innerHTML = res.data.users.count
        }
    })
})