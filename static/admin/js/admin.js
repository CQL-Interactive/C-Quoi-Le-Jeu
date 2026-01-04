const navItems = [
    { name: "Panel", href: "/admin/" },
    { name: "Utilisateurs", href: "/admin/users" },
    { name: "Jeux", href: "/admin/games" },
    { name: "Annonces", href: "/admin/infos" },
];

function createNav() {
    const currentPath = window.location.pathname;

    const nav = document.createElement("nav");
    nav.className = "space";

    const leftDiv = document.createElement("div");
    navItems.forEach(item => {
        const btn = document.createElement("button");
        btn.textContent = item.name;
        btn.onclick = () => window.location.href = item.href;

        if (currentPath === item.href) {
            btn.classList.add("select");
        }

        leftDiv.appendChild(btn);
    });

    const rightDiv = document.createElement("div");

    const gamesDetailRegex = /^\/admin\/games\/\d+/;
    if (gamesDetailRegex.test(currentPath)) {
        const backBtn = document.createElement("button");
        backBtn.textContent = "Retour";
        backBtn.className = "imp";
        backBtn.onclick = () => window.location.href = "/admin/games";
        rightDiv.appendChild(backBtn);
    }

    nav.appendChild(leftDiv);
    nav.appendChild(rightDiv);

    document.querySelector('.header').insertAdjacentElement('afterend', nav)
}
document.addEventListener('DOMContentLoaded', () => {
    createNav();
})
