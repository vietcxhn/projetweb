const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');
let plants = db.prepare('SELECT * FROM plants').all();

console.log(plants[0])
