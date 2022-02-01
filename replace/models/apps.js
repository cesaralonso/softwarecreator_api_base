const webpush = require('web-push');
const dotenv = require('dotenv');
dotenv.config();


const vapidKeys = {
    "publicKey": process.env.VAPID_PUBLIC_KEY,
    "privateKey": process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
    'mailto:x@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const Api = {};
// Borra una subscripción
Api.removeSubscription = async (subscription, connection, next) => {
  await new Promise((resolve, reject) => {
        const idsi_device = subscription.idsi_device;
        const query = `DELETE FROM si_device WHERE idsi_device = ?`;
        const keys = [idsi_device];
        connection.query(query, keys, (error, subscriberRemoved) => {  
            if (error) reject(error);
            resolve(subscriberRemoved);
        });
  });
};

Api.allSesion = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `SELECT si_sesion.latitude, si_sesion.longitude, si_sesion.accuracy, si_sesion.modified_at, u.usuario, u.email FROM si_sesion 
            INNER JOIN si_user AS u ON u.idsi_user = si_sesion.si_user_idsi_user 
            WHERE si_sesion.latitude != '' AND si_sesion.longitude != ''`;
    keys = [];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían si_sesiones.'});
        else {
            console.log('resultSesion', resultSesion);
            return next(null, { success: true, result: resultSesion, message: 'Registros de sesión leidos correctamente' });
        }
    });
};

Api.sesionPosicion = (coords, idsi_sesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE si_sesion SET latitude = ?, longitude = ?, accuracy = ? WHERE idsi_sesion = ?`;
    keys = [coords.latitude, coords.longitude, coords.accuracy, idsi_sesion];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba la sesión'});
        else {
            console.log('resultSesion', resultSesion);
            return next(null, { success: true, result: resultSesion, message: 'Registro de sesión actualizado correctamente' });
        }
    });
};

Api.cerrarSesion = (idsi_sesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE si_sesion SET estado = 'DESCONECTADO'  WHERE si_user_idsi_user = ?`;
    keys = [created_by];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba la sesión'});
        else {
            // Si actualizó
            if (resultSesion.affectedRows) {
                const querySession = `INSERT INTO si_sesionestado SET si_sesion_idsi_sesion = ?, estado = 'DESCONECTADO', created_by = ?`;
                const query = connection.query(querySession, [idsi_sesion, created_by], (error, si_sesionestado) => {

                    if(error) 
                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro de si_sesion estado'});
                    else {
                        return next(null, { success: true, result: resultSesion, message: 'Registro actualizado correctamente' });
                    }
                });
            }
        }
    });
};

Api.cerrarSesionByIdSesion = (sesion, idsi_sesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE si_sesion SET estado = 'DESCONECTADO'  WHERE idsi_sesion = ?`;
    keys = [idsi_sesion];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de servicio ubicación'});
        else {

            // Si actualizó
            if (resultSesion.affectedRows) {

                let querySession;
                querySession = `INSERT INTO si_sesionestado SET si_sesion_idsi_sesion = ?, estado = 'DESCONECTADO'`;
     
                const query = connection.query(querySession, [idsi_sesion], (error, si_sesionestado) => {
                    if(error) 
                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro de si_sesion chofer estado'});
                    else {
                        return next(null, { success: true, result: resultSesion, message: 'Registro actualizado correctamente' });
                    }
                });
            }
        }
    });
};

// Guarda token de si_device
Api.saveToken = (device, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    // INSERTAR si_DEVICE
    query = 'INSERT INTO si_device SET si_user_idsi_user = ?, token = ?, idrol = ?  ON DUPLICATE KEY UPDATE si_user_idsi_user = ?, token = ?, idrol = ?';
    keys = [device.iduser, JSON.stringify(device.token), si_device.idrol, si_device.iduser, JSON.stringify(device.token), si_device.idrol];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de si_device'});
        else
            return next(null, { success: true, result: result, message: 'Subcripción y sesión creados' });
    });
};

Api.sendToAllDevicesWebPush = (visita, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    // SELECCIONA SOLO ROL ADMINISTRADOR = 1
    query = `SELECT d.token FROM si_device as d WHERE idrol = 1`;

    keys = [];

    connection.query(query, keys, (error, subscribers) => {

        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leía el registro de si_devices' });
        else {

            /// webpush 
            const notificationPayload = {
                "notification": {
                    "body" : 'Revisar tu proyecto',
                    "title": "Alerta Nueva",
                    "vibrate": [100, 50, 100],
                    "data": {
                        "dateOfArrival": Date.now(),
                        "primaryKey": 1,
                        "key_1" : 'NOTIFICACION'
                    },
                    "actions": [{
                        "action": "explore",
                        "title": "Ir a " + process.env.APP_NOMBRE
                    }]
                }
            };

            Promise.all(subscribers.map(sub => webpush.sendNotification(
                JSON.parse(sub.token), JSON.stringify(notificationPayload) )))
                .then(() => {
                    return next(null, { success: true, result: subscribers, message: 'Newsletter sent successfully.' });
                })
                .catch(err => {
                    console.error("Error sending notification, reason: ", err);
                    return next({ success: false, error: err, message: 'Error sending notification.'});
                });

        }
    });
}

Api.sendToIdusers = (si_users, mensaje, connection, next) => {

    if (!connection)
        return next('Connection refused');

    let query = '';
    let keys = [];

    // SACAR TOKENS DE si_DEVICES
    query = `SELECT d.token, idsi_device FROM si_device as d WHERE si_user_idsi_user IN (${si_users})`;
    keys = [];

    connection.query(query, keys, (error, subscribers) => {
        
        if (error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leía el registro de si_devices' });
        else {

            /// webpush 
            const notificationPayload = {
                "notification": {
                    "body" : mensaje,
                    "title": "Alerta",
                    "vibrate": [100, 50, 100],
                    "icon":  process.env.APP_PRODURL + "/assets/icon/android-icon-192x192.png",
                    "data": {
                        "dateOfArrival": Date.now(),
                        "primaryKey": 1,
                        "key_1" : "NOTIFICACION"
                    },
                    "actions": [{
                        "action": "explore",
                        "title": "Ir a " + process.env.APP_NOMBRE
                    }]
                }
            };

            Promise.all(subscribers.map(sub => webpush.sendNotification(
                JSON.parse(sub.token), JSON.stringify(notificationPayload) ) // Enviamos la notificación
                    .then()
                    .catch(err => {
                        // Subscripción no válida, la borramos de la db
                        if (err.statusCode === 410) Api.removeSubscription(sub, connection, (data) =>{
                            console.log('Eliminada subscription', sub);
                            console.log('Eliminada data', data);
                        });

                    })))
                .then(() => {
                    return next(null, { success: true, result: subscribers, message: 'Push notifications enviadas.' });
                })
                .catch(err => {
                    console.error("Error sending notification, reason: ", err);
                    return next({ success: false, error: err, message: 'Error sending notification.'});
                });

        }
    });
}

Api.response = (res, error, data) => {
    if ( error )
        res.status(500).json(error);
    else
        res.status(200).json(data);
};



module.exports = Api;
