const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');
var date = new Date()
console.log(date.toString())
// db.prepare('DROP TABLE IF EXISTS challenge').run();
// db.prepare('CREATE TABLE challenge (id_match INTEGER PRIMARY KEY AUTOINCREMENT, challenger_id INTEGER, challenged_id INTEGER, id_set INTEGER, winner INTEGER, date TEXT)').run();
