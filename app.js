//jshint esversion:6

require('dotenv').config()  // for storing sensitive information in .env file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");   // mongoose epackage for encrypting data
// const md5 = require("md5");  // hashing
const bcrypt = require("bcrypt");   // using bcrypt for hashing and salting
const saltRounds = 12;     // salt rounds 

const app = express();

app.use(express.static("public"));   //Serving static files in Express
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function(req,res) {
    res.render("home");
});

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})


const User = new mongoose.model("User", userSchema)

app.get("/login", function(req,res) {
    res.render("login");
});

app.get("/register", function(req,res) {
    res.render("register");
});


app.post("/register", function(req,res){  
    // encrypting password using bcrypt
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const newUser = new User({
            email : req.body.username,
            password : hash   // changing password with hash 
        });
    
        newUser.save(function(err){
            if(err){
                res.render(err);
            }else{
                res.render("secrets")
            }
        });
    });


});

app.post("/login", function(req,res){
    // to check password we will use compare 

    const userUsername = req.body.username;
    const userPassword = req.body.password;

    User.findOne({email : userUsername}, function(err,foundUser){
        if (err){
            console.log(err);
        }else{
            if(foundUser){
                // compare passwords using bcrypt compare
                bcrypt.compare(userPassword, foundUser.password, function(err, result) {
                    if (result === true){
                        res.render("secrets");
                    }
                    else{
                        res.render("login");
                    }
                });
            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server started at port 3000.");
});