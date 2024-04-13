/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Mohammed Abbas Ali Student ID: 123603219 Date: 12/04/2024
*
*  Published URL: https://jealous-vest-dog.cyclic.app
*
********************************************************************************/


const unCountryData = require("./modules/unCountries");
// const path = require("path");
const express = require('express');
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public')); 
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'web322', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
      return res.redirect("/login");
  }
  next();
}




app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about")
});


app.get("/un/addCountry", ensureLogin,async (req, res) => {
  let regions = await unCountryData.getAllRegions()
  res.render("addCountry", { regions: regions })
});

app.post("/un/addCountry",ensureLogin, async (req, res) => {
  try {
    await unCountryData.addCountry(req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }

});


app.get("/un/editCountry/:code",ensureLogin, async (req, res) => {

  try {
    let country = await unCountryData.getCountryByCode(req.params.code);
    let regions = await unCountryData.getAllRegions();
    

    res.render("editCountry", { country, regions });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});

app.post("/un/editCountry",ensureLogin, async (req, res) => {

  try {
    await unCountryData.editCountry(req.body.a2code, req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/un/deleteCountry/:code", ensureLogin,async (req, res) => {
  try {
    await unCountryData.deleteCountry(req.params.code);
    res.redirect("/un/countries");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
})

app.get("/login",async(req,res)=>{
  res.render("login");
})

app.get("/register", async(req,res)=>{
  res.render("register");
})

app.post("/register", async (req, res) => {
  const userData = req.body;
  authData.registerUser(userData)
      .then(() => {
          res.render("register", { successMessage: "User created" });
      })
      .catch(err => {
          res.render("register", { errorMessage: err, userName: req.body.userName });
      });
});

app.post("/login", async (req, res) => {
  
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
      .then(user => {
          req.session.user = {
              userName: user.userName,
              email: user.email,
              loginHistory: user.loginHistory
          };
          res.redirect('/un/countries');
      })
      .catch(err => {
          res.render("login", { errorMessage: err, userName: req.body.userName });
      });
});

app.get("/logout", async(req, res) => {
  req.session.reset(() => {
      res.redirect('/');
  });
});

app.get("/userHistory", ensureLogin, async (req, res) => {
  res.render("userHistory");
});

app.get("/un/countries", async (req,res)=>{
  
  let countries = [];

  try{
    if(req.query.region){
      countries = await unCountryData.getCountriesByRegion(req.query.region);
    }else{
      countries = await unCountryData.getAllCountries();
    }
    // console.log("countries[0] in server.js:", countries[0])
    res.render("countries", {countries})
  }catch(err){
    res.status(404).render("404", {message: err});
  }

});

app.get("/un/countries/:code", async (req,res)=>{
  try{
    let country = await unCountryData.getCountryByCode(req.params.code);
    res.render("country", {country})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});

// app.get("/un/countries/region-demo", async (req,res)=>{
//   try{
//     let countries = await unCountryData.getCountriesByRegion("Oceania");
//     res.send(countries);
//   }catch(err){
//     res.send(err);
//   }
// });

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

unCountryData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log(`app listening on:  ${HTTP_PORT}`);
    });
}).catch(function(err){
    console.log(`unable to start server: ${err}`);
});

