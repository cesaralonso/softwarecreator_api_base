const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

// POOL CONNECTION
var connection = mysql.createPool({
    connectionLimit : 100,
    waitForConnections : true,
    queueLimit : 0,  
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    debug:  false,
    waitTimeOut : 28800,
});

// Attempt to catch disconnects 
connection.on('connection', function (connection) {
  console.log('DB Connection established');

  connection.on('error', function (err) {
    console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('close', function (err) {
    console.error(new Date(), 'MySQL close', err);
  });

});


module.exports = connection;