var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  verifier: {
    type: String,
    required: true
  },
  serverEphemeralSecret: {
    type: String,
    required: false
  },

  serverEphemeralPublic: {
    type: String,
    required: false
  }
});

var Users = mongoose.model("Users", UserSchema);

module.exports = {
  Users
};
