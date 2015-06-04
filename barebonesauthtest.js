// HAD TO ENABLE GOOGLE+ API in Google APPS

var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  app = express()


// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
var GOOGLE_CLIENT_ID = "353594996268-eunc8cd2nfvp9qh0nc3dd5mn96ph3irr.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "bTy5kWCVUImKMH_9rlXx5qAH"

var id = undefined
var displayName = undefined

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/oauth2callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      id = profile.id
      displayName = profile.displayName

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      //if (profile.id == "112209607950970881138")// and return that user instead.
        return done(null, profile);
      //else return done(null, false);
    });
  }
));





// configure Express

  app.use(session({secret: 'hello there', resave:false, saveUnitialized: false}))
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
//  app.use(express.static('public'))
/*  app.use(app.router);
});*/


app.get('/', function(req, res){
  res.send('index' + { user: req.user } + ' id '+ id+ ' name'+ displayName);
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.send('account'+ { user: req.user });
});

app.get('/login', function(req, res){
  res.send('login'+ { user: req.user });
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

app.get('/test', function(req, res){
  res.send('woohoo')
})

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/oauth2callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("got to callback")
    console.log(req.isAuthenticated())
    res.redirect('/secret');
  });



app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/secret', ensureAuthenticated, function(req,res){
  res.send('success')
})

app.get('/woo', ensureAuthenticated, function(req,res){
  res.send('i can only access this when logged in')
})

app.get('/hi', function(req,res){
  res.send('hi')
})

app.listen(3000)
console.log("listening at 3000")


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  //console.log(req.isAuthenticated())
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}