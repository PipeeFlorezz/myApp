const { Router } = require('express');
const jwt = require('jsonwebtoken');
const Publication = require('../models/publicaciones');
const Follow = require('../models/follow');
const moment = require('moment');
moment.locale('es')

const PublicationRouter = new Router();

PublicationRouter.get('/', verify, async (req, res) => {
    /*let followeds = [];
    let follows = await Follow.find({follower: req.user}).populate('followed')
    console.log(follows);
    follows.forEach((follow) => {
        followeds.push(follow.followed);
        console.log(followeds); 
    });
    let publish = await Publication.find({user: {"$in": followeds}})
                                   .sort('-createdAt');*/


    let publish = await Publication.find()
        .sort('-createdAt')
        .populate('user')
    console.log('publicationRoutes: ' + publish);
    console.log('rutadepiblication/', req.user);
    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
    return res.json({ publications: [publish] });
});

PublicationRouter.post('/addPublish', verify, async (req, res) => {
    console.log(req.user);
    console.log('addPublication: ' + req.file);
    if (req.body.text) {
        console.log(req.body.text);
        const publication = new Publication();
        publication.user = req.user;
        publication.text = req.body.text;
        publication.created_At = moment().format('LLLL');
        publication.imagePublication = (req.file && req.file.filename) ? req.file.filename : '';
        let publishSaved = await publication.save();
        let Savedpublish = await Publication.findOne({ _id: publishSaved._id }).populate('user');

        return res.json({ Savedpublish });

    }
}); 

async function verify(req, res, next) {
    if (!req.headers.authorization) return res.json({ noToken: 'No hay token' });

    let token = req.headers.authorization.replace(/['"]+/g, '');
    if (token) {
        console.log('Token desde el verify Funcion' + token);
        let verifyToken = jwt.verify(token, 'secretkey');
        if (verifyToken) req.user = verifyToken.id;
    }
    next();
}

module.exports = PublicationRouter;