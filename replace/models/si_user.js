const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const mySecretPass = process.env.SECRET_PASSWORD;
const nodemailer = require('nodemailer');

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


const Si_user = {};






Si_user.cambiaPassword = (email, code, user, connection, next) => {
    if( !connection )
        return next('Connection refused');

    // VERIFICA PASSWORDS IGUALES
    if (user.password && user.passwordRe && user.password === user.passwordRe) {

        let query = ``;
        let keys = [];
        query = `SELECT EXISTS(SELECT 1 FROM si_user WHERE email = ? AND code = ?) AS exist`;
        keys = [email, code];
    
        connection.query(query, keys, (error, result) => {
            if(error) 
                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros de usuarios' });
            else {
    
                // Hash password
                bcrypt.hash(user.password, saltRounds)
                .then( hash => {
                    user.password = hash;

                    // ACTUALIZA PASSWORD
                    let querySesion = `UPDATE si_user SET password = ? WHERE email = ? AND code = ? AND status != 'SUSPENDIDO'`;
                    let keys = [user.password, email, code];

                    connection.query(querySesion, keys, (error, resultUpdate) => {
                        if(error) 
                            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se modificaba el usuario'});
                        else {
                            return next(null, { success: true, result: resultUpdate, message: '¡La nueva contraseña ha sido correctamente establecida!.' });
                        }
                    });

                })
                .catch( error => next({ success: false, error: error }) );

            }
    
        });

    } else {
        return next(null, { success: false, result: {email: email, code: code, user: user}, message: 'Verifique que los nuevos passwords coincidan.' });
    }
};

Si_user.forgotRenewPassword = (email, connection, next) => {
    if ( !connection )
        return next('Connection refused');

    const query = connection.query(`SELECT code, email
                                    FROM si_user 
                                    WHERE email = ? AND status != 'SUSPENDIDO' AND (is_deleted IS NULL OR is_deleted = false)`, 
    [email], (error, result) => {

        if ( error )
            return next( error );

        const user =  result[0];
        
        if ( user ) {

            // EMAIL
            const email = user.email;
            const code = user.code;
            const subject = `Renueva tu contraseña | ${process.env.APP_NOMBRE}`;
            const mensaje = `¡Renueva tu contraseña en ${process.env.APP_NOMBRE}!, debes ingresar a la siguiente liga para confirmar tu correo en un lapso menor a 30 minutos a partir de la creación del usuario. Liga: ${process.env.APP_PRODURL}/renueva-tu-password.php?code=${code}&email=${email}`;
            const html = `
                <div style="text-align: center;">
                    <img alt="Logo ${process.env.APP_NOMBRE}" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="200">
                    <h2>${process.env.APP_NOMBRE}</h2>
                    <h1>¡Renueva tu contraseña en ${process.env.APP_NOMBRE}!</h1>
                    <p>Debes ingresar a la siguiente
                        <a href="${process.env.APP_PRODURL}/renueva-tu-password.php?code=${code}&email=${email}">liga (${process.env.APP_PRODURL}/renueva-tu-password.php?code=${code}&email=${email})</a> para renovar tu contraseña.
                    </p>
                    <hr>
                    <p>
                        <i><strong>Por favor no respondas a este correo.</strong></i>
                    </p>
                </div>
            `;

            const message = {
                from: process.env.NODEMAILER_FROM,
                to: email,
                subject: subject,
                text: mensaje,
                html: html
            };

            transport.sendMail(message, function(err, info) {
                if (err) {
                    console.log('sendMail err', err)
                    return next(null, { success: false, result: err, message: 'No se pudo enviar el correo al usuario.' });
                } else {
                    console.log('sendMail info', info);
                    
                    // RETURN
                    return next( null, {
                        success: true,
                        result: result,
                        message: `¡Solicitud de cambio de contraseña exitosa!, un email con instrucciones para continuar se ha enviado al correo ${email}.`
                    });
                }
            });

        } else {
            return next(null, {
                success: false,
                message: 'El email no se encuentra.'
            })
        }
    });
}

