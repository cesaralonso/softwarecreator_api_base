const Logs = require('../models/si_log');
const Alerta = require('../models/si_alerta');

const dotenv = require('dotenv');
dotenv.config();


const ResponseService = {};


ResponseService.sendAlert = (req, params, next) => {

  const alerta = {
      emailDestinatario: process.env.ALERTA_DEST_EMAIL,
      si_user_idsi_user:  process.env.ALERTA_DEST_SI_USER,
      mensaje: `${params.accion}: ${params.itemId}`,
      titulo: process.env.APP_NOMBRE,
      enlace: process.env.APP_PRODURL,
      tipoAlerta: 'ALERTA',
      created_by: params.created_by
  };

  console.log('alerta', alerta);

  if (!+process.env.ALERTAS) {
      return next();
  } else if (+process.env.ALERTAS) {
      // ENVIAR ALERTA (WEB-PUSH - EMAIL - NOTIFICACIÓN EN DB)
      Alerta.insert(alerta, req.mysql, (error, data) => {
          return next();
      });
  }

}

ResponseService.createLog = (req, params, next) => {

  const log = {
      si_modulo_idsi_modulo: params.idsi_modulo,
      accion: `${params.accion}: ${params.itemId}`,
      created_by: params.created_by
  };

  console.log('log', log);

  if (!+process.env.LOGS) {
      return next();
  } else {
      // GUARDAR EN LOGS
      Logs.insert(log, req.mysql, (error, data) => {
        return next();
      });
  }

}


module.exports = ResponseService;