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
        const iddevice = subscription.iddevice;
        const query = `DELETE FROM device WHERE iddevice = ?`;
        const keys = [iddevice];
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

    query = `SELECT sesion.latitude, sesion.longitude, sesion.accuracy, sesion.modified_at, u.usuario, u.email FROM sesion INNER JOIN si_user AS u ON u.idsi_user = sesion.si_user_idsi_user WHERE sesion.latitude != '' AND sesion.longitude != ''`;
    keys = [];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían sesiones.'});
        else {
            console.log('resultSesion', resultSesion);
            return next(null, { success: true, result: resultSesion, message: 'Registros de sesión leidos correctamente' });
        }
    });
};

Api.sesionPosicion = (coords, idsesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE sesion SET latitude = ?, longitude = ?, accuracy = ? WHERE idsesion = ?`;
    keys = [coords.latitude, coords.longitude, coords.accuracy, idsesion];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba la sesión'});
        else {
            console.log('resultSesion', resultSesion);
            return next(null, { success: true, result: resultSesion, message: 'Registro de sesión actualizado correctamente' });
        }
    });
};

Api.cerrarSesion = (idsesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE sesion SET estado = 'DESCONECTADO'  WHERE si_user_idsi_user = ?`;
    keys = [created_by];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba la sesión'});
        else {
            // Si actualizó
            if (resultSesion.affectedRows) {
                const querySession = `INSERT INTO sesionestado SET sesion_idsesion = ?, estado = 'DESCONECTADO'`;
                const query = connection.query(querySession, [idsesion], (error, sesion_estado) => {

                    if(error) 
                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro de sesion estado'});
                    else {
                        return next(null, { success: true, result: resultSesion, message: 'Registro actualizado correctamente' });
                    }
                });
            }
        }
    });
};

Api.cerrarSesionByIdSesion = (sesion, idsesion, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    query = `UPDATE sesion SET estado = 'DESCONECTADO'  WHERE idsesion = ?`;
    keys = [idsesion];

    connection.query(query, keys, (error, resultSesion) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de servicio ubicación'});
        else {

            // Si actualizó
            if (resultSesion.affectedRows) {

                let querySession;
                querySession = `INSERT INTO sesion_estado SET idsesion = ?, estado = 'DESCONECTADO'`;
     
                const query = connection.query(querySession, [idsesion], (error, sesion_estado) => {
                    if(error) 
                        return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro de sesion chofer estado'});
                    else {
                        return next(null, { success: true, result: resultSesion, message: 'Registro actualizado correctamente' });
                    }
                });
            }
        }
    });
};

// Guarda token de device
Api.saveToken = (device, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];

    // INSERTAR DEVICE
    query = 'INSERT INTO device SET si_user_idsi_user = ?, token = ?, idrol = ?  ON DUPLICATE KEY UPDATE si_user_idsi_user = ?, token = ?, idrol = ?';
    keys = [device.iduser, JSON.stringify(device.token), device.idrol, device.iduser, JSON.stringify(device.token), device.idrol];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro de device'});
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
    query = `SELECT d.token FROM device as d WHERE idrol = 1`;

    keys = [];

    connection.query(query, keys, (error, subscribers) => {

        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leía el registro de devices' });
        else {

            /// webpush 
            const notificationPayload = {
                "notification": {
                    "body" : 'Revisar tu proyecto',
                    "title": "Alerta nueva",
                    "vibrate": [100, 50, 100],
                    "data": {
                        "dateOfArrival": Date.now(),
                        "primaryKey": 1,
                        "key_1" : 'NOTIFICACION'
                    },
                    "actions": [{
                        "action": "explore",
                        "title": "Ir a IberoilReportes"
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

    // SACAR TOKENS DE DEVICES
    query = `SELECT d.token, iddevice FROM device as d WHERE si_user_idsi_user IN (${si_users})`;
    keys = [];

    connection.query(query, keys, (error, subscribers) => {
        
        if (error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leía el registro de devices' });
        else {

            /// webpush 
            const notificationPayload = {
                "notification": {
                    "body" : mensaje,
                    "title": "Alerta Iberoil",
                    "vibrate": [100, 50, 100],
                    "icon":  "https://plataforma-iberoil.com/assets/icons/icon-192x192.png",
                    "data": {
                        "dateOfArrival": Date.now(),
                        "primaryKey": 1,
                        "key_1" : "NOTIFICACION"
                    },
                    "actions": [{
                        "action": "explore",
                        "title": "Ir a Iberoil Clientes"
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
