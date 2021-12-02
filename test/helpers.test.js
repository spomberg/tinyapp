const { assert } = require('chai');

const { getUserByEmail, isFirstVisit } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
  it('should return undefined when the email is not found in the database', function() {
    const user = getUserByEmail("user1@example.com", testUsers)
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});

describe('isFirstVisit', function() {
  const testLog = [{ visitorID: 'Hsdjsak', timestamp: "XXXXX" }, { visitorID: 'asdasre', timestamp: "XXXXX" }, { visitorID: 'sgDger3', timestamp: "XXXXX" }]
  it('should return false if the visitor_id is found in the log', function() {
    const input = isFirstVisit("Hsdjsak", testLog);
    const expectedOutput = false;
    assert.equal(input, expectedOutput);
  });
  it('should return true if the visitor_id is NOT found in the log', function() {
    const input = isFirstVisit("xxxxxxx", testLog);
    const expectedOutput = true;
    assert.equal(input, expectedOutput);
  });

});