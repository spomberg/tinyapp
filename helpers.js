// Checks if an email is already in the users database, returns the userID if found and false if not
function getUserByEmail (email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    } 
  }
  return;
};

module.exports = { getUserByEmail };