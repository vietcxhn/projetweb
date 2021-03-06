"use strict"

var express = require('express');
var mustache = require('mustache-express');

var model = require('./model');
var app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

const cookieSession = require('cookie-session');
app.use(cookieSession({
  secret: "motdepasse",
}));

app.use(function (req, res, next) {
  res.locals.admin = req.session.admin;
  if(req.session.user) {
    res.locals.id = req.session.id;
    res.locals.username = req.session.user;
    res.locals.authenticated = true;
  }
  else {
    res.locals.id = null;
    res.locals.username = null;
    res.locals.authenticated = null;
  }
  if(req.session.login_fail){
    res.locals.login_fail = true;
    req.session.login_fail = null;
  }
  if(req.session.signup_fail){
    res.locals.signup_fail = true;
    req.session.signup_fail = null;
  }
  next()
});

function is_authenticated(req, res, next) {
  if(!req.session.admin) res.send(401);
  else next();
};

app.get('/', (req, res) => {
  if (!req.session.id) res.redirect("/login");
  else res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  if (model.login(req.body.name, req.body.password) != -1){
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    req.session.admin = model.is_admin(req.session.id);
    res.redirect('/');
  }
  else {
    req.session.login_fail = true;
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  if (req.body.password == req.body.c_password && model.signup(req.body.name, req.body.password) != -1) {
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    req.session.admin = model.is_admin(req.session.id);
    res.redirect('/');
  }
  else {
    req.session.signup_fail = true;
    res.redirect('/signup');
  }
});

app.get("/profile/:id", (req, res) => {
  var user_data = model.get_user_data(req.params.id);
  user_data.users = model.user_list(req.session.id);
  res.render("readprofile", user_data);
});

app.get("/profile_list", (req, res) => {
  var user_list = model.user_list(-1);
  res.render("profilelist", {userlist: user_list});
});

app.get('/delete-user-form/:id', (req, res) => {
	res.render('deleteuser', model.get_user(req.params.id));
})

app.post('/delete-user-form/:id', (req, res) => {
	model.delete_user(req.params.id);
	res.redirect('/profile_list');
});

app.get('/edit-user-form/:id', (req, res) => {
	res.render('edituser', model.get_user(req.params.id));
})

app.post('/edit-user-form/:id', (req, res) => {
	model.update_user(req.params.id, { name: req.body.name, password: req.body.password});
	res.redirect('/profile_list');
})

app.get("/search_user", (req, res) => {
  var id = model.get_user_id(req.query.username);
  if(id == null) res.redirect("/profile/"+req.session.id);
  res.redirect("/profile/" + id);
});

app.get('/search', (req, res) => {
  var found = model.search(req.query.query, req.query.page);
  res.render('search', found);
});

app.get('/read/:id', (req, res) => {
  var entry = model.read(req.params.id);
  res.render('read', entry);
});

app.get('/create', is_authenticated, (req, res) => {
  res.render('create');
});

app.get('/update/:id', is_authenticated, (req, res) => {
  var entry = model.read(req.params.id);
  res.render('update', entry);
});

app.get('/delete/:id', is_authenticated, (req, res) => {
  var entry = model.read(req.params.id);
  res.render('delete', {id: req.params.id, title: entry.name});
});

function post_data_to_plant(req) {
  return {
    name: req.body.name, 
    description: req.body.description,
    image: req.body.image
  };
};

app.post('/create', is_authenticated, (req, res) => {
  var id = model.create(post_data_to_plant(req));
  res.redirect('/read/' + id);
});

app.post('/update/:id', is_authenticated, (req, res) => {
  var id = req.params.id;
  model.update(id, post_data_to_plant(req));
  res.redirect('/read/' + id);
});

app.post('/delete/:id', is_authenticated, (req, res) => {
  model.delete(req.params.id);
  res.redirect('/');
});

app.get('/start', (req, res) => {
  req.session.score = 0;
  req.session.num_question = 1;
  if(!req.session.challenge||!req.session.acpchall) req.session.sq = model.generateMCQs(req.session.id);
  res.redirect("/play");
});

app.get('/play', (req, res) => {
  let result = model.get_questions(req.session.sq, req.session.num_question);
  res.render("play", result);
})

app.get('/check', (req, res) => {
  if (req.query.choice == model.get_questions(req.session.sq, req.session.num_question).answer) req.session.score++;
  if (req.session.num_question < 20) {
    req.session.num_question++;
    res.redirect("/play");
  }
  else res.redirect("/result");
});

app.get('/result', (req, res) => {
  if(req.session.challenge) {
    model.update_challenger_score(req.session.id_match, req.session.score);
    req.session.challenge = null;
  }
  else if (req.session.acpchall) {
    model.update_challenged_score(req.session.id_match, req.session.score);
    req.session.acpchall = null;
  }
  if(req.session.id_match != null) {
    var chall = model.get_challenge(req.session.id_match);
    if (chall.challenger_score != null&&chall.challenged_score != null) {
      if (chall.challenger_score > chall.challenged_score) model.update_winner(chall.id_match, chall.challenger_id);
      else if (chall.challenger_score < chall.challenged_score) model.update_winner(chall.id_match, chall.challenged_id);
      else model.update_winner(chall.id_match, -1);
    }
  }
  res.render('showresult', {score: req.session.score});
});

app.get('/challenge', (req, res) => {
  var users = model.user_list(req.session.id);
  var challenge = model.challenge_list(req.session.id);
  var challenged = model.challenged_list(req.session.id);
  res.render("challenge", {users: users, challenged_list: challenged, challenge_list: challenge});
});;

app.post('/challenge', (req, res) => {
  if (model.get_user_id(req.body.username) == -1) res.redirect("/challenge");
  req.session.challenge = true;
  req.session.sq = model.generateMCQs(req.session.id);
  req.session.id_match = model.create_challenge(req.body.username, req.session.id, req.session.sq);
  res.redirect("/start");
});

app.get('/accept_challenge/:id_match', (req, res) => {
  var challenge = model.get_challenge(req.params.id_match);
  req.session.sq = challenge.id_set;
  req.session.acpchall = true;
  req.session.id_match = req.params.id_match;
  res.redirect("/start");
});

app.get('/restart_challenge/:id_match', (req, res) => {
  var challenge = model.get_challenge(req.params.id_match);
  req.session.sq = challenge.id_set;
  req.session.challenge = true;
  req.session.id_match = req.params.id_match;
  res.redirect("/start");
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
