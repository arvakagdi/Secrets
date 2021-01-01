//jshint esversion:6

require('dotenv').config()  // for storing sensitive information in .env file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
//Passport-Local Mongoose is a Mongoose plugin that simplifies building username and password login with Passport.
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;  // require google strategy for OAuth2 (configuring strategy)
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findOrCreate')  // for using find or create functionality in google strategy

const app = express();

app.use(express.static("public"));   //Serving static files in Express
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({ 
    secret: process.env.KEY,  //key
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId: String,
    facebookId: String
})

userSchema.plugin(passportLocalMongoose);  // added plugin to schema 
userSchema.plugin(findOrCreate) // add findOrCreate plugin to schema

const User = new mongoose.model("User", userSchema)

// passport local configuration
// use static serialize and deserialize of model for passport session support
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

// setting up google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"   // to be used for google + deprecation failure
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {  // we can inplement finOne or createOne available in mongoose, but here we used finOrCreare package available
      return cb(err, user);
    });
  }
));

// setting up facebook strategy

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.CALLBACK_URL_FB
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req,res) {
    res.render("home");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/auth/google", // authenticating through google
  passport.authenticate("google", { scope: ["profile"] }));


app.get("/auth/google/secrets",  // when user logins via google it will be redirected to this page
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
// Successful authentication, redirect to secrets.
res.redirect('/secrets');
});


app.get("/login", function(req,res) {
    res.render("login");
});

app.get("/register", function(req,res) {
    res.render("register");
});

app.get("/secrets", function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    // deauthenticate the user and end the user session
    req.logout();
    res.redirect("/");  // go back to home page
});

app.post("/register", function(req,res){  
// from passport-local package, it creates user for us and we don't have to create new user or access db
    User.register({username: req.body.username}, req.body.password,function(err,user){
        if (err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", function(req,res){
    // create user and authenticate to see if it exists using passport
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // user passport's login method to login the user
    req.login(user, function(err){
        if (err){
            console.log(err);
        } else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});



app.listen(3000, function(){
    console.log("Server started at port 3000.");
});