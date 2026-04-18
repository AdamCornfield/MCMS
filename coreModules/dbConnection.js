const mysql = require('mysql')

/**
 * Creates connection object for db connectivity.
 */
const con = mysql.createConnection({
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    user: process.env.DBUSER,
    password: process.env.DBPASSW,
    database: process.env.DBNAM,
    charset: 'utf8_bin'
})

module.exports = con