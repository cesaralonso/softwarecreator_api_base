
const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();


// connect to the db
connectionInfo = {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    getConnection: 0,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS, // "fGoPpmais+R$", // process.env.DB_PASS, //   || 'fGoPpmais+R$'
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    debug:  false,
    waitTimeOut : 28800,
    multipleStatements: true
};

//create mysql connection pool
var connection = mysql.createPool(
  connectionInfo
);

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
