const Log = {};

Log.findByIdSi_modulo = (idSi_modulo, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   WHERE si_log.si_modulo_idsi_modulo = ? AND si_log.created_by = ? HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false`;
        keys = [idSi_modulo, created_by];
    } else {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   WHERE si_log.si_modulo_idsi_modulo = ? HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false`;
        keys = [idSi_modulo];
    }

    connection.query(query, keys, (error, result) => {
        if(error)
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se encontraba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible encontrar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log encontrad@' });
    });
};

Log.findFromTo = (fechaDesde, fechaHasta, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   WHERE si_log.created_at BETWEEN ? AND ?  si_log.created_by = ? HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false`;
        keys = [fechaDesde, fechaHasta, created_by];
    } else {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   WHERE si_log.created_at BETWEEN ? AND ? HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false`;
        keys = [fechaDesde, fechaHasta];
    }
    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log leíd@' });
    });
};

Log.all = (created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   
        WHERE si_log.created_at >= (DATE_FORMAT(si_log.created_at, "%Y-%m-01")) AND si_log.created_by = ? HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false
        ORDER BY created_at DESC`;
        keys = [created_by];
    } else {
        query = `SELECT si_log.*, _si_modulo_idsi_modulo.nombre as si_modulo_si_modulo_idsi_modulo, _si_user.usuario as created_by FROM si_log 
                    INNER JOIN si_user as _si_user ON _si_user.idsi_user = si_log.created_by 
                    INNER JOIN si_modulo as _si_modulo_idsi_modulo ON _si_modulo_idsi_modulo.idsi_modulo = si_log.si_modulo_idsi_modulo   
        WHERE si_log.created_at >= (DATE_FORMAT(si_log.created_at, "%Y-%m-01")) HAVING si_log.is_deleted IS NULL OR si_log.is_deleted = false
        ORDER BY created_at DESC`;
        keys = [];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible leer registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log leíd@' });
    });
};

Log.findById = (idLog, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `SELECT * FROM si_log WHERE idlog = ? AND created_by = ? HAVING is_deleted IS NULL OR is_deleted = false`;
        keys = [idLog, created_by];
    } else {
        query = `SELECT * FROM si_log WHERE idlog = ? HAVING is_deleted IS NULL OR is_deleted = false`;
        keys = [idLog];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se encontraba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible encontrar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log encontrad@' });
    });
};

Log.count = (connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = `SELECT COUNT(idlog) AS count FROM si_log`;
    keys = [];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Log contabilizad@' });
    });
};

Log.exist = (idLog, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = `SELECT EXISTS(SELECT 1 FROM si_log WHERE idlog = ?) AS exist`;
    keys = [idLog];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se leían registros' });
        else
            return next(null, { success: true, result: result, message: 'Log verificad@' });
    });
};

Log.insert = (Log, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    query = `INSERT INTO si_log SET ?`;
    keys = [Log];

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se creaba el registro' });
        else
            return next(null, { success: true, result: result, message: 'Log cread@' });
    });
};

Log.update = (Log, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `UPDATE si_log SET ? WHERE idlog = ? AND created_by = ?`;
        keys = [Log, Log.idlog, created_by];
    } else {
        query = `UPDATE si_log SET ? WHERE idlog = ?`;
        keys = [Log, Log.idlog];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se actualizaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible actualizar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log actualizad@' });
    });
};

Log.remove = (idlog, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `DELETE FROM si_log WHERE idlog = ? AND created_by = ?`;
        keys = [idlog, created_by];
    } else {
        query = `DELETE FROM si_log WHERE idlog = ?`;
        keys = [idlog];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log eliminad@' });
    });
};

Log.logicRemove = (idlog, created_by, connection, next) => {
    if( !connection )
        return next('Connection refused');

    let query = '';
    let keys = [];
    if (created_by) {
        query = `UPDATE si_log SET is_deleted = 1 WHERE idlog = ? AND created_by = ?`;
        keys = [idlog, created_by];
    } else {
        query = `UPDATE si_log SET is_deleted = 1 WHERE idlog = ?`;
        keys = [idlog];
    }

    connection.query(query, keys, (error, result) => {
        if(error) 
            return next({ success: false, error: error, message: 'Un error ha ocurrido mientras se eliminaba el registro' });
        else if (result.affectedRows === 0)
            return next(null, { success: false, result: result, message: 'Solo es posible eliminar registros propios' });
        else
            return next(null, { success: true, result: result, message: 'Log eliminad@' });
    });
};

Log.response = (res, error, data) => {
    if ( error )
        res.status(500).json(error);
    else
        res.status(200).json(data);
};  

module.exports = Log;
