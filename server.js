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
  }
  else {
    res.locals.username = ""
    res.locals.authenticated = false;
  }
  next()
});

function is_authenticated(req, res, next) {
  console.log(req.session)
  if(!req.session.user)res.send(401)
  else next();
};

app.get('/login', (req, res) => {
  res.render('login')
});

app.post('/login', (req, res) => {
  if (model.login(req.body.name, req.body.password) != -1){
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    console.log(req.session.user)
    res.redirect('/');
  }
  else {
    res.redirect('/login', { "loginfail" : "Name/Password invalid" });
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
  if (model.signup(req.body.name, req.body.password) != -1) {
    model.login(req.body.name, req.body.password);
    req.session.id = model.login(req.body.name, req.body.password);
    req.session.user = req.body.name;
    res.redirect('/');

  }
  else {
    res.redirect('/signup');
  }
});

app.get('/', (req, res) => {
  console.log(res.locals)
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

app.get('/update/:id', (req, res) => {
  var entry = model.read(req.params.id);
  res.render('update', entry);
});

app.get('/delete/:id', (req, res) => {
  var entry = model.read(req.params.id);
  res.render('delete', {id: req.params.id, title: entry.title});
});

function post_data_to_recipe(req) {
  return {
    title: req.body.title, 
    description: req.body.description,
    img: req.body.img,
    duration: req.body.duration,
    ingredients: req.body.ingredients.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({name: e.trim()})),
    stages: req.body.stages.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({description: e.trim()})),
  };
}

app.post('/create', (req, res) => {
  var id = model.create(post_data_to_recipe(req));
  res.redirect('/read/' + id);
});

app.post('/update/:id', (req, res) => {
  var id = req.params.id;
  model.update(id, post_data_to_recipe(req));
  res.redirect('/read/' + id);
});

app.post('/delete/:id', (req, res) => {
  model.delete(req.params.id);
  res.redirect('/');
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
