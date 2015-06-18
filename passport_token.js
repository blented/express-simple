var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
//var util = require('util')
var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var cookieParser = require('cookie-parser')
var BearerStrategy = require('passport-http-bearer').Strategy
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


var users = {
	'jonathan_adam@brown.edu': undefined,
}

function checkUsers(email)
{
	console.log('we are checking the users fake database')
	return  _.contains(Object.keys(users), email)
}

function checkTokens(token)
{
	console.log('we are checking the fake database for tokens')
	var stuff = _.findKey(users, token)
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
				console.log('checking google auth every time')
				currentProfile = profile
				profile.token = token
				users[profile.emails[0].value] = token
				console.log('token has now been set for user')
				console.log(profile.emails[0].value)
				console.log(users[profile.emails[0].value])
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
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		{
			return next()
		}
	// if they aren't redirect them to the home page
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
		console.log('redirectinnngggngngng')
	// res.redirect('/success?access_token=' + req.user.access_token)
	res.redirect('/')
	}
)

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
	console.log('req authenticated')
	console.log(req.session)
	console.log('req user')
	console.log(req.user)
	console.log('req cookies')
	console.log(req.cookies)
	console.log(req.isAuthenticated())
	// if (req.isAuthenticated())
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