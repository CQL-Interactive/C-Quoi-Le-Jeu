const router = require('express').Router()
const path = require('path')
const prisma = require(path.join(process.cwd(), 'db.js'))
const fs = require('fs')
const session = require('express-session')
const bcrypt = require('bcrypt')
const logs = require(path.join(process.cwd(), 'utils', 'logs.js'))

router.post('/request/friend', async (req, res) => {
    const me = req.session.user.id
    const { user2Name } = req.body

    try {
        const userExists = await prisma.users.findUnique({
            where: { username: user2Name },
            select: { id: true }
        });

        if (!userExists) {
            return res.json({ msg: "Utilisateur inexistant." })
        }

        const user2Id = userExists.id

        if (me == user2Id) {
            return res.json({
                msg: "Impossible d'ajouter l'utilisateur en amis."
            })
        }

        const rel = await prisma.relation.findFirst({
            where: {
                OR: [
                    { user_id: me, user2_id: user2Id },
                    { user_id: user2Id, user2_id: me }
                ]
            }
        });

        if (rel) {
            if (rel.state === 0) {
                return res.json({ msg: "Une demande d'ami est déjà en attente." })
            }

            if (rel.state === 1) {
                return res.json({ msg: "Vous êtes déjà amis." })
            }

            return res.json({ msg: "Une relation existe déjà." })
        }

        await prisma.relation.create({
            data: {
                user_id: me,
                user2_id: user2Id,
                state: 0
            }
        });

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
        const receivedRaw = await prisma.relation.findMany({
            where: {
                user2_id: me,
                state: 0
            },
            orderBy: { created_at: 'desc' }
        });
        
        const received = await Promise.all(receivedRaw.map(async r => {
            const u = await prisma.users.findUnique({ where: { id: r.user_id }, select: { username: true } });
            return {
                id: r.id,
                created_at: r.created_at,
                user_id: r.user_id,
                username: u ? u.username : null
            };
        }));

        return res.json({
            data: received,
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
        const sentRaw = await prisma.relation.findMany({
            where: {
                user_id: me,
                state: 0
            },
            orderBy: { created_at: 'desc' }
        });

        const sent = await Promise.all(sentRaw.map(async r => {
            const u = await prisma.users.findUnique({ where: { id: r.user2_id }, select: { username: true } });
            return {
                id: r.id,
                created_at: r.created_at,
                user2_id: r.user2_id,
                username: u ? u.username : null
            };
        }));

        return res.json({
            data: sent,
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
        const rel = await prisma.relation.findFirst({
            where: {
                id: parseInt(requestId),
                user2_id: me,
                state: 0
            }
        });

        if (!rel) {
            return res.json({ msg: "Impossible d'accepter cette demande." })
        }

        await prisma.relation.update({
            where: { id: parseInt(requestId) },
            data: { state: 1 }
        });

        logs("Demande d'ami acceptée !", {
            desc : `${req.session.user.username} a accepté votre demande d'amis`, 
            userId:  rel.user_id,
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
        const friendsRaw = await prisma.relation.findMany({
            where: {
                OR: [
                    { user_id: me },
                    { user2_id: me }
                ],
                state: 1
            },
            orderBy: { created_at: 'desc' }
        });
        
        const friends = await Promise.all(friendsRaw.map(async r => {
            const friend_id = r.user_id === me ? r.user2_id : r.user_id;
            const u = await prisma.users.findUnique({ where: { id: friend_id }, select: { username: true } });
            return {
                id: r.id,
                created_at: r.created_at,
                friend_id: friend_id,
                username: u ? u.username : null
            };
        }));

        return res.json({
            data: friends, 
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
        const rel = await prisma.relation.findFirst({
            where: {
                state: 1,
                OR: [
                    { user_id: me, user2_id: parseInt(friendId) },
                    { user_id: parseInt(friendId), user2_id: me }
                ]
            }
        });

        if (!rel) {
            return res.json({ msg: "Vous n'êtes pas amis avec cet utilisateur." })
        }

        await prisma.relation.delete({
            where: { id: rel.id }
        });

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
        const rel = await prisma.relation.findFirst({
            where: {
                id: parseInt(requestId),
                user2_id: me,
                state: 0
            }
        });

        if (!rel) {
            return res.json({ msg: "Impossible de refuser cette demande." })
        }

        await prisma.relation.delete({
            where: { id: parseInt(requestId) }
        });

        return res.json({ msg: "Demande d'ami refusée.", ok : true })

    } catch (err) {
        console.error(err)
        return res.json({ msg: "Erreur interne." })
    }
})

module.exports = router