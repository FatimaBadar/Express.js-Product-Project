var mysql = require('mysql')
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'challenge1'
});

conn.connect( (error) => {
    if(error) throw error;
    console.log("Database is connected successfully");
})

module.exports = conn;