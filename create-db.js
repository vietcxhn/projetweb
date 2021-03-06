"use strict"

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');

db.prepare('DROP TABLE IF EXISTS user').run();
db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT, admin INTEGER DEFAULT 0)').run();

db.prepare('DROP TABLE IF EXISTS question').run();
db.prepare('CREATE TABLE question (question_id INTEGER PRIMARY KEY AUTOINCREMENT, set_of_questions_id INTEGER, question TEXT, answer INTEGER, answered INTEGER DEFAULT 0, answered_by TEXT)').run();

db.prepare('DROP TABLE IF EXISTS set_of_questions').run();
db.prepare('CREATE TABLE set_of_questions (set_of_questions_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER)').run();

db.prepare('DROP TABLE IF EXISTS challenge').run();
db.prepare('CREATE TABLE challenge (id_match INTEGER PRIMARY KEY AUTOINCREMENT, challenger_id INTEGER, challenged_id INTEGER, challenger_score INTEGER, challenged_score INTEGER, id_set INTEGER, winner INTEGER DEFAULT 0)').run();

db.prepare("INSERT INTO user VALUES (1, 'admin', 'admin', 1)").run();

var entries = JSON.parse(fs.readFileSync('plantes.json').toString());
var load = function(filename) {
  const plants = JSON.parse(fs.readFileSync(filename));

  
  db.prepare('DROP TABLE IF EXISTS plants').run();

  db.prepare('CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, image TEXT)').run();

  var insert1 = db.prepare('INSERT INTO plants VALUES (@id, @name, @description, @image)');

  var transaction = db.transaction((plants) => {
    for(var id = 0;id < plants.length; id++) {
      var plant = plants[id];
      plant.id = id;
      insert1.run(plant);
    }
  });

  transaction(plants);
}

load('plantes.json');
