const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const { getUserByEmail, generateRandomString, urlsForUser, isFirstVisit } = require("./helpers");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'user_id',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");

// TEST DATABASES
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", visits: 0, uniqueVisitors: 0, visitLog: [] },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", visits: 0, uniqueVisitors: 0, visitLog: [] }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

// GET ROUTES

// GET /urls
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (users[userID]) {
    const templateVars = {
      urls: urlsForUser(userID, urlDatabase),
      user: users[userID]
    };
    res.render("urls_index", templateVars);
  } else res.redirect("/error");
});

// GET /login
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

// GET /register
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (users[req.session.user_id]) {
    res.render("urls_new", templateVars);
  } else res.redirect("/login");
});

// GET /
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  const shortURL = req.params.shortURL;
  if (urls[req.params.shortURL]) {
    const templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: users[req.session.user_id],
      visits: urlDatabase[shortURL].visits,
      uniqueVisitors: urlDatabase[shortURL].uniqueVisitors
    };
    res.render("urls_show", templateVars);
  } else res.redirect("/error");
});

// GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const visitorID = req.session.visitor_id;
  const timestamp = new Date(Date.now()).toString();

  // Generates new visitor_id cookie if the cookie is not found
  if (!visitorID) { 
    req.session.visitor_id = generateRandomString();
  }
  
  urlDatabase[shortURL].visits++;
  
  // Use helper function to test if it's the visitor's first visit, then it increments the counter if necessary
  if (isFirstVisit(visitorID, urlDatabase[shortURL].visitLog)) {
    urlDatabase[shortURL].uniqueVisitors++;
  }

  urlDatabase[shortURL].visitLog.push({ timestamp, visitorID });
  longURL.slice(0, 7) === 'http://' ? res.redirect(longURL) : res.redirect(`http://${longURL}`);
});

// GET /error
app.get("/error", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase),
    status: req.statusMessage
  };
  res.render("error", templateVars);
});

// POST ROUTES

// POST /urls
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { 
    longURL: req.body.longURL, 
    userID: req.session.user_id, 
    visits: 0, 
    uniqueVisitors: 0, 
    visitLog: [] };
  res.redirect(`/urls/${shortURL}`);
});

// POST /register
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || getUserByEmail(req.body.email, users)) {
    let err = "";
    !req.body.email || !req.body.password ? err = "Email and password required" : err = "Email address has already been used";
    res.status(400).send(err);
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

// POST /login
app.post("/login", (req, res) => {
  const userID = getUserByEmail(req.body.email, users);
  const password = req.body.password;
  if (userID && bcrypt.compareSync(password, users[userID].password)) {
    req.session.user_id = userID;
    res.redirect('/urls');
  } else res.status(401).send("Incorrect password");
});

// POST /logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

// POST /urls/:shortURL
app.post("/urls/:shortURL/", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
  } else res.redirect(401, "/error");
});

// POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else res.redirect(401, "/error");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});