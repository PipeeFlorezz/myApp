const { Router } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/usuario');
const pagination = require('mongoose-pagination');
const router = new Router();
const Follow = require('../models/follow');
const Publication = require('../models/publicaciones')

router.get('/usuarios', verify, async (req, res) => {
    console.log('req.user: ' + req.user);

    let users = await User.find().sort('-createdAt');
    return res.json({usersNoPaginados: users});
    
});

router.get('/usuarios/:page', verify, async (req, res) => {
    console.log('req.user: ' + req.user);
    let page = req.params.page;
    if(!page){
        page = 1;
    }
    let itemPerPage = 5;
    await User.find().sort('-createdAt').paginate(page, itemPerPage, (err, users, total) => {
                if (err) return res.json({ response: 'Ha habido un error llamando a los usuarios' });
                return res.status(200).json({
                    users,
                    itemPerPage,
                    page,
                    total,
                    pages: Math.ceil(total / itemPerPage)
                });
            });
    
});

router.get('/estadisticas/:id', verify, async (req, res) => {
    let estadisticas = await getStas(req.params.id);
    console.log('ruta de estadisticas: ' + estadisticas);
    return res.json({stats: estadisticas});
});


async function getStas(userId){
    let followings = await Follow.count({follower: userId});
    let followeds = await Follow.count({followed: userId});
    let publications = await Publication.count({user: userId});
    console.log(followings, followeds, publications);
    return {
        followings,
        followeds,
        publications
    }
}

router.get('/usuario/:id', verify, async (req, res) => {
    let userId = req.params.id;
    console.log('ruta de usuario: ' + userId)
        let user = await User.findOne({ _id: userId });
        console.log('ruta de usuario, Userupdated: ' + user);
        return res.json({ user });

});

router.post('/peticionFetch', (req, res) => {
    console.lorg(req.body);
    return res.send({ response: 'accediendo a la ruta de fecth' });
});

router.post('/registro', async (req, res) => {
    console.log(req.file);
    console.log('Email: ' + req.body.email);
    console.log('Password: ' + req.body.password);
    let params = req.body;
    if (req.body.email && req.body.password && req.body.surname) {
        let userFound = await User.findOne({email: req.body.email, surname: req.body.surname});
        if(userFound){
            return res.json({userFound: 'Este usuario ya existe, registrate con otro'})
        }else {
            let user = new User(); 
            user.email = params.email;
            user.surname = params.surname;
            user.password = await user.encryptPassword(params.password);
            user.imagePath = (req.file && req.file.filename) ? req.file.filename : '';
            let userSaved = await user.save();
            console.log('Ruta de registro password encryptada' + userSaved.password);
            let token = await jwt.sign({ id: userSaved._id }, 'secretkey');
            return res.json([userSaved, token]);
        }
    } else {
        return res.json({ response: 'Es obligatorio mandar los datos, envialos' });
    }
});

router.post('/login', async (req, res) => {
    console.log(req.body);
    if (req.body.email && req.body.password) {
        let user = await User.findOne({ email: req.body.email });

        if (!user) return res.json({ noUser: 'Este Usuario no existe, registrate' });

        if (user) {
            let token = await jwt.sign({ id: user._id }, 'secretkey');
            return res.json([user, token]);
        }
    }else {
        return res.json({noDatos: 'Datos incompletos'})
    }

});

router.put('/subirImagen', verify, async (req, res) => {
    console.log(req.file);
    console.log('req.User: ' + req.user);
    console.log('subiendo Imagen: ' + req.file.filename);
    let userId = req.user;
    let userUpdated = await User.findByIdAndUpdate(userId, { imagePath: req.file.filename }, { new: true });
    console.log('Ruta de subiendo imagen: ' + userUpdated)
    return res.json({ userUpdated });
});


async function verify(req, res, next) {
    if (!req.headers.authorization) return res.json({ noToken: 'No hay token' });

    let token = req.headers.authorization.replace(/['"]+/g, '');
    if (token) {
        console.log('Token desde el verify Funcion' + token);
        let verifyToken = await jwt.verify(token, 'secretkey');
        console.log(verifyToken);
        if (verifyToken) req.user = verifyToken.id;
        console.log('verify token: ' + req.user)
    }
    next();
}

module.exports = router;