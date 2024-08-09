var express = require("express");
var router = express.Router();
var userModel = require("./users");
var postModel = require("./post");
const flash = require("connect-flash");
const passport = require("passport");
const { upload, dpupload } = require("./multer");
var localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("signup", {
    error: req.flash("error"),
    nav: false,
    search: false,
  });
});

router.get("/feed", isLoggedIn, async function (req, res) {
  const allPosts = await postModel.find().populate("userid");
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("feed", { allPosts, user, nav: true, search: true });
});

router.get("/like/post/:id", async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel
    .findOne({ _id: req.params.id })
    .populate("userid")
    .populate("comments.user");

  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else post.likes.splice(post.likes.indexOf(user._id), 1);
  await post.save();
  res.redirect(`/postpreview/${post._id}`);
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("profile", { user, nav: true, search: false });
});
//important section
router.post("/delete/post/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    // Find the post by ID
    const post = await postModel.findOne({ _id: postId });
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Remove the post ID from the user's posts array
    await userModel.updateOne(
      { _id: post.userid },
      { $pull: { posts: postId } }
    );

    // Delete the post
    await postModel.findByIdAndDelete(postId);

    res.redirect("/profile"); // Redirect to the desired page after deletion
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
//important section end
router.get("/login", function (req, res) {
  const errorMessage = req.flash("error");
  res.render("login", { error: errorMessage, nav: false, search: false });
});

router.post("/register", async function (req, res) {
  try {
    const existingEmailUser = await userModel.findOne({
      email: req.body.email,
    });
    if (existingEmailUser) {
      req.flash(
        "error",
        "This email is already in use. Try adding a little spice to it"
      );
      return res.redirect("/");
    }

    const existingUsernameUser = await userModel.findOne({
      username: req.body.username,
    });
    if (existingUsernameUser) {
      req.flash(
        "error",
        "Oops! This username is already claimed. Try adding some pizzazz"
      );
      return res.redirect("/");
    }

    const existingFullnameUser = await userModel.findOne({
      fullname: req.body.fullname,
    });
    if (existingFullnameUser) {
      req.flash(
        "error",
        "Oops! Looks like there's already a superstar with your name"
      );
      return res.redirect("/");
    }
    if (req.body.password === req.body.Confirmpassword) {
      const userdata = new userModel({
        username: req.body.username,
        email: req.body.email,
        fullname: req.body.fullname,
      });

      await userModel.register(userdata, req.body.password);
      passport.authenticate("local")(req, res, function () {
        res.redirect("/feed");
      });
    } else {
      req.flash(
        "error",
        "Mismatch alert! Your passwords couldn't agree more to disagree."
      );
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred during registration");
    res.redirect("/");
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

router.post("/upload",
  isLoggedIn,
  upload.single("file"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!req.file) {
      return res.status(404).send("No files were upload");
    }
    res.redirect("profile");
    const createdPost = await postModel.create({
      postText: req.body.filecaption,
      postImage: req.file.filename,
      discription: req.body.discription,
      userid: user._id,
    });
    await user.posts.push(createdPost._id);

    await user.save();
  }
);

router.post(
  "/dp",
  isLoggedIn,
  dpupload.single("dpimg"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.dp = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.post("/edit", isLoggedIn, async function (req, res) {
  const person = await userModel.findOneAndUpdate(
    { _id: req.body.userid },
    {
      $set: {
        username: req.body.username,
        fullname: req.body.fullname,
        email: req.body.email,
      },
    }
  );
  res.redirect("/profile");
});

router.get("/postpreview/:id", isLoggedIn, async function (req, res) {
  let post = await postModel
    .findOne({ _id: req.params.id })
    .populate("comments.user")
    .populate("userid");
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("preview", { post, nav: true, user, search: false });
});

router.post("/post/comment/:id", isLoggedIn, async function (req, res) {
  try {
    let post = await postModel
      .findOne({ _id: req.params.id })
      .populate("userid")
      .populate("comments.user");
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const newComment = {
      user: user,
      commentText: req.body.comment,
      commentedAt: new Date(),
    };
    post.comments.push(newComment);
    await post.save();
    res.redirect(`/postpreview/${post._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/profile/:id", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ _id: req.params.id }).populate("posts");
  console.log(user);
  res.render("viewprofile", { nav: true, user, search: false });
});

module.exports = router;
