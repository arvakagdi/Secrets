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

const app = express();

app.use(express.static("public"));   //Serving static files in Express
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({ 
    secret: "Our little secret.",  //key
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})

userSchema.plugin(passportLocalMongoose);  // added plugin to schema 

const User = new mongoose.model("User", userSchema)

// passport local configuration
// use static serialize and deserialize of model for passport session support
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req,res) {
    res.render("home");
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