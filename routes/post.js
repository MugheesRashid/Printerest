const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postText: {
    type: String,
    required: true,
  },
  postImage: {
    type: String,
    required: true,
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  discription: {
      type: "String",
      default:"",
  },
  likes: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commentText: {
      type: Array,
    },
    commentedAt: {
      type: Date,
      default: Date.now,
    }
  }]
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
