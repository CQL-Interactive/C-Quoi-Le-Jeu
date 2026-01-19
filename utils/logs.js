const path = require('path')
const pool = require(path.join(process.cwd(), 'db.js'))

module.exports = (title, {
    desc = null,
    userId,
    public = false,
    link = null
}) => {
    if (!title) {
        console.error(`[LOGS] Le title ne peut pas être null.`)
    }
    if (typeof public !== 'boolean') return console.error(`[LOGS] Le type doit être booléen pour ${title}`)

    pool.query(
        `INSERT INTO logs (title, description, public, user_id, link) VALUES ($1, $2, $3, $4, $5)`,
        [title, desc, public, userId, link],
        (err) => {
            if (err) return console.error(`[LOGS] Erreur bdd : ${err}`)

            console.log(
                `[LOGS] \x1b[1m${title}${public ? ' - Public' : ''}\x1b[0m\n` +
                `${desc ?? ''}\n` +
                `${userId ? 'Utilisateur id : ' + userId : ''}`
            )

            return {
                ok  : true
            }
        }
    )
}
