document.getElementById('form-register').addEventListener('submit', (event) => {
    event.preventDefault()
    register()
})


function register(event) {
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value
    const button = document.getElementById('button-register').value

    button.innerHTML = "Chargement..."
 
    if (password != password2) {
        notify.error("Les mots de passes ne corespondent pas !")
        return;
    }

}