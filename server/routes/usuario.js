const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const { verificaToken, verificaAdminRole } = require('../middlewares/authentication');

const app = express();

app.get('/usuario', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    let query = {
        estado: true,
    }

    Usuario.find(query, 'nombre email estado role google img')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            if(err) {
                return res.status(400).json({
                    ok: false,
                    err,
                });
            }

            Usuario.countDocuments(query, (err, total) => {
                res.json({
                    ok: true,
                    usuarios,
                    total,
                });
            });
        });
});

app.post('/usuario', [verificaToken, verificaAdminRole], function (req, res) {
    let body = req.body;
    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role,
    });

    usuario.save((err, userDB) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }
        
        res.json({
            ok: true,
            usuario: userDB,
        })
    });
});

app.put('/usuario/:id', [verificaToken, verificaAdminRole], function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, [
        'nombre', 'email', 'img', 'role', 'estado'
    ]);

    Usuario.findByIdAndUpdate(id, body,
        {new: true, runValidators: true},
        (err, usuarioDB) => {
            if(err) {
                return res.status(400).json({
                    ok: false,
                    err,
                });
            }
            if(!usuarioDB){
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Usuario no encontrado',
                    },
                });
            }
            res.json({
                ok: true,
                usuario: usuarioDB,
            });
        });
});

app.delete('/usuario/:id', [verificaToken, verificaAdminRole], function (req, res) {
    let id = req.params.id;

    Usuario.findByIdAndUpdate(id, {estado: false}, {new: true}, (err, usuario) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }
        if(!usuario){
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado',
                },
            });
        }
        res.json({
            ok: true,
            usuario,
        });
    });
});

module.exports = app;