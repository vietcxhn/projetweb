"use strict"

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');


var entries = JSON.parse(fs.readFileSync('data.json').toString());
var load = function(filename) {
  const plants = JSON.parse(fs.readFileSync(filename));

  db.prepare('DROP TABLE IF EXISTS user').run();
  db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();

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