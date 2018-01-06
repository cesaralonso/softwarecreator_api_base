const permissions = {};

permissions.module_permission = (_modules, _module, _permission, next) => {

    let encontrado = false;
    _modules.forEach(element => {
        if (element.nombre === _module) {
            encontrado = true;
            if (_permission === 'updateable') {
                if (element.updateable) {
                    return next( null, { success: true, only_own: element.update_own, message: 'Usuario con permiso de edición' });
                } else {
                    return next( null, { success: false, message: 'No tienes permiso para editar en este módulo' });
                }
            }
            if (_permission === 'writeable') {
                if (element.writeable) {
                    return next( null, { success: true, only_own: element.write_own, message: 'Usuario con permiso de escritura' });
                } else {
                    return next( null, { success: false, message: 'No tienes permiso para escribir en este módulo' });
                }
            }
            if (_permission === 'readable') {
                if (element.readable) {
                    return next( null, { success: true, only_own: element.read_own, message: 'Usuario con permiso de lectura' });
                } else {
                    return next( null, { success: false, message: 'No tienes permiso para leer en este módulo' });
                }
            }
            if (_permission === 'deleteable') {
                if (element.deleteable) {
                    return next( null, { success: true, only_own: element.delete_own, message: 'Usuario con permiso de eliminación' });
                } else {
                    return next( null, { success: false, message: 'No tienes permiso para eliminar en este módulo' });
                }
            }
        } 
    });
    if (!encontrado) {
        return next( null, { success: false, message: 'No tienes permiso para accesar a este módulo' });
    }

};

module.exports = permissions;