Si_user.forgot = (user, connection, next) => {
    if ( !connection )
        return next('Connection refused');

        const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const code = key.substring(0, 8) + key.substring(8, 12) + key.substring(12, 16) + key.substring(16, 20);

        // Hash password
        bcrypt.hash(code, saltRounds)
        .then( hash => {
            user.password = hash;

            query = 'UPDATE si_user SET password = ? WHERE email = ?';
            keys = [user.password, user.email];

            connection.query(query, keys, (error, result) => {
                
                if(error) 
                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba password provisional.'});
                else {

                    if (result.result.affectedRows) {

                        // EMAIL
                        const email = user.email;
                        const subject = `Recordar tu contraseña | ${process.env.APP_NOMBRE}`;
                        const mensaje = `Hemos cambiado tu contraseña provisionalmente por la siguiente: ${code}`;
                        const html = `
                            <div style="text-align: center;">
                                <img alt="Logo" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="200">
                                <h2>${process.env.APP_RAZONSOCIAL}</h2>
                                <h1>¡Recordar tu contraseña!</h1>
                                <p>Hemos cambiado tu contraseña provisionalmente por la siguiente: ${code}. 
                                </p>
                                <hr>
                                <p>
                                    <i><strong>Por favor no respondas a este correo.</strong></i>
                                </p>
                            </div>
                        `;

                        const message = {
                            from: process.env.NODEMAILER_FROM,
                            to: email,
                            subject: subject,
                            text: mensaje,
                            html: html
                        };

                        transport.sendMail(message, function(err, info) {
                            if (err) {
                                console.log('sendMail err', err)
                                return next( err );
                            } else {
                                console.log('sendMail info', info);

                                // RETURN
                                return next( null, {
                                    success: true,
                                    result: result,
                                    message: `¡Se ha enviado un correo a ${email} que debes revisar para continuar!.`
                                });


                            }
                        });

                    } else {

                        // RETURN
                        return next( null, {
                            success: true,
                            result: {},
                            message: `¡Correo no encontrado!.`
                        });

                    }

                }
            });
        });
}

Si_user.insert = (user, connection, next) => {
    if ( !connection )
        return next('Connection refused');
    // Hash password
    bcrypt.hash(user.password, saltRounds)
    .then( hash => {
        user.password = hash;
        const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const code = key.substring(0, 8) + key.substring(8, 12) + key.substring(12, 16) + key.substring(16, 20);
        user.code = code;
        
        // Insert into table
        connection.query('INSERT INTO si_user SET ?', [user], ( error, result ) => {
            if ( error ) {
                // WARNING: To take effect, user table must have the email field as unique column
                if (error.code === 'ER_DUP_ENTRY') {
                    return next( null, {
                        success: false,
                        error: error,
                        message: 'Este email ya esta en uso'
                    });
                } else
                    return next({ success: false, error: error });
            }   

            // EMAIL
            const email = user.email;
            const subject = `Confirma tu correo | ${process.env.APP_NOMBRE}`;
            const mensaje = `¡Bienvenido a ${process.env.APP_NOMBRE}!, debes ingresar a la siguiente liga para confirmar tu correo en un lapso menor a 30 minutos a partir de la creación del usuario. Liga: ${process.env.APP_PRODURL}/ingresa-tu-codigo-registro.php?code=${code}`;
            const html = `
                <div style="text-align: center;">
                    <img alt="Logo" src="${process.env.APP_PRODURL}/assets/img/logo.png" width="200">
                    <h2>${process.env.APP_RAZONSOCIAL}</h2>
                    <h1>¡Bienvenido a  ${process.env.APP_NOMBRE}!</h1>
                    <p>Debes ingresar a la siguiente
                    <a href="${process.env.APP_PRODURL}/ingresa-tu-codigo-registro.php?code=${code}&email=${email}">liga (${process.env.APP_PRODURL}/ingresa-tu-codigo-registro.php?code=${code}&email=${email})</a> para confirmar tu correo en un lapso menor a 30 minutos a partir de la creación del usuario.
                    </p>
                    <hr>
                    <p>
                        <i><strong>Por favor no respondas a este correo.</strong></i>
                    </p>
                </div>
            `;

            const message = {
                from: process.env.NODEMAILER_FROM,
                to: email,
                subject: subject,
                text: mensaje,
                html: html
            };

            transport.sendMail(message, function(err, info) {
                if (err) {
                    console.log('sendMail err', err)
                    return next( err );
                } else {
                    console.log('sendMail info', info);
                }
            });

            // RETURN
            return next( null, {
                success: true,
                result: result,
                message: `¡Registro exitoso!, un email con código de confirmación se ha enviado al correo ${email}.`
            });
        })
    })
    .catch( error => next({ success: false, error: error }) );
}

