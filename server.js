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
  if(req.session.user) {
    res.locals.username = req.session.user;
    res.locals.authenticated = true;
    res.locals.admin = req.session.is_admin;
  }
  else {
    res.locals.username = ""
    res.locals.authenticated = false;
    res.locals.admin = req.session.is_admin;
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
  console.log(req.session)
  if(!req.session.is_admin) res.send(401)
  else next();
};

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  if (model.login(req.body.name, req.body.password) != -1){
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    req.session.is_admin = model.is_admin(req.session.id);
    res.redirect('/');
  }
  else {
    req.session.login_fail = true;
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  if (req.body.password == req.body.c_password && model.signup(req.body.name, req.body.password) != -1) {
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    req.session.is_admin = model.is_admin(req.session.id);
    res.redirect('/');
  }
  else {
    req.session.signup_fail = true;
    res.redirect('/signup');
  }
});

app.get('/', (req, res) => {
  res.render('index');
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
  res.render('delete', {id: req.params.id, title: entry.title});
});

function post_data_to_plant(req) {
  return {
    name: req.body.name, 
    description: req.body.description,
    image: req.body.image
  };
}

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

app.listen(3000, () => console.log('listening on http://localhost:3000'));
