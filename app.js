const express = require('express');
const connection = require('./config/db-connection');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
var CronJob = require('cron').CronJob;


//Route importation.
const example = require('./routes/examples');

// Express Instance
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());



// Initialize passport
app.use(passport.initialize());

// Call passport Strategy
require('./config/passport')(passport);

// Warehouses
app.use('/example', example);


// FUNCIONES DE CRON
// new CronJob('10 * * * * * *', function() {
// }, null, true, 'America/Mexico_City');


// Set port
app.listen(3000);
