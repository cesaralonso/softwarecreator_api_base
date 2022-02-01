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
            const idsi_sesion = auth_data.user.idsi_sesion;
            const coords = req.body;
            Api.sesionPosicion(coords, idsi_sesion, created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
        })(req, res, next); 
    })
    .post('/cerrar-sesion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const created_by = auth_data.user.idsi_user;
            const idsi_sesion = auth_data.user.idsi_sesion;
            Api.cerrarSesion(idsi_sesion, created_by, req.mysql, (error, data) =>{
                return Api.response(res, error, data);
            });
        })(req, res, next);
    })
    .post('/cerrar-sesion/:idsi_sesion', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');

            const sesion = req.body;
            const idsi_sesion = req.params.idsi_sesion;
            const created_by = auth_data.user.idsi_user;
            Api.cerrarSesionByIdSesion( sesion, idsi_sesion, created_by, req.mysql, (error, data) =>{
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
