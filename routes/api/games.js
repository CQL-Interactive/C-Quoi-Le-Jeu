const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const { formidable } = require("formidable")
const sharp = require("sharp")

router.get('/', (req, res) => {
    const jeux = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))

    res.json(jeux)
})

// En cours de dev

/*router.post("/", (req, res) => {
    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }
    const form = formidable({ keepExtensions: true, multiples: false })

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "Erreur serveur" })

        try {
        const nom = fields.nom ? fields.nom[0] : "inconnu"

        const fileKeys = Object.keys(files)
        if (fileKeys.length === 0) return res.status(400).json({ error: "Aucun fichier reçu" })
        const file = files[fileKeys[0]][0]

        if (!file.mimetype.startsWith("image/")) {
            return res.status(400).json({ error: "Seules les images sont acceptées" })
        }

        const dossier = path.join(process.cwd(), "static", "games", "validation", nom)
        if (!fs.existsSync(dossier)) fs.mkdirSync(dossier, { recursive: true })

        const nomImage = Date.now() + ".webp"
        const cheminFinal = path.join(dossier, nomImage)

        await sharp(file.filepath)
            .webp({ quality: 80 })
            .toFile(cheminFinal)

        res.json({ ok: true, nom: nomImage })
        } catch (e) {
        res.status(500).json({ error: "Erreur traitement image", details: e.message })
        }
  })
})*/



module.exports = router