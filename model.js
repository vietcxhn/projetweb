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

exports.get_user = (id) => {
  var user = db.prepare('SELECT * FROM user WHERE id = ?').get(id)
  if (user != undefined) return user;
  else return null;
}

exports.get_user_id = (name) => {
  var user = db.prepare('SELECT * FROM user WHERE name = ?').get(name)
  if (user != undefined) return user.id;
  else return -1
}

exports.delete_user = function(id) {
  db.prepare('DELETE FROM user WHERE id = ?').run(id);
}

exports.update_user = function(id, user) {
  var result = db.prepare('UPDATE user SET name = @name, password = @password WHERE id = ?').run(user, id);
  if(result.changes == 1) return true;
  else return false;
}

exports.get_user_data = (id) => {
  var user = db.prepare('SELECT name FROM user WHERE id = ?').get(id);
  var challenge = db.prepare('SELECT * FROM challenge WHERE (challenger_id = ? OR challenged_id = ?) AND winner != 0').all(id, id);
  var win = challenge.filter((val) => {return val.winner == id}).length;
  var lose = challenge.filter((val) => {return val.winner != id}).length;
  var draw = challenge.filter((val) => {return val.winner == -1}).length;
  return {
    name: user.name,
    win: win,
    lose: lose,
    draw: draw
  }
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
  return set_of_questions_id
}


exports.is_admin = (id) => {
  if(db.prepare('SELECT admin FROM user WHERE id = ?').get(id).admin == 1) return true; 
  else return false;
}

exports.get_questions = (sq, num_question) => {
  var question = db.prepare('SELECT question, answer FROM question WHERE set_of_questions_id = ? ORDER BY question_id LIMIT 1 OFFSET ?').get(sq, num_question - 1);
  var getname = db.prepare('SELECT name FROM plants WHERE id = ?');
  var choices = [];
  question.question.split(", ").forEach((a) => {
    let id = parseInt(a);
    let choice = {};
    choice.choice_id = id;
    choice.choice_name = getname.get(id).name;
    choices.push(choice);
  })
  var image = db.prepare('SELECT image FROM plants WHERE id = ?').get(question.answer).image;

  var result = {
    choice: choices,
    answer: question.answer,
    image: image,
    next_question: true,
    num_question: num_question
  };
  if(result.num_question == 20) result.next_question = false;
  return result;
};

exports.user_list = (id) => {
  return db.prepare('SELECT * FROM user WHERE id != ? AND name != ?').all(id, "admin");
};

exports.challenged_list = (id) => {
  return db.prepare('SELECT * FROM challenge WHERE challenged_id = ? AND challenged_score IS NULL').all(id).map((val) => {
    val.challenger_name = db.prepare('SELECT name FROM user WHERE id = ?').get(val.challenger_id).name;
    return val;
  });
};

exports.challenge_list = (id) => {
  return db.prepare('SELECT * FROM challenge WHERE challenger_id = ? AND challenger_score IS NULL').all(id).map((val) => {
    val.challenged_name = db.prepare('SELECT name FROM user WHERE id = ?').get(val.challenged_id).name;
    return val;
  });
};

exports.create_challenge = (challenged_name, challenger_id, id_set) => {
  var insert = db.prepare('INSERT INTO challenge(challenger_id, challenged_id, id_set) VALUES (?, ?, ?)');
  var id = db.prepare('SELECT id FROM user WHERE name = ?').get(challenged_name).id;
  var id_match = insert.run(challenger_id, id, id_set).lastInsertRowid;
  return id_match;
};

exports.get_challenge = (id_match) => {
  return db.prepare('SELECT * FROM challenge WHERE id_match = ?').get(id_match);
};

exports.update_challenger_score = (id_match, score) => {
  db.prepare('UPDATE challenge SET challenger_score = ? WHERE id_match = ?').run(score, id_match)
};

exports.update_challenged_score = (id_match, score) => {
  db.prepare('UPDATE challenge SET challenged_score = ? WHERE id_match = ?').run(score, id_match)
};

exports.update_winner = (id_match, winner) => {
  db.prepare('UPDATE challenge SET winner = ? WHERE id_match = ?').run(winner, id_match)
};