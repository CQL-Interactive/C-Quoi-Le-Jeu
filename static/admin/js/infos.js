const pre = document.getElementById('genCode');
const formGen = document.getElementById('formGen');
const typeSelect = document.getElementById('type_ann');

let idInputs = 0;


function getFormattedDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

function newInput() {
    idInputs++;

    const modifsInputs = document.getElementById('modifs_inputs');
    const modifsList = document.getElementById('modifs');

    const input = document.createElement('input');
    input.type = "text";
    input.id = `modif-${idInputs}`;
    input.placeholder = "Modification...";
    modifsInputs.appendChild(input);

    const li = document.createElement('li');
    li.id = `li-${idInputs}`;
    modifsList.appendChild(li);

    input.addEventListener('input', (e) => {
        li.innerHTML = e.target.value;
    });
}

changetype()

async function changetype() {
    const infos = await (await fetch('/version')).json();
    const user = await (await fetch('/api/user')).json();

    if (document.getElementById('type_ann').value === "0") {
        formGen.innerHTML = `
        <select id="type_ann" name="type">
            <option value="0">Type d'annonce</option>
            <option value="1">Patch note</option>
        </select>
        `;
        document.getElementById('type_ann').addEventListener('change', async () => {
            changetype()
        });
        pre.textContent = "Aucune prévisualisation disponible pour le moment.";
        return;
    }

    if (document.getElementById('type_ann').value === "1") {
        idInputs = 0;

        const container = document.createElement('div');
        container.className = "col";
        container.id = "modifs_inputs";

        const firstInput = document.createElement('input');
        firstInput.type = "text";
        firstInput.id = "modif-0";
        firstInput.placeholder = "Modification...";
        container.appendChild(firstInput);

        formGen.appendChild(container);

        const addBtn = document.createElement('button');
        addBtn.id = "new_modif";
        addBtn.type = "button";
        addBtn.className = "no";
        addBtn.textContent = "+ Nouvelle modification";
        formGen.appendChild(addBtn);

        pre.innerHTML = `
        <section class="fen">
            <div class="row space">
            <div class="center space" style="gap:10px;">
                <h2>Patch-note</h2><p>${infos.version}</p>
            </div>
            <div class="row center"><button onclick="window.location.reload()" >Fermer</button></div>
            </div>
            <ul id="modifs">
            <li id="li-0"></li>
            </ul>
            <div class="space center">
            <div></div>
            <small>Le ${getFormattedDate()} par ${user.username}</small>
            </div>
        </section>
        `;

        firstInput.addEventListener('input', (e) => {
        document.getElementById('li-0').innerHTML = e.target.value;
        });

        addBtn.addEventListener('click', newInput);
  }
}

document.getElementById('type_ann').addEventListener('change', async () => {
    changetype()
});


document.getElementById('send_btn').addEventListener("click", (e) => {
    e.preventDefault()

    fetch('/api/admin/annonce', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            patch : document.getElementById('genCode').innerHTML ,
            display : showDisplay.checked
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.ok) {
            if(showDisplay.checked) {
                window.location.href = '/?notif=Patch envoyé !'
            } else {
                window.location.href = '/admin/infos?notif=Patch envoyé !'
            }
        }
    })
})