Si_user.login = (email, password, connection, next) => {
    if ( !connection )
        return next('Connection refused');

    const query = connection.query(`SELECT si_user.* 
                                    FROM si_user 
                                    WHERE email = ? AND status != 'SUSPENDIDO' 
                                    HAVING is_deleted IS NULL OR is_deleted = false`, 
    [email], (error, result) => {


        if ( error )
            return next( error );

        const user =  result[0];
        
        if ( user ) {
            const hash = user.password.toString();
            bcrypt.compare(password, hash, ( error, res ) => {
                if ( res ) {

                    let _super = user.super;
                    let _query = '';

                    user.password = null;
                    
                    if (!_super) {
                        _query = `SELECT m.nombre, p.acceso, m.is_deleted, p.writeable, p.deleteable, p.readable, p.updateable, p.write_own, p.delete_own, p.read_own, p.update_own
                                    FROM si_user as u 
                                    INNER JOIN si_rol as r ON r.idsi_rol = u.si_rol_idsi_rol 
                                    INNER JOIN si_permiso as p ON p.si_rol_idsi_rol = r.idsi_rol 
                                    INNER JOIN si_modulo as m ON m.idsi_modulo = p.si_modulo_idsi_modulo 
                                    WHERE u.idsi_user = ? HAVING m.is_deleted IS NULL OR m.is_deleted = false`;
                    } else {
                        _query = `SELECT m.nombre FROM si_modulo as m`;
                    }

                    const query = connection.query(_query, [user.idsi_user], (error, modules) => {

                        if ( error )
                            return next( error );
                        if (_super) {
                            modules.forEach(element => {
                                element.acceso = 1;
                                element.writeable = 1;
                                element.deleteable = 1;
                                element.readable = 1;
                                element.updateable = 1;
                                element.write_own = 0;
                                element.delete_own = 0;
                                element.read_own = 0;
                                element.update_own = 0;
                            });
                        }

                        // PASAR DE PENDIENTE A ACTIVO UN USUARIO
                        let querySesion = `UPDATE si_user SET status = 'ACTIVO'  WHERE idsi_user = ? AND status = 'PENDIENTE'`;
                        let keys = [user.idsi_user];

                        connection.query(querySesion, keys, (error, result) => {
                            
                            if(error) 
                                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se modificaba el estado de usuario'});
                            else {

                                // INSERTAR AQUÍ MISMO LA SESIÓN
                                querySesion = 'INSERT INTO si_sesion SET si_user_idsi_user = ?, estado=\'CONECTADO\', created_by = ? ON DUPLICATE KEY UPDATE si_user_idsi_user = ?, estado=\'CONECTADO\'';
                                keys = [user.idsi_user, user.idsi_user, user.idsi_user];

                                connection.query(querySesion, keys, (error, result) => {
                                    
                                    if(error) 
                                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de sesión'});
                                    else {

                                        // TOMAR ID DE SESIÓN...
                                        querySesion = 'SELECT idsi_sesion FROM si_sesion WHERE si_user_idsi_user = ?';
                                        keys = [user.idsi_user];

                                        connection.query(querySesion, keys, (error, resultSesion) => {
                                            
                                            if(error) 
                                                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de sesión'});
                                            else {

                                                // INSERTAR SESIÓN ESTADO
                                                querySesion = `INSERT INTO si_sesionestado SET si_sesion_idsi_sesion = ?, estado = 'CONECTADO', created_by = ?`;
                                                connection.query(querySesion, [resultSesion[0].idsi_sesion, user.idsi_user], (error, si_sesion_estado) => {

                                                    if(error) 
                                                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro de si_sesion estado'});
                                                    else {

                                                        const payload = {
                                                            idsi_user: user.idsi_user,
                                                            usuario: user.usuario,
                                                            email: user.email,
                                                            idrol: user.si_rol_idsi_rol,
                                                            nombre: user.nombre,
                                                            idcliente: user.idcliente || 0,
                                                            super: user.super || 0,
                                                            idsesion: resultSesion[0].idsi_sesion
                                                        };

                                                        // Generate token
                                                        const token = jwt.sign(payload, mySecretPass, {
                                                            expiresIn: 60 * 60 * 24 * 365
                                                        });

                                                        return next( null, {
                                                            success: true,
                                                            message: 'Has iniciado sesión correctamente',
                                                            token: token,
                                                            modules: modules,
                                                            iduser: user.idsi_user,
                                                            idrol: user.si_rol_idsi_rol,
                                                            email: user.email,
                                                            user: user,
                                                            idcliente: user.idcliente || 0,
                                                            nombre: user.nombre,
                                                            idsesion: resultSesion[0].idsi_sesion
                                                        });

                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                } else
                    return next(null, {
                        success: false,
                        message: 'Password incorrecto'
                    });
            });
        } else {
            return next(null, {
                success: false,
                message: 'El email y password no coinciden'
            })
        }
    });
}

Si_user.all = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat  FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        WHERE created_by = ? HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [created_by];
    } else {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user leíd@' });
    });
};

Si_user.allRolClientes = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        WHERE created_by = ? AND si_rol.nombre = 'CLIENTE' HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [created_by];
    } else {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        WHERE si_rol.nombre = 'CLIENTE' HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user leíd@' });
    });
};

Si_user.allClientes = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        INNER JOIN cliente as c ON c.si_user_idsi_user = si_user.idsi_user
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        WHERE created_by = ? HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [created_by];
    } else {
        query = `SELECT si_user.*, si_rol.nombre as si_rol_si_rol_idsi_rol, si_sesion.estado as si_sesionestado, si_sesion.modified_at as si_sesionmodifiedat FROM si_user 
        INNER JOIN si_rol on si_rol.idsi_rol = si_user.si_rol_idsi_rol 
        INNER JOIN cliente as c ON c.si_user_idsi_user = si_user.idsi_user
        LEFT JOIN si_sesion on si_sesion.si_user_idsi_user = si_user.idsi_user
        HAVING si_user.is_deleted IS NULL OR si_user.is_deleted = false`;
        keys = [];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user leíd@' });
    });
};

Si_user.findById = (idSi_user, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'SELECT * FROM si_user WHERE idsi_user = ? AND created_by = ? HAVING is_deleted IS NULL OR is_deleted = false';
        keys = [idSi_user, created_by];
    } else {
        query = 'SELECT * FROM si_user WHERE idsi_user = ? HAVING is_deleted IS NULL OR is_deleted = false';
        keys = [idSi_user];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se encontraba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible encontrar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user encontrad@' });
    });
};

Si_user.findBySiRol = (idSi_rol, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'SELECT * FROM si_user WHERE si_rol_idsi_rol = ? AND created_by = ? HAVING is_deleted IS NULL OR is_deleted = false';
        keys = [idSi_rol, created_by];
    } else {
        query = 'SELECT * FROM si_user WHERE si_rol_idsi_rol = ? HAVING is_deleted IS NULL OR is_deleted = false';
        keys = [idSi_rol];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se encontraba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible encontrar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user encontrad@' });
    });
};

Si_user.count = (connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = 'SELECT COUNT(idsi_user) AS count FROM si_user';
    keys = [];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Si_user contabilizad@' });
    });
};

