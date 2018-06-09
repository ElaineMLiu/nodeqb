//app.js is the entry point to the node.js application
//$npm init --> dependencies are in the project folder's package.json
//$npm install --> You already installed them
//$node app --> will come to this entry code

//----------- require the DEPENDENCIES ----------------
const express = require('express');
var bodyParser = require('body-parser');
var path = require('path');//core module didn't need to separately install
var expressValidator = require('express-validator');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/nodeqb');
let db = mongoose.connection;

// Check the connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
  console.log(err);
});

//just do this, like it makes a server
const app = express();

// -------------------- VIEW ENGINE ------------------------
// is this also middleware?
// instead of res.send('hi');     res.json(people);
// This will get the 'html'-type of homepage from ./views/index.ejs
// You can also use pug=jade, but it is indent-based and weird syntax
// EJS is a lot nicer, just like html, php
// embedded javascript
app.set('view engine', 'ejs'); //how you want to render the 'html' pages
app.set('views', path.join(__dirname, 'views')); // where are the files you want to view


// ------------------- MIDDLEWARE MUST PUT BEFORE ROUTES  -----------------------
// function that has access to req and res objects and next middleware firing after it
// runs every time the application is loaded
// most modules have their own middleware to set up
        // example custom middleware: logger outputs to cmd at each refresh
        /*
        var logger = function(req, res, next){
          console.log('Logging...'); //on cmd, at each browser refresh
          next(); //ends the middleware and starts next one
        }
        //to do anything, we need to use the MIDDLEWARE
        app.use(logger);
        */
// middelware for body-parser module, it's in their documentation
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


//Global variables, put in own middleware
//errors is a global variable to be also seen in index.ejs
/*
app.use(function(req,res,next){
  res.locals.errors = null; //set global variable to null by default
  next();
});
*/


app.use(expressValidator()); //expressValidator middleware

//middleware so that we can find our public folder
// We make the public folder to hold static resource files
// like css and jquery
      // for example if in ./public/index.html has the words TEST,
      // this loads on browser and only shows TEST, overwrites a hello world from this file!
      // So, if you have angularjs application, it would be in public/
      // But, we want to render views from server.
// set Static path
app.use(express.static(path.join(__dirname,'public')));

// Bring in the Models (which are the actual array of objects/entries in the tables/collections, not just the schema?)
let Quiz = require('./models/quiz'); // quiz.js is the structure of each entry in the quizzes table


// ------------------- ROUTES -----------------------
//now we can create routes
//won't do anything until you listen to browser port 3000
        /*
        app.get('/', function(req,res){
          //res.send('Hello World');
          let quizzes = [
            {
              id: 1,
              title: 'Gravity',
              class: 'wXy1z',
              description: 'Chapter 8 Review',
              reviewable: true,
              plays: 0,
              created_at: '2018_5_2'
            },
            {
              id: 2,
              title: 'Kinematics',
              class: 'wXy1z',
              description: 'Chapters 1~3 Review',
              reviewable: false,
              plays: 0,
              created_at: '2017_8_01'
            }
          ];
          res.render('index',{
              title: 'Quizzes',
              quizzes: quizzes
          });
        });
        */
// Home page index.ejs lists out all the quizzes in the Quiz table
app.get('/',function(req,res){
  Quiz.find({}, function(err, quizzes){ //query all {} the quizzes in the Quiz table
    if(err){
      console.log(err);  //error in query
    }else{   //show all the quizzes info in list on index.ejs page
      res.render('index', {
        title: 'Quizzes',
        quizzes: quizzes
      });
    }
  });
});

// Render the add-quiz page in add_quiz.ejs
// Browser makes request to get that page
app.get('/quizzes/add', function(req,res){
  res.render('add_quiz',{
      title: 'Add Quiz'
  });
});

