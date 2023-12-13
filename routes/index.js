var express = require('express');
var router = express.Router();
const expressSession = require("express-session")
const userModel = require("./users");
const postModel = require("./post");
const upload = require('./multer');
const passport = require('passport'); // Include Passport
const localStrategy = require('passport-local'); // Include the Local Strategy for Passport

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index', {nav: false});
});

router.post('/fileupload', isLoggedIn , upload.single("image") , async function(req, res, next) {
  const user = await userModel.findOne({ username : req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

router.post('/createpost', isLoggedIn , upload.single("postimage") , async function(req, res, next) {
  const user = await userModel.findOne({ username : req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.get('/show/posts', isLoggedIn , async function(req, res, next) {
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  
  res.render('show', { user, nav: true});
});

router.get('/feed', isLoggedIn , async function(req, res, next) {
  const user = 
  await userModel
  .findOne({username: req.session.passport.user});
  const posts = await postModel.find().populate("user")
  
  res.render('feed', { user, posts , nav: true});
});


router.get('/add', async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  .populate("posts")

  

  res.render('add', {user,nav: true});
});

router.get('/register', function(req, res, next) {
  res.render('register' , {nav: false});
});

router.post("/register", function(req,res){
  const {name,username,email,contact} = req.body;
  const userData = new userModel({name , username, email, contact });

  userModel.register(userData, req.body.password).then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile");
    })
  })
})

router.get('/profile', isLoggedIn , async function(req, res, next) {
  const user = 
  await userModel
  .findOne({ username : req.session.passport.user})
  .populate("posts")

  res.render('profile', { user , nav: true});
});

router.post("/login", passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/"
}),function(req,res){
});

router.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/");
}


module.exports = router;
