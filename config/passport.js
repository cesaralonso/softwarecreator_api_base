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

        connection.query('SELECT idsi_user, usuario, email, Rol_idsi_rol, super FROM si_user WHERE idsi_user = ?', [jwt_payload.idsi_user], (error, result) => {
                if ( error ) {
                    return done(error);
                }
                if (result[0]) {

                    let user = result[0];
                    
                    let _super = false;
                    if (isset(user.super) === 1) {
                        _super = true;
                    }

                    connection.query(`
                                    SELECT m.nombre, p.writeable, p.deleteable, p.readable, p.updateable, p.write_own, p.delete_own, p.read_own, p.update_own  
                                    FROM si_user as u 
                                    INNER JOIN si_rol as r ON r.idsi_rol = u.Rol_idsi_rol 
                                    INNER JOIN si_permiso as p ON p.Rol_idsi_rol = r.idsi_rol 
                                    INNER JOIN si_modulo as m ON m.idsi_modulo = p.Modulo_idsi_modulo 
                                    WHERE u.idsi_user = ? AND p.acceso = 1`, [jwt_payload.idsi_user], (error, modules) => {

                        if ( error ) {
                            return done(error);
                        }
                        if ( modules.length > 0 ) {
                            return done(null, {
                                success: true,
                                message: 'Autenticación correcta',
                                user: user,
                                modules: modules,
                                super: _super
                            });
                        } else {
                            return done(null, false);
                        }

                    })
                } else {
                    return done(null, false);
                }
        })
    }));
}