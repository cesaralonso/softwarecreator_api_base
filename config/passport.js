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
        connection.query('SELECT * FROM user WHERE iduser = ?', [jwt_payload.id_user], (error, result) => {
            if ( error ) {
                return done(error);
            }
            if ( result[0] ) {
                return done(null, result[0]);
            } else {
                return done(null, false);
            }
        })
    }));
}