// Browser has form in add_quiz.ejs page
// Post the data in the form to SERVER
app.post('/quizzes/add', function(req,res){
  /*
  console.log('Form from add_quiz.ejs, /articles/add Submitted');
  console.log(req.body.title); //need body parser to get this form field
  return;
  */
  // ----- MAKE A ROW FOR QUIZ TABLE in ./models/quiz.js from nodeqb database -----------
  let quiz = new Quiz(); //so this is setting up a data to Quiz table
  quiz.title = req.body.title; //need body parser to get this form field
  quiz.class = req.body.class;
  quiz.description = req.body.description;
  // ----- SAVE ABOVE ROW TO QUIZ TABLE in ./models/quiz.js from nodeqb database -----------
  quiz.save(function(err){
    if(err){
      console.log(err);
      return;
    }else{
      res.redirect('/'); // entry added without error, redirect to homepage
      // go to browser localhost:3000/quizzes/add to test out
      // go to mongo shell and db.find().pretty()
    }
  });
});

// Route for the Quiz PLAY button in index.ejs
// the list of quizzes, click the quiz PLAY button, sends the quiz._id through URL
// query the quiz entry for this  _id
// It goes to localhost:/3000/quiz/...weird_quiz_id... and the view is rendered from ./views/quiz.ejs
app.get('/quiz/:id',function(req,res){
  Quiz.findById(req.params.id, function(err, quiz){
    //console.log(quiz);
    //return;
    res.render('quiz', {
      quiz: quiz
    });
  });
});

// Route for the Quiz EDIT button in index.ejs
// This gets the form to edit the quiz
// the list of quizzes, click the quiz EDIT button, sends the quiz._id through URL
// query the quiz entry for this  _id
// It goes to localhost:/3000/quiz/edit/...weird_quiz_id... and the view is rendered from ./views/edit_quiz.ejs
// edit_quiz.ejs is just like add_quiz.ejs except for the post url and values are filled in
// edit_quiz.ejs will then post to the same url, passing the quiz _id in the URL
app.get('/quizzes/edit/:id',function(req,res){
  Quiz.findById(req.params.id, function(err, quiz){
    //console.log(quiz);
    //return;
    res.render('edit_quiz', {
      title: 'Edit Quiz',
      quiz: quiz
    });
  });
});

// Route to post the form's data to server, after the quiz is EDITed. Similar to adding a quiz
// The form in edit_quiz.ejs sends the id in the URL again
app.post('/quizzes/edit/:id', function(req,res){
  // ----- make an object -----------
  let quiz = {}; //empty object
  quiz.title = req.body.title; //append data into object
  quiz.class = req.body.class;
  quiz.description = req.body.description;

  // ----- Make a query --------
  let query = {_id:req.params.id};

  // ----- Update the queried entry in QUIZ TABLE in ./models/quiz.js from nodeqb database -----------
  Quiz.update(query, quiz, function(err){
    if(err){
      console.log(err);
      return;
    }else{
      res.redirect('/'); // entry added without error, redirect to homepage
      // go to browser localhost:3000/quizzes/add to test out
      // go to mongo shell and db.find().pretty()
    }
  });
});

// ------ Route for the DELETE buttons -----
// any button of class .delete-quiz and attribute 'data-id' set to quiz_id in any ejs file, since footer has the script main.js
// and main.js attaches an on-click event to the delete button and gets the attribute
// Then main.js makes jquery ajax delete request to this route, passing quiz _id in URL
app.delete('/quizzes/delete/:id', function(req,res){
  let query = {_id: req.params.id};
  Quiz.remove(query,function(err){
    if(err){
      console.log(err);
    }
    res.send('Success'); //default would be 200 status, server sends this response
  });
});


// ------------- SERVER LISTENS TO BROWSER ---------------------
//The server needs to listen to the browser, port 3000
// When it starts up and listens, callback is to show on command line the message
// $node app --> comes to this file, and server started up
//if you didn't set up the routes yet:
  // browser localhost:3000 shows 'cannot GET /' cuz no homepage made yet. '/' is homepage
  // browser localhost:3000/about shows 'cannot GET /about' cuz no about.html view yet
app.listen(3000, function(){
  console.log('Server Started on Port 3000');
});