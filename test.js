const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');
// db.prepare('DROP TABLE IF EXISTS challenge').run();
// db.prepare('CREATE TABLE challenge (id_match INTEGER PRIMARY KEY AUTOINCREMENT, challenger_id INTEGER, challenged_id INTEGER, challenger_score INTEGER DEFAULT 0, challenged_score INTEGER DEFAULT 0, id_set INTEGER, winner INTEGER DEFAULT 0)').run();
console.log(db.prepare('SELECT * FROM challenge').all())