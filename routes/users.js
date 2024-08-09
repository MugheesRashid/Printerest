const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Printrest")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  dp: {
    type: String,
    default: "profile.jpeg"
  },
  email: {
    type: String,
    unique: true,
    default: "",
  },
  fullname: {
    type: String,
    required: true,
    unique: true
  }
});
userSchema.plugin(plm)

const User = mongoose.model('User', userSchema);

module.exports = User;
