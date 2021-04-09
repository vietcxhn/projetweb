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

  var search_result = {
    results: results,
    num_found: num_found, 
    query: query,
    next_page: page + 1,
    previous_page: page - 1,
    page: page,
    num_pages: parseInt(num_found / num_per_page) + 1,
  };
  if(search_result.page == search_result.num_pages) search_result.next_page = false;
  if(search_result.page == 1) search_result.previous_page = false;
  return search_result;
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

function add(questions) {
  let plants = db.prepare('SELECT * FROM plants').all();
  let q = {
    question : [],
    answer : null,
    answered: 0,
    answered_by: ''
  };
  for (let i = 0; i < 4; i++) {
    while(true){
      let random = Math.floor(Math.random() * plants.length);
      if(!q.question.includes(random)){
        q.question.push(random);
        break;
      }
    }
  }
  q.answer = q.question[Math.floor(Math.random() * 4)];
  questions.push(q);
  return questions;
}

exports.generateMCQs = (id) => {
  let questions = [];
  for (let i = 0; i < 20; i++) {
    questions = add(questions);
  }
  var set_of_questions_id = db.prepare('INSERT INTO set_of_questions (user_id) VALUES (?)').run(id).lastInsertRowid;
  
  var insert = db.prepare('INSERT INTO question (set_of_questions_id, question, answer, answered, answered_by) VALUES (@set_of_questions_id, @question, @answer, @answered, @answered_by)');

  var transaction = db.transaction((questions) => {
    for(var id = 0;id < questions.length; id++) {
      var question = questions[id];
      var tostring = question.question[0] + ', '+ question.question[1] + ', '+ question.question[2] + ', '+ question.question[3];
      question.question = tostring
      question.set_of_questions_id = set_of_questions_id;
      insert.run(question);
    }
  });
  
  transaction(questions);
  console.log(db.prepare('SELECT * FROM question WHERE set_of_questions_id = ?').all(set_of_questions_id))
  return set_of_questions_id
}


exports.is_admin = (id) => {
  if(db.prepare('SELECT admin FROM user WHERE id = ?').get(id).admin == 1) return true;
  else return false;
}

exports.get_questions = (sq, num_question) => {
  num_question = parseInt(num_question || 1);

  var question = db.prepare('SELECT question, answer FROM question WHERE set_of_questions_id = ? ORDER BY question_id LIMIT 1 OFFSET ?').get(sq, num_question - 1);
  var tolist = question.question.split(", ");
  
  var choice1 = parseInt(tolist[0])
  var choice2 = parseInt(tolist[1])
  var choice3 = parseInt(tolist[2])
  var choice4 = parseInt(tolist[3])
  
  var getname = db.prepare('SELECT name FROM plants WHERE id = ?')
  
  var choice1name = getname.get(choice1)
  var choice2name = getname.get(choice2)
  var choice3name = getname.get(choice3)
  var choice4name = getname.get(choice4)
  var image = db.prepare('SELECT image FROM plants WHERE id = ?').get(question.answer);
  
  var result = {
    choice1: choice1,
    choice2: choice2,
    choice3: choice3,
    choice4: choice4,
    choice1name: choice1name,
    choice2name: choice2name,
    choice3name: choice3name,
    choice4name: choice4name,
    image: image,
    sq: sq,
    next_question: num_question + 1,
    num_question: num_question,
    end: false
  };
  if(search_result.num_question == 20) {
    result.next_page = false;
    result.end = true;
  }
  return result;
};