const router = require('express').Router()
const path = require('path')
const pool = require(path.join(process.cwd(), 'db.js'))
const fs = require('fs')
const session = require('express-session')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('users.db')
const bcrypt = require('bcrypt')
const logs = require(path.join(process.cwd(), 'utils', 'logs.js'))

router.post('/request/friend', async (req, res) => {
    const me = req.session.user.id
    const { user2Name } = req.body

    try {
        const userExists = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [user2Name]
        )

        if (userExists.rows.length === 0) {
            return res.json({ msg: "Utilisateur inexistant." })
        }

        const user2Id = userExists.rows[0].id

        if (me == user2Id) {
            return res.json({
                msg: "Impossible d'ajouter l'utilisateur en amis."
            })
        }

        const rel = await pool.query(
            `SELECT * FROM relation 
             WHERE (user_id = $1 AND user2_id = $2)
             OR (user_id = $2 AND user2_id = $1)`,
            [me, user2Id]
        )


        if (rel.rows.length > 0) {
            const r = rel.rows[0]

            if (r.state === 0) {
                return res.json({ msg: "Une demande d'ami est déjà en attente." })
            }

            if (r.state === 1) {
                return res.json({ msg: "Vous êtes déjà amis." })
            }

            return res.json({ msg: "Une relation existe déjà." })
        }

        await pool.query(
            `INSERT INTO relation (user_id, user2_id, state)
             VALUES ($1, $2, 0)`,
            [me, user2Id]
        )

        logs("Nouvelle demande d'ami", {
            desc : `${req.session.user.username} vous demande en ami sur CQLJ.`, 
            userId:  user2Id,
            public : true,
            link : "/friends"
        }) 
        return res.json({ msg: "Demande d'ami envoyée !", ok : true })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.get('/request/received', async (req, res) => {
    const me = req.session.user.id

    try {
        const received = await pool.query(
            `SELECT r.id, r.created_at, r.user_id, u.username 
             FROM relation r
             JOIN users u ON u.id = r.user_id
             WHERE r.user2_id = $1
             AND r.state = 0
             ORDER BY r.created_at DESC`,
            [me]
        )

        return res.json({
            data: received.rows,
            ok : true
        })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.get('/request/sent', async (req, res) => {
    const me = req.session.user.id

    try {
        const sent = await pool.query(
            `SELECT r.id, r.created_at, r.user2_id, u.username
             FROM relation r
             JOIN users u ON u.id = r.user2_id
             WHERE r.user_id = $1
             AND r.state = 0
             ORDER BY r.created_at DESC`,
            [me]
        )

        return res.json({
            data: sent.rows,
            ok: true
        })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.post('/request/accept', async (req, res) => {
    const me = req.session.user.id
    const { requestId } = req.body

    try {
        const rel = await pool.query(
            `SELECT * FROM relation
             WHERE id = $1
             AND user2_id = $2
             AND state = 0
             `,
            [requestId, me]
        )

        if (rel.rows.length === 0) {
            return res.json({ msg: "Impossible d'accepter cette demande." })
        }

        await pool.query(
            `UPDATE relation
             SET state = 1
             WHERE id = $1`,
            [requestId]
        )

        logs("Demande d'ami acceptée !", {
            desc : `${req.session.user.username} a accepté votre demande d'amis`, 
            userId:  rel.rows[0].user_id,
            public : true,
            link : "/friends"
        }) 

        return res.json({ msg: "Demande d'ami acceptée !", ok : true })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.get('/list', async (req, res) => {
    const me = req.session.user.id

    try {
        const friends = await pool.query(
            `
            SELECT 
                r.id,
                r.created_at,
                
                CASE 
                    WHEN r.user_id = $1 THEN r.user2_id
                    ELSE r.user_id
                END AS friend_id,
                
                u.username

            FROM relation r
            JOIN users u ON u.id = 
                CASE 
                    WHEN r.user_id = $1 THEN r.user2_id
                    ELSE r.user_id
                END

            WHERE (r.user_id = $1 OR r.user2_id = $1)
            AND r.state = 1

            ORDER BY r.created_at DESC
            `,
            [me]
        )

        return res.json({
            data: friends.rows, 
            ok : true
        })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.post('/remove', async (req, res) => {
    if (!req.session.user) {
        return res.json({
            msg : "Il faut être connecter"
        })
    }
    const me = req.session.user.id
    const { friendId } = req.body

    try {
        const rel = await pool.query(
            `SELECT id FROM relation
             WHERE state = 1
             AND (
                 (user_id = $1 AND user2_id = $2)
                 OR
                 (user_id = $2 AND user2_id = $1)
             )`,
            [me, friendId]
        )

        if (rel.rows.length === 0) {
            return res.json({ msg: "Vous n'êtes pas amis avec cet utilisateur." })
        }

        await pool.query(
            `DELETE FROM relation WHERE id = $1`,
            [rel.rows[0].id]
        )

        return res.json({ msg: "Ami retiré avec succès.", ok : true })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

router.post('/decline', async (req, res) => {
    if (!req.session.user) {
        return res.json({
            msg : "Il faut être connecter"
        })
    }
    const me = req.session.user.id
    const { requestId } = req.body

    try {
        const rel = await pool.query(
            `SELECT id FROM relation
             WHERE id = $1
             AND user2_id = $2
             AND state = 0`,
            [requestId, me]
        )

        if (rel.rows.length === 0) {
            return res.json({ msg: "Impossible de refuser cette demande." })
        }

        await pool.query(
            `DELETE FROM relation
             WHERE id = $1`,
            [requestId]
        )

        return res.json({ msg: "Demande d'ami refusée.", ok : true })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})







module.exports = router