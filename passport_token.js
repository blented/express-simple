var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
//var util = require('util')
var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var cookieParser = require('cookie-parser')
var session = require('cookie-session')
//var session = require('express-session')
var config = require('c:/temp/Oauth2Config')


//Necessary variables for Google Authentication. Get these from Google Dev Console Credentials
var GOOGLE_CLIENT_ID = config.google_client_id
var GOOGLE_CLIENT_SECRET = config.google_client_secret
var GOOGLE_CALLBACK_ID = config.google_callback_url

//This callback path matches one listed in the Google Dev Console Credentials
var CALLBACK_PATH = config.google_callback_path


//Admin Stuff
var port =  config.port
var IPs = ''

// This is our fake database for now
var users = {
	'jonathan_adam@brown.edu': {'token' : undefined},
}

// This is a placeholder for a real database query
// that checks whether an email is already in the account
function checkUsers(email)
{
	return  _.contains(Object.keys(users), email)
}

// This is a placeholder for a User.findOne({token: token}) ish query
function checkToken(token)
{
	var stuff =  _.findKey(users, 'token', token)
	return stuff
}

//Just to display the user on our front page; not necessary for auth stuff
var currentProfile


// serializeUser and deserializeUser are how passport interacts with
// its session. Here we define how data is written to, and read from,
// the session - in this case, the cookie session.
passport.serializeUser(function(user, done)
{
	var object =
	{
		'id': user.id,
		'displayName': user.displayName,
		'email': user.emails[0].value,
		'token': user.token
	}
	done(null, object)
})

passport.deserializeUser(function(obj, done)
{
	done(null, obj)
})

//Strategy setup: Get clientID, clientSecret and callbackURL from Google Developer Console
passport.use(new GoogleStrategy
	({
	clientID        : GOOGLE_CLIENT_ID,
	clientSecret    : GOOGLE_CLIENT_SECRET,
	callbackURL     : GOOGLE_CALLBACK_ID
	},
	function(token, refreshToken, profile, done)
	{
		// make the code asynchronous
		// Won't fire until we have retrieved all data from Google
		process.nextTick(function() {
			// In a normal app here is where the app looks up user in database
			// User profile object documentation: http://passportjs.org/docs/profile
			if (checkUsers(profile.emails[0].value))
			{
				currentProfile = profile
				profile.token = token
				users[profile.emails[0].value].token = token
				return done(null, profile)
			}
			 else
				return done(null, false)
			// currentProfile = profile
			// profile.token = token
			// return done(null, profile)
		})
	})
)



// Getting Express and Passport all on the same page in terms of
// talking to each other and the cookie session.
app.use(session(
	{
		name:'Our cookie',
		secret: 'thisisasecret',
		cookie: {maxAge:60*60, expires: new Date().setMinutes(new Date().getMinutes()+ 1)}
	 // resave: false,
	 // saveUninitialized: false
	}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())


// Middleware to check whether a request is authenticated
// This function gets called before every secure resource
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	// Usually you do req.isAuthenticated(), but here
	// a call to lookup the token in the 'database'
	// gives us a possibility to revoke access if there
	// is a malicious user

	// Not encrypted yet; here we would have to call an encryption
	var sessionInfo = req.session

	// if our token is found, proceed
	if (checkToken(sessionInfo.passport.user.token))
		return next()

	//Otherwise redirect to home page
	currentProfile = undefined
	res.redirect('/')
}


// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at CALLBACK_PATH
//   The scope here defines what pieces of data we require from Google.
app.get('/auth/google',
	passport.authenticate('google', {scope: ['profile', 'email'] }),
	function()
	{
	// The request will be redirected to Google for authentication, so this
	// function will not be called.
})

// GET CALLBACK_PATH  (typically by convention something like /auth/google/callback)
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   /fail page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to /success.
app.get(CALLBACK_PATH,
	passport.authenticate('google', {failureRedirect: '/fail' }),
	function(req, res)
	{
	//res.redirect('/success')
	res.redirect('/')
	}
)

// This is identical to the /auth/google page above.
app.get('/login',
	passport.authenticate('google', {scope: ['profile', 'email']}),
	function(req, res) {
	res.redirect('/')
})

// Deletes session data and logs the user out
app.get('/logout', function(req, res){
	currentProfile = undefined
	req.logout()
	req.session = null
	res.redirect('/')
})

// These are all pages that should only be able to be visited while logged in.
// If trying to access while not logged in, the pages should redirect to the home page.
app.get('/secret1', isLoggedIn, function(req, res)
{
	res.send('this is a secret page')
})

app.get('/secret2', isLoggedIn, function(req, res)
{
	res.send('this is another secret page')
})

app.get('/secret3', isLoggedIn, function(req, res)
{
	res.send('this is the third and final secret page')
})

// This is the page that you get sent to if login fails.
app.get('/fail', function(req,res)
{
	res.send('login failed')
})



// The page that you get redirected to immediately following login. Cannot be accessed
// when not logged in.
app.get('/success', isLoggedIn, function(req,res){
	res.send('sucess!' )
})

// Displays username and email if you are logged in
app.get('/', function(req, res)
{
	var html = '<html><body style="font-family:monospace">' +
		'<h1>Profile Info</h1>'
	if (currentProfile)
	{
		console.log('req authenticated')
		console.log(req.isAuthenticated())
		// console.log('req')
		// console.log(req)
		console.log(req.session)
		// console.log(req.user)
		// console.log('is the user')
		html+= '<li>Name</li>'+currentProfile.displayName
		html+= '<li>Email</li>'+currentProfile.emails[0].value
	}
	else
		html+= '<li> No user currently logged in </li>'
	html += '</ul>' +
		'<body></html>'
	res.send(html)
})

// Console logging stuff
http.listen(port, function()
{
	console.log('\n\nServer listening at:\n')

	// loop through the networkInterfaces and list
	// each IPv4 that we find
	var prefix
	_.each(os.networkInterfaces(), function(i)
	{
		_.each(i, function(entry)
		{
			if (entry.family == 'IPv4')
			{
				if (entry.internal)
				{
					prefix = '(internal)'
				}
				else if (entry.address.slice(0, 3) == '10.' ||
					entry.address.slice(0, 4) == '172.' ||
					entry.address.slice(0, 4) == '192.')
				{
					prefix = '(private network)'
				}
				else
					prefix = '(public)'

				console.log(prefix + ' http://' +
					entry.address + ':' +
					port)

				if (!entry.internal)
					IPs += '<li>' + entry.address + '</li>\n'
			}
		})
	})
	IPs = IPs.slice(0, -1)
})