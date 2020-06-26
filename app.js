const express = require('express');
const connection = require('./config/db-connection');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
var compression = require('compression');
const helmet = require("helmet");
const mysql = require('mysql');
const dotenv = require('dotenv');
var CronJob = require('cron').CronJob;

dotenv.config();

//Route importation.
const example = require('./routes/examples');

// Express Instance
const app = express();

// Middlewares
app.use(helmet());
// app.use(express.static("./public"));
app.use(compression());

/*const _cors = {
    origin: ["http://127.0.0.1:8000", "http://localhost"]
}
app.all('*', function(req, res, next) {
    console.log('req.headers.origin', req.headers.origin);
    let origin = req.headers.origin;
    if(_cors.origin.indexOf(origin) >= 0){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS, DELETE, PATCH");
    }         
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});*/

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// POOL CONNECTION
app.use(function (req, res, next) {
    req.mysql = connection;
    next();
});

// Initialize passport
app.use(passport.initialize());

// Call passport Strategy
require('./config/passport')(passport);

// Warehouses
app.use('/api/example', example);

// CRON
// new CronJob('10 * * * * * *', function() {
// }, null, true, 'America/Mexico_City');

// Set port
app.listen(process.env.PORT || 3000, () => {
    console.log(' [*] Listening on 0.0.0.0:3000');
});
