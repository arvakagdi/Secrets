//jshint esversion:6

require('dotenv').config()  // for storing sensitive information in .env file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");   // mongoose epackage for encrypting data
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


// encryption
userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields : ['password'] });  // adding encryption package to our schema


const User = new mongoose.model("User", userSchema)

app.get("/login", function(req,res) {
    res.render("login");
});

app.get("/register", function(req,res) {
    res.render("register");
});


app.post("/register", function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save(function(err){
        if(err){
            res.render(err);
        }else{
            res.render("login")
        }
    });
});

app.post("/login", function(req,res){
    const userUsername = req.body.username;
    const userPassword = req.body.password;

    User.findOne({email : userUsername}, function(err,foundUser){
        if (err){
            res.render(err);
        }else{
            if(foundUser){
                if (foundUser.password === userPassword){
                    res.render("secrets");
                    console.log(foundUser.password);
                }
                else{
                    res.render("login");
                }
            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server started at port 3000.");
});