const path = require('path')
const prisma = require(path.join(process.cwd(), 'db.js'))

module.exports = async (title, {
    desc = null,
    userId,
    public = false,
    link = null
}) => {
    if (!title) {
        console.error(`[LOGS] Le title ne peut pas être null.`)
    }
    if (typeof public !== 'boolean') return console.error(`[LOGS] Le type doit être booléen pour ${title}`)

    try {
        await prisma.logs.create({
            data: {
                title,
                description: desc,
                public,
                user_id: userId,
                link
            }
        });

        console.log(
            `[LOGS] \x1b[1m${title}${public ? ' - Public' : ''}\x1b[0m\n` +
            `${desc ?? ''}\n` +
            `${userId ? 'Utilisateur id : ' + userId : ''}`
        )

        return {
            ok  : true
        }
    } catch (err) {
        console.error(`[LOGS] Erreur bdd : ${err}`)
    }
}
