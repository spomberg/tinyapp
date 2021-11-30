const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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

// Generates a random string with 6 characters
function generateRandomString() {
  let result = "";

  const generateOneChar = (n) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (n > 0) {
      result += chars[Math.floor(Math.random() * 54)];
      generateOneChar(n - 1);
    }
  }

  generateOneChar(6);

  return result;
};

// Checks if an email is already in the users database, returns the userID if found and false if not
function checkEmail (email) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    } 
  }
  return false;
};

// Returns the URLs that belong to the current logged-in user
function urlsForUser(id) {
  const result = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      result[url] = { longURL: urlDatabase[url].longURL, userID: id };
    }
  }
  return result;
}

// Creates a new short URL and adds it to the database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

// Edits an existing URL
app.post("/urls/:shortURL/", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
  } else res.redirect(401, "/error");
}) 

// Deletes a URL from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else res.redirect(401, "/error");
});

// Login page POST route
app.post("/login", (req, res) => {
  const userID = checkEmail(req.body.email);
  const password = req.body.password;
  if (userID && bcrypt.compareSync(password, users[userID].password)) {
    res.cookie("user_id", userID);
    res.redirect('/urls');
  } else res.status(403).end();
});

// Clears cookies and logs user out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

// Registration page POST route
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || checkEmail(req.body.email)) {
    res.status(400).end();
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    res.cookie('user_id', userID);
    res.redirect("/urls");
};
});

// URLs index page GET route
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (users[userID]) {
    const templateVars = { 
      urls: urlsForUser(userID),
      user: users[userID] 
    };
    res.render("urls_index", templateVars);
  } else res.redirect("/error");
});

// Login page GET route
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] }
  res.render("login", templateVars);
});

// Registration page GET route
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] }
  res.render("register", templateVars);
});

// Create new URL page GET route
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  if (users[req.cookies['user_id']]) {
    res.render("urls_new", templateVars);
  } else res.redirect("/login");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Short URL page GET route
app.get("/urls/:shortURL", (req, res) => {
  const urls = urlsForUser(req.cookies["user_id"]);
  if (urls[req.params.shortURL]) {
    const templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL, 
      user: users[req.cookies['user_id']]
    };
    res.render("urls_show", templateVars);
  } else res.redirect("/error");
});

// Route that redirects browser to long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Error page route
app.get("/error", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlsForUser(req.cookies["user_id"]) 
  };
  res.render("error", templateVars)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});