const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const connection = require('./db-connection');

module.exports = passport => {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = process.env.SECRET_PASSWORD;
    
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {

        if ( !connection )
            return done('Connection refused');

        connection.query('SELECT idsi_user, usuario, email, si_rol_idsi_rol, super, baja FROM si_user WHERE idsi_user = ? HAVING baja IS NULL OR baja = false', [jwt_payload.idsi_user], (error, result) => {
                if ( error ) {
                    return done(error);
                }
                if (result[0]) {

                    let user = result[0];

                    let _super = user.super;
                    let _query = '';

                    if (!_super) {
                        _query = `SELECT m.nombre, p.acceso, m.baja, p.writeable, p.deleteable, p.readable, p.updateable, p.write_own, p.delete_own, p.read_own, p.update_own  
                                 FROM si_user as u 
                                 INNER JOIN si_rol as r ON r.idsi_rol = u.si_rol_idsi_rol 
                                 INNER JOIN si_permiso as p ON p.si_rol_idsi_rol = r.idsi_rol 
                                 INNER JOIN si_modulo as m ON m.idsi_modulo = p.si_modulo_idsi_modulo 
                                 WHERE u.idsi_user = ? HAVING m.baja IS NULL OR m.baja = false`;
                    } else {
                        _query = `SELECT m.nombre FROM si_modulo as m`;
                    }

                    connection.query(_query, [jwt_payload.idsi_user], (error, modules) => {

                        if ( error ) {
                            return done(error);
                        }

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

                        if ( modules.length > 0 ) {   
                            console.log("Autenticación correcta");
                            return done(null, {
                                success: true,
                                message: 'Autenticación correcta',
                                user: user,
                                modules: modules,
                                super: _super || 0
                            });
                        } else {
                            console.log("Sin permiso de acceso");
                            return done(null, {
                                success: false,
                                message: 'Sin permiso de acceso',
                                user: {},
                                modules: [],
                                super: 0
                            });
                        }

                    })
                } else {
                    console.log("Autenticación fallida");
                    return done(null, {
                                success: false,
                                message: 'Autenticación fallida',
                                user: {},
                                modules: [],
                                super: 0
                            });
                }
        })
    }));
}