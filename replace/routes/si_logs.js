const router = require('express').Router();
const Log = require('../models/si_log');
const passport = require('passport');
const permissions = require('../config/permissions');

router
    .get('/from-to/:fechaDesde/:fechaHasta', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');

            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.findFromTo(req.params.fechaDesde, req.params.fechaHasta, created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    })
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/si_modulo/:idsi_modulo', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.findByIdSi_modulo(req.params.idsi_modulo, created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.all(created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/count', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Log.count(req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/exist/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Log.exist(req.params.id, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.findById(req.params.id, created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .delete('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'deleteable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.logicRemove(req.params.id, created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _log = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Log.update(_log, created_by, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
          if (!auth_data) {
               return next('auth_data refused');
          }
            permissions.module_permission(auth_data.modules, 'si_log', auth_data.user.super, 'writeable', (error, permission) => {
                if (permission.success) {
                    const _log = req.body;
                    _log.created_by = auth_data.user.idsi_user;
                    Log.insert( _log, req.mysql, (error, data) => {
                        return Log.response(res, error, data);
                    });
                } else {
                    return Log.response(res, error, permission);
                }
            });
        })(req, res, next);
    });

module.exports = router;
