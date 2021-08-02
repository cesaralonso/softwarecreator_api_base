const connection = require('../config/db-connection');
const async = require('async');
const nodemailer = require('nodemailer');
const Api = require('./apps');

const dotenv = require('dotenv');
dotenv.config();

// NODE MAILER CONFIGURATION
let transport = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    auth: {
       user: process.env.NODEMAILER_AUTH_USER,
       pass: process.env.NODEMAILER_AUTH_PASS
    }
});


const Alerta = {};


Alerta.findFromTo = (fechaDesde, fechaHasta, created_by, ami, connection, next) => {
   if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    async.waterfall([
        next => {

            // PRIMERO LAS ENVIADAS
            if (created_by) {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_at BETWEEN ? AND ? AND alerta.created_by = ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [fechaDesde, fechaHasta, created_by];
            } else {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_at BETWEEN ? AND ? AND alerta.created_by = ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [fechaDesde, fechaHasta, +ami];
            }

            connection.query(query, keys, (error, enviadas) => {
                error ? next(error) : next(null, enviadas)
            });
        },
        (enviadas, next) => {

            // DESPUÉS LAS RECIBIDAS
            if (created_by) {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_at BETWEEN ? AND ? AND alerta.created_by = ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [fechaDesde, fechaHasta, created_by];
            } else {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_at BETWEEN ? AND ? AND  alerta.si_user_idsi_user = ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [fechaDesde, fechaHasta, +ami];
            }

            connection.query(query, keys, (error, recibidas) => {
                error ? next(error) : next(null, {'enviadas': enviadas, 'recibidas': recibidas})
            });
        },
        (result, next) => {

            const recibidas = result.recibidas;

            // RECIBIDAS LEIDAS
            async.each(recibidas, (recibida, nextIteration) => {
                
                // ACTUALIZA
                if (created_by) {
                    query = 'UPDATE alerta SET vista = true WHERE idalerta = ?';
        
                    keys = [recibida.idalerta];
                } else {
                    query = 'UPDATE alerta SET vista = true WHERE idalerta = ?';
                    keys = [recibida.idalerta];
                }

                connection.query(query, keys, (error, refacciones) => {
                    error ? nextIteration(error) : nextIteration();
                });

            }, (error) => error ? next(error) : next(null, {
                'enviadas': result.enviadas,
                'recibidas': recibidas
            }) )
        }
    ],
    (error, result) => {
        if ( error )
            next({ success: false, error: error });
        else {
            next(null, { success: true, result: result, message: 'Notificaciones leídas' })
        }
    })
}

