function register() {
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value
    const button = document.getElementById('button-register')
    button.innerHTML = "Chargement..."

    if (password != password2) {
        notify.error("Les mots de passes ne corespondent pas !")
        return;
    }
}


document.getElementById('button-register').addEventListener('submit', (e) => {
    e.preventDefault()
    register()
})