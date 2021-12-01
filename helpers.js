// Checks if an email is already in the users database, returns the userID if found and false if not
const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return;
};

// Generates a random string with 6 characters
const generateRandomString = () => {
  let result = "";

  const generateOneChar = (n) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (n > 0) {
      result += chars[Math.floor(Math.random() * 54)];
      generateOneChar(n - 1);
    }
  };

  generateOneChar(6);

  return result;
};

// Returns the URLs that belong to the current logged-in user
const urlsForUser = (id, database) => {
  const result = {};
  for (let url in database) {
    if (id === database[url].userID) {
      result[url] = { longURL: database[url].longURL, userID: id };
    }
  }
  return result;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };