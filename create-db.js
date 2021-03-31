"use strict"

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');


var entries = JSON.parse(fs.readFileSync('data.json').toString());
var load = function(filename) {
  const recipes = JSON.parse(fs.readFileSync(filename));

  db.prepare('DROP TABLE IF EXISTS user').run();
  db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();

  db.prepare('DROP TABLE IF EXISTS plants').run();

  db.prepare('CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, image TEXT)').run();

  var insert1 = db.prepare('INSERT INTO recipe VALUES (@id, @title, @img, @description, @duration)');

  var transaction = db.transaction((recipes) => {

    for(var id = 0;id < recipes.length; id++) {
      var recipe = recipes[id];
      recipe.id = id;
      insert1.run(recipe);
    }
  });

  transaction(recipes);
}

load('plantes.json');