const router = require('express').Router();
const Alerta = require('../models/si_alerta');
const passport = require('passport');
const permissions = require('../config/permissions');

router
    .get('/from-to/:fechaDesde/:fechaHasta', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;

                    // DEBO ENVIAR EL CREATEDBY y idsi_user COMO IDENTIFICADOR DE QUEIN SOY PARA SABER COMO ORDENAR ENVIADAS Y RECIBIDAS......
                    const ami = auth_data.user.idsi_user;

                    Alerta.findFromTo(req.params.fechaDesde, req.params.fechaHasta, created_by, ami, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next); 
    })
    .get('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;

                    // DEBO ENVIAR EL CREATEDBY y idsi_user COMO IDENTIFICADOR DE QUEIN SOY PARA SABER COMO ORDENAR ENVIADAS Y RECIBIDAS......
                    const ami = auth_data.user.idsi_user;

                    Alerta.all(created_by, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/separadas', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;

                    // DEBO ENVIAR EL CREATEDBY y idsi_user COMO IDENTIFICADOR DE QUEIN SOY PARA SABER COMO ORDENAR ENVIADAS Y RECIBIDAS......
                    const ami = auth_data.user.idsi_user;

                    Alerta.allSeparadas(created_by, ami, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/count', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Alerta.count(req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/exist/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Alerta.exist(req.params.id, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Alerta.findById(req.params.id, created_by, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .delete('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'deleteable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Alerta.logicRemove(req.params.id, created_by, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/marcarcomoleidas', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _alerta = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Alerta.marcarComoLeidas(_alerta, created_by, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _alerta = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Alerta.update(_alerta, created_by, req.mysql, (error, data) => {
                        return Alerta.response(res, error, data);
                    })
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'si_alerta', auth_data.user.super, 'writeable', (error, permission) => {
                if (permission.success) {
                    const _alerta = req.body;
                    _alerta.created_by = auth_data.user.idsi_user;
                    // Separar lo que es por áreas y lo que va a un solo usuario
                    if (_alerta.notificarArea) {
                        Alerta.notificarPorArea(_alerta, _alerta.mensaje, req.mysql, (error, data) => {
                            return Alerta.response(res, error, data);
                        });
                    } else {
                        Alerta.insert( _alerta, req.mysql, (error, data) => {
                            return Alerta.response(res, error, data);
                        });
                    }
                } else {
                    return Alerta.response(res, error, permission);
                }
            });
        })(req, res, next);
    })

module.exports = router;
