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
  var result = db.prepare('UPDATE plants SET name = @name, description = @description, image = @image WHERE id = ?').run(plant, id);
  if(result.changes == 1) return true;
  else return false;
}

exports.delete = function(id) {
  db.prepare('DELETE FROM plants WHERE id = ?').run(id);
}

exports.search = (query, page) => {
  const num_per_page = 32;
  query = query || "";
  page = parseInt(page || 1);

  // on utiliser l'opérateur LIKE pour rechercher dans le titre 
  var num_found = db.prepare('SELECT count(*) FROM plants WHERE name LIKE ?').get('%' + query + '%')['count(*)'];
  var results = db.prepare('SELECT id as entry, name, image FROM plants WHERE name LIKE ? ORDER BY id LIMIT ? OFFSET ?').all('%' + query + '%', num_per_page, (page - 1) * num_per_page);

  return {
    results: results,
    num_found: num_found, 
    query: query,
    next_page: page + 1,
    page: page,
    num_pages: parseInt(num_found / num_per_page) + 1,
  };
};

exports.login = (name, password) => {
  let log = db.prepare('SELECT * FROM user WHERE name = ?').get(name);
  if (log) {
    if (log.password == password) {
      return log.id;
    }
    else return -1;
  }
  else return -1;
}

exports.signup = (name, password) => {
  if (db.prepare('SELECT * FROM user WHERE name = ?').get(name)) return -1;
  let id = db.prepare('INSERT INTO user (name, password) VALUES (?, ?)').run(name, password).lastInsertRowid;
  return id;
}