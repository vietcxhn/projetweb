const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');

exports.read = (id) => {
  var found = db.prepare('SELECT * FROM plants WHERE id = ?').get(id);
  if(found !== undefined) return found;
  else return null;
};

exports.create = function(plant) {
  var id = db.prepare('INSERT INTO plants (name, description, image) VALUES (@name, @description, @image)').run(plant).lastInsertRowid;
  return id;
}

exports.update = function(id, plant) {
  var result = db.prepare('UPDATE plants SET name = @name, description = @description img = @img, WHERE id = ?').run(plant, id);
  if(result.changes == 1) return true;
  else return false;
}

exports.delete = function(id) {
  db.prepare('DELETE FROM plants WHERE id = ?').run(id);
}