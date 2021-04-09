const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');

console.log(db.prepare('SELECT * FROM question').all())