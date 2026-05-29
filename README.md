## **Mais qu’est-ce que C Quoi Le Jeu 🤔 ?**

C Quoi Le Jeu est un jeu en ligne gratuit appartenant à [CQL Interactive](https://cql-interactive.fr), dont le principe est de deviner le nom d'un jeu vidéo à partir d'une image. CQLJ est disponible sur [cquoilejeu.fr](https://cquoilejeu.fr).

## **Les co-créateurs 🤝 :**

Nous sommes deux adolescents à avoir créé ce projet : Théo GRAZIANO et Elie SAIDANE LEMERCIER. "Nous voulons créer un jeu gratuit, sans publicités, accessible à tous et respectueux des données."

## **Un peu d'histoire... 📜**

Date de création : 8 avril 2025 : Le projet commence lors d’une discussion entre amis au collège, et abouti à une version minimaliste.

Sortie de la version Beta : 4 mai 2025 : Au bout de trois semaines, le site sort en version Beta afin que les gens puissent tester.

Date de sortie : 8 juin 2025

## **Nos liens 🔗 :**

**C Quoi Le Jeu :** [cquoilejeu.fr](https://cquoilejeu.fr)

**GitHub :** [github.com/CQL-Interactive/C-Quoi-Le-Jeu](https://github.com/CQL-Interactive/C-Quoi-Le-Jeu)

**Serveur Discord officiel :** [discord.gg/Evu8WXm27z](https://discord.gg/Evu8WXm27z)

**Tipeee :** [tipeee.com/cql-interactive](https://fr.tipeee.com/cql-interactive)

**Instagram :** [instagram.com/cql_interactive](https://www.instagram.com/cql_interactive)

**TikTok :** [tiktok.com/@cql_interactive](https://www.tiktok.com/@cql_interactive)

**YouTube :** [youtube.com/@cql-interactive](https://www.youtube.com/@cql-interactive)

**Email :** contact@cql-interactive.fr

## **Execution en local :**

**Requis :** `Node.js`, `npm` et `PostgreSQL`

### Installation et configuration :

**1. Cloner le projet et installer les dépendances :**
```
git clone https://github.com/CQL-Interactive/C-Quoi-Le-Jeu.git
cd C-Quoi-Le-Jeu
npm install
```

**2. Configurer PostgreSQL :**
- Créer une base de données PostgreSQL nommée `cqlj_db`
- Exécuter la commande `npm run db:init` pour l'initialiser

**3. Créer un fichier `config.env` :**
```
SECRET=your_secret_key
HOST=localhost
PORT=3000
SECURE=false
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cqlj_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

**4. Créer un fichier `annonce.json` :**
```
{
    "patch" :""
}
```

**5. Démarrer le site :**
```
npm start
```

## **LICENCE :**

C Quoi Le Jeu est sous licence GNU General Public License v3.0. Consultez le fichier [LICENSE](https://github.com/CQL-Interactive/C-Quoi-Le-Jeu/blob/main/LICENSE) pour plus de détails.