Si_user.verifica = (email, code, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = 'SELECT EXISTS(SELECT 1 FROM si_user WHERE email = ? AND code = ? AND  code_at < DATE_ADD( NOW(), INTERVAL 30 MINUTE )) AS exist';
    keys = [email, code];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else {

            // PASAR DE NOVALIDO A PENDIENTE
            let querySesion = `UPDATE si_user SET status = 'PENDIENTE' WHERE email = ? AND code = ? AND status = 'NOVALIDADO'`;
            let keys = [email, code];

            connection.query(querySesion, keys, (error, resultUpdate) => {
                if(error) 
                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se modificaba el estado de usuario'});
                else {
                    return next(null, { success: true, result: resultUpdate, message: 'Usuario correctamente verificado.' });
                }
            });
        }
        // return next(null, { success: true, result: result, message: 'Si_user verificad@' });
    });
};

Si_user.exist = (idSi_user, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = 'SELECT EXISTS(SELECT 1 FROM si_user WHERE idsi_user = ?) AS exist';
    keys = [idSi_user];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Si_user verificad@' });
    });
};

Si_user.update = (Si_user, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');
    
    let query = '';
    let keys = [];
    if (created_by) {
        query = 'UPDATE si_user SET ? WHERE idsi_user = ? AND created_by = ?';
        keys = [Si_user, Si_user.idsi_user, created_by];
    } else {
        query = 'UPDATE si_user SET ? WHERE idsi_user = ?';
        keys = [Si_user, Si_user.idsi_user];
    }

    if (Si_user.password) {

        // Hash password
        bcrypt.hash(Si_user.password, saltRounds)
        .then( hash => {
            Si_user.password = hash;

            connection.query(query, keys, (error, result) => {
                if(error) 
                    return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro' });
                else if (result.affectedRows === 0)
                    return next(null, { success: false, result: result, message: 'Solo es posible editar registros propios' });
                else
                    return next(null, { success: true, result: result, message: 'Usuario actualizado' });
            });
        });
    } else {
        const user = {
            'idsi_user': Si_user.idsi_user,
            'email': Si_user.email,
            'usuario': Si_user.usuario,
            'si_rol_idsi_rol': Si_user.si_rol_idsi_rol
        };

        connection.query(query, [user, Si_user.idsi_user], (error, result) => {
            if(error) 
                return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro' });
            else if (result.affectedRows === 0)
                return next(null, { success: false, result: result, message: 'Solo es posible editar registros propios' });
            else {
                return next(null, { success: true, result: result, message: 'Usuario actualizado' });
            }
        });
    }
};

Si_user.remove = (idsi_user, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'DELETE FROM si_user WHERE idsi_user = ? AND created_by = ?';
        keys = [idsi_user, created_by];
    } else {
        query = 'DELETE FROM si_user WHERE idsi_user = ?';
        keys = [idsi_user];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user eliminad@' });
    });
};

Si_user.logicRemove = (idsi_user, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = 'UPDATE si_user SET is_deleted = 1, email = code WHERE idsi_user = ? AND created_by = ?';
        keys = [idsi_user, created_by];
    } else {
        query = 'UPDATE si_user SET is_deleted = 1, email = code WHERE idsi_user = ?';
        keys = [idsi_user];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Si_user eliminad@' });
    });
};

Si_user.response = (res, error, data) => {
    if (error)
        res.status(500).json(error);
    else
        res.status(200).json(data);
}

module.exports = Si_user;