Alerta.all = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_by = ?  HAVING alerta.baja IS NULL OR alerta.baja = false`;
        keys = [created_by];
    } else {
        query = `SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user HAVING alerta.baja IS NULL OR alerta.baja = false`;
        keys = [];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Folio leíd@' });
    });
};

Alerta.allSeparadas = (created_by, ami, connection, next) => {
    if( !connection )
        return next('Connection refused');

    const date = new Date();
    const thisMonth = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';

    let query = '';
    let keys = [];
    
    async.waterfall([
        next => {

            // PRIMERO LAS ENVIADAS
            if (created_by) {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_by = ? AND alerta.created_at >= ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [created_by, thisMonth];
            } else {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_by = ? AND alerta.created_at >= ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [+ami, thisMonth];
            }

            connection.query(query, keys, (error, enviadas) => {
                error ? next(error) : next(null, enviadas)
            });
        },
        (enviadas, next) => {

            // DESPUÉS LAS RECIBIDAS
            if (created_by) {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.created_at >= ? AND alerta.created_by = ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [created_by, thisMonth];
            } else {
                query = 'SELECT urem.usuario as remitente, alerta.*, udes.usuario as si_user_si_user_idsi_user , udes.email as emailDestinatario, urem.email as emailRemitente, alerta.tipoAlerta as tipoalerta_tipoalerta_idtipoalerta FROM alerta INNER JOIN si_user as urem ON urem.idsi_user = alerta.created_by INNER JOIN si_user as udes ON udes.idsi_user = alerta.si_user_idsi_user WHERE alerta.si_user_idsi_user = ? AND alerta.created_at >= ? HAVING alerta.baja IS NULL OR alerta.baja = false ORDER BY alerta.created_at DESC';
                keys = [+ami, thisMonth];
            }

            connection.query(query, keys, (error, recibidas) => {
                error ? next(error) : next(null, {'enviadas': enviadas, 'recibidas': recibidas})
            });
        },
        (result, next) => {

            const recibidas = result.recibidas;

            // RECIBIDAS LEIDAS
            async.each(recibidas, (recibida, nextIteration) => {
                
                // ACTUALIZA
                if (created_by) {
                    query = 'UPDATE alerta SET vista = true WHERE idalerta = ?';
        
                    keys = [recibida.idalerta];
                } else {
                    query = 'UPDATE alerta SET vista = true WHERE idalerta = ?';
                    keys = [recibida.idalerta];
                }

                connection.query(query, keys, (error, refacciones) => {
                    error ? nextIteration(error) : nextIteration();
                });

            }, (error) => error ? next(error) : next(null, {
                'enviadas': result.enviadas,
                'recibidas': recibidas
            }) )    
        }
    ],
    (error, result) => {
        if ( error )
            next({ success: false, error: error });
        else {
            next(null, { success: true, result: result, message: 'Notificaciones leídas' })
        }
    })
};

Alerta.findById = (idAlerta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'SELECT * FROM alerta WHERE idalerta = ? AND created_by = ? HAVING baja IS NULL OR baja = false';
        keys = [idAlerta, created_by];
    } else {
        query = 'SELECT * FROM alerta WHERE idalerta = ? HAVING baja IS NULL OR baja = false';
        keys = [idAlerta];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se encontraba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible encontrar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Alerta encontrad@' });
    });
};

Alerta.count = (connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = 'SELECT COUNT(idalerta) AS count FROM alerta';
    keys = [];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Alerta contabilizad@' });
    });
};

Alerta.exist = (idAlerta, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = 'SELECT EXISTS(SELECT 1 FROM alerta WHERE idalerta = ?) AS exist';
    keys = [idAlerta];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Alerta verificad@' });
    });
};

Alerta.insert = (Alerta, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    const _alerta = {
            si_user_idsi_user: Alerta.si_user_idsi_user,
            tipoAlerta: Alerta.tipoAlerta,
            mensaje: Alerta.mensaje,
            created_by: Alerta.created_by,
            emailDestinatario: Alerta.emailDestinatario,
            leida: 0,
            vista: 0
        };

    let _enlace = '';
    if (Alerta.enlace) {
        _enlace = `<hr><p><a href="${process.env.APP_PRODURL}/#/${Alerta.enlace}">Ir hacia enlace</a>.</p>`;
    }

    query = 'INSERT INTO alerta SET ?';
    keys = [_alerta];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro' });
        else {

            const html = `
                <div style="text-align: center;">
                    <img alt="Logo" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="192">
                    <h2>${process.env.APP_NOMBRE}</h2>
                    <hr>
                    <h1>${(Alerta.titulo || Alerta.mensaje)}</h1>
                    <hr>
                    <p>${Alerta.mensaje}</p>
                    ${_enlace}
                    <hr>
                    <p>
                        <a href="${process.env.APP_PRODURL}">${process.env.APP_NOMBRE}</a>.
                    </p>
                    <p>
                        <i><strong>Por favor no respondas a este correo.</strong></i>
                    </p>
                </div>
            `;

            const message = {
                from: process.env.NODEMAILER_FROM,
                to: Alerta.emailDestinatario,
                subject: Alerta.titulo || Alerta.mensaje,
                text: Alerta.mensaje,
                html: html
            };

            transport.sendMail(message, function(err, info) {
                if (err) {
                    console.log('sendMail err', err)
                } else {
                    console.log('sendMail info', info);
                }
            });

            // AHORA LAS WEB PUSH
            Api.sendToIdusers( [Alerta.si_user_idsi_user], Alerta.mensaje, connection, (error, data) => {
                if (error) 
                    return next({ success: false, error: error, message: 'Un error mientras se creaba una push notification de la alerta creada.' });
                else {
                    return next(null, { success: true, result: result, message: 'Alerta y push notification creadas.' });
                }
            });
        }
    });
};

Alerta.notificarPorUsuarios = (Proyecto, mensaje, connection, next) => {
    let query = '';
    let keys = [];

    let _si_users;

    let titulo = '';
    let enlace = '';

    // SI MENSAJE ES ARRAY O STRING
    if (typeof mensaje === 'object') {
        const _mensaje = mensaje;
        titulo = _mensaje[0] || '';
        mensaje = _mensaje[1] || '';
        enlace = _mensaje[2] || '';
    }

    if (!Array.isArray(Proyecto.notificarUsuarios)){
        if (Proyecto.notificarUsuarios.indexOf(',')) {
            _si_users = Proyecto.notificarUsuarios.split(',');
        } else {
            _si_users = [Proyecto.notificarUsuarios];
        }
    } else {
        _si_users = Proyecto.notificarUsuarios;
        Proyecto.notificarUsuarios = Proyecto.notificarUsuarios.toString();
    }

    // POR CADA USUARIO CREAR UNA NOTIFICACIÓN
    if (_si_users.length) {

        let i = 0;
        _si_users.forEach(si_user => {

            const _alerta = {
                si_user_idsi_user: si_user.split('||')[0],
                tipoalerta_idtipoalerta: 1, // ALERTA DEL SISTEMA
                proyecto_idproyecto: Proyecto.proyecto_idproyecto,
                mensaje: mensaje,
                vista: 0,
                leida: 0,
                created_by: Proyecto.created_by
            };
                        
            query = 'INSERT INTO alerta SET ?';
            keys = [_alerta];

            connection.query(query, keys, (error, _alertaCreada) => {
                if (error) 
                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba la alerta' });
                else {
             
                    // SI EXISTE UN ENLACE
                    let _enlace = '';
                    if (enlace) {
                        _enlace = `<hr><p><a href="${process.env.APP_PRODURL}/#/${enlace}">Ir hacia enlace</a>.</p>`;
                    }

                    const html = `
                        <div style="text-align: center;">
                            <img alt="Logo" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="192">
                            <h2>${process.env.APP_NOMBRE}</h2>
                            <hr>
                            <p>${(titulo) ? titulo : mensaje}</p>
                            <hr>
                            <p>${mensaje}</p>
                            ${_enlace}
                            <hr>
                            <p>
                                <a href="${process.env.APP_PRODURL}">${process.env.APP_NOMBRE}</a>.
                            </p>
                            <p>
                                <i><strong>Por favor no respondas a este correo.</strong></i>
                            </p>
                        </div>
                    `;

                    // EMAIL
                    const message = {
                        from: process.env.NODEMAILER_FROM,
                        to: si_user.split('||')[1],
                        subject: (titulo) ? titulo : mensaje,
                        text: titulo,
                        html: html
                    };

                    transport.sendMail(message, function(err, info) {
                        if (err) {
                            i++;
                            if (i === _si_users.length) {
                                return next(null, { success: true, result: info, message: 'Alertas creadas.' });
                            }
                            console.log('notificarPorUsuarios sendMail err', err)
                        } else {

                            i++;
                            if (i === _si_users.length) {
                                // AHORA LAS WEB PUSH
                                Api.sendToIdusers( _si_users, mensaje, connection, (error, data) => {
                                    return next(null, { success: true, result: data, message: 'Alertas creadas.' });
                                });
                            }
                            console.log('sendMail info', info);
                        }
                    });
                }
            });
        });
    }
}

Alerta.notificarPorArea = (Proyecto, mensaje, connection, next) => {

    // BARRER AREAS Y OBTENER DE SIUSER LOS USUARIOS RELACIONADOS A ESTAS
    let query = '';
    let keys = [];

    let Areas;

    let titulo = '';
    let enlace = '';
    // SI MENSAJE ES ARRAY O STRING
    if (typeof mensaje === 'object') {
        const _mensaje = mensaje;
        titulo = _mensaje[0] || '';
        mensaje = _mensaje[1] || '';
        enlace = _mensaje[2] || '';
    }

    if (!Array.isArray(Proyecto.notificarArea)){
        if (Proyecto.notificarArea.indexOf(',')) {
            Areas = Proyecto.notificarArea.split(',');
        } else {
            Areas = [Proyecto.notificarArea];
        }
    } else {
        Areas = Proyecto.notificarArea;
        Proyecto.notificarArea = Proyecto.notificarArea.toString();
    }

    if (Areas.length) {

        query = `SELECT si_user.* FROM si_user WHERE e.area_idarea IN (${Areas})`;
        keys = [];

        connection.query(query, keys, (error, _si_users) => {
            if(error) 
                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro' });
            else {

                if (error) 
                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba notificación' });
                else if (_si_users.affectedRows === 0)
                    return next(null, { success: false, result: _si_users, message: 'Solo es posible actualizar registros propios' });
                else {

                    // POR CADA USUARIO CREAR UNA NOTIFICACIÓN
                    if (_si_users.length) {

                        let i = 0;
                        _si_users.forEach(si_user => {

                            const _alerta = {
                                si_user_idsi_user: si_user.idsi_user,
                                tipoAlerta: 'ALERTA', // ALERTA DEL SISTEMA
                                mensaje: mensaje,
                                vista: 0,
                                leida: 0,
                                created_by: Proyecto.created_by
                            };
                                        
                            query = 'INSERT INTO alerta SET ?';
                            keys = [_alerta];

                            connection.query(query, keys, (error, _alertaCreada) => {
                                if (error) 
                                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba la alerta' });
                                else {

                                    // SI EXISTE UN ENLACE
                                    let _enlace = '';
                                    if (enlace) {
                                        _enlace = `<hr><p><a href="${process.env.APP_PRODURL}/#/${enlace}">Ir hacia enlace</a>.</p>`;
                                    }

                                    const html = `
                                        <div style="text-align: center;">
                                            <img alt="Logo" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="192">
                                            <h2>${process.env.APP_NOMBRE}</h2>
                                            <hr>
                                            <p>${(titulo) ? titulo : mensaje}</p>
                                            <hr>
                                            <p>${mensaje}</p>
                                            ${_enlace}
                                            <hr>
                                            <p>
                                                <a href="${process.env.APP_PRODURL}">${process.env.APP_NOMBRE}</a>.
                                            </p>
                                            <p>
                                                <i><strong>Por favor no respondas a este correo.</strong></i>
                                            </p>
                                        </div>
                                    `;

                                    // EMAIL
                                    const message = {
                                        from: process.env.NODEMAILER_FROM,
                                        to: si_user.email,
                                        subject: (titulo) ? titulo : mensaje,
                                        text: titulo,
                                        html: html
                                    };

                                    transport.sendMail(message, function(err, info) {
                                        if (err) {
                                            i++;
                                            if (i === _si_users.length) {
                                                return next(null, { success: true, result: info, message: 'Alertas creadas.' });
                                            }
                                            console.log('notificarPorArea sendMail err', err)
                                        } else {
                                            i++;
                                            if (i === _si_users.length) {
                                                
                                                const userids = _si_users.map(user => user.idsi_user);

                                                // AHORA LAS WEB PUSH
                                                Api.sendToIdusers( userids, mensaje, connection, (error, data) => {
                                                    return next(null, { success: true, result: data, message: 'Alertas creadas.' });
                                                });

                                            }
                                            console.log('sendMail info', info);
                                        }
                                    });

                                }
                            });
                        });
                    } else {
                        return next(null, { success: true, result: _si_users, message: 'No se encontraron empleados para la o las áreas seleccionadas.' });
                    }
                }
            }
        });
    }
}

Alerta.marcarComoLeidas = async (Alerta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    if (Alerta.length) {
        if (created_by) {
            query = `UPDATE alerta SET leida = true WHERE idalerta IN (${Alerta.toString()}) AND created_by = ?`;
            keys = [created_by];
        } else {
            query = `UPDATE alerta SET leida = true WHERE idalerta IN (${Alerta.toString()})`;
            keys = [];
        }
        await connection.query(query, keys, (error, result) => {
            if(error) 
                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro.' });
            else if (result.affectedRows === 0)
                return next(null, { success: false, result: result, message: 'Solo es posible actualizar registros propios.' });
            else {
                return next(null, { success: true, result: Alerta, message: 'Alertas marcadas como leidas.' });
            }
        });
    }
};

Alerta.update = (Alerta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'UPDATE alerta SET ? WHERE idalerta = ? AND created_by = ?';
        keys = [Alerta, Alerta.idalerta, created_by];
    } else {
        query = 'UPDATE alerta SET ? WHERE idalerta = ?';
        keys = [Alerta, Alerta.idalerta];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible actualizar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Alerta actualizad@' });
    });
};

Alerta.remove = (idalerta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'DELETE FROM alerta WHERE idalerta = ? AND created_by = ?';
        keys = [idalerta, created_by];
    } else {
        query = 'DELETE FROM alerta WHERE idalerta = ?';
        keys = [idalerta];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Alerta eliminad@' });
    });
};

Alerta.logicRemove = (idalerta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'UPDATE alerta SET baja = 1 WHERE idalerta = ? AND created_by = ?';
        keys = [idalerta, created_by];
    } else {
        query = 'UPDATE alerta SET baja = 1 WHERE idalerta = ?';
        keys = [idalerta];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Alerta eliminad@' });
    });
};

Alerta.response = (res, error, data) => {
    if ( error )
        res.status(500).json(error);
    else
        res.status(200).json(data);
};

module.exports = Alerta;
