const router = require('express').Router();
const Api = require('../models/apps');
const passport = require('passport');


router
    .get('/sesion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const created_by = auth_data.user.idsi_user;
            Api.allSesion(created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
        })(req, res, next);
    })
    .post('/sesion-posicion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const created_by = auth_data.user.idsi_user;
            const idsesion = auth_data.user.idsesion;
            const coords = req.body;
            Api.sesionPosicion(coords, idsesion, created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
        })(req, res, next); 
    })
    .post('/cerrar-sesion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const created_by = auth_data.user.idsi_user;
            const idsesion = auth_data.user.idsesion;
            Api.cerrarSesion(idsesion, created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
        })(req, res, next);
    })
    .post('/cerrar-sesion/:idsesion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const sesion = req.body;
            const idsesion = req.params.idsesion;
            const created_by = auth_data.user.idsi_user;
            Api.cerrarSesionByIdSesion( sesion, idsesion, created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
                
        })(req, res, next);
    })
    .post('/save-token', (req, res, next) => {
        let device = req.body;
        Api.saveToken( device, req.mysql, (error, data) =>{
            return Api.response(res, error, data);
        });
    })
    .post('/send-to-all-devices', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            const created_by = auth_data.user.idsi_user;
            Api.sendToAllDevicesWebPush( created_by, req.body, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });

        })(req, res, next);
    });

module.exports = router;
