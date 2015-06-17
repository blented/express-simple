var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
//var util = require('util')
var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var cookieParser = require('cookie-parser')
var session = require('express-session')
var config = require('c:/temp/Oauth2Config')


var GOOGLE_CLIENT_ID = config.google_client_id
var GOOGLE_CLIENT_SECRET = config.google_client_secret
var GOOGLE_CALLBACK_ID = config.google_callback_url
var CALLBACK_PATH = config.google_callback_path


var port =  config.port
var IPs = ''


//This is just to keep track of the current profile visually
var currentProfile


// Passport Boilerplate
passport.serializeUser(function(user, done)
{
	done(null, user)
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
		//make the code asynchronous
		// User.findOne won't fire until we have all our data back from Google
		process.nextTick(function() {
			//In a normal app here is where the app looks up user in database
			if (profile.emails[0].value == "jonathan_adam@brown.edu")
			{
				currentProfile = profile
				return done(null, profile)
			}
			 else
				console.log(profile.em)
				return done(null, false)

		})
	})
)

//Configure express and its sessions
app.use(session(
	{secret: 'thisisasecret',
	 resave: false,
	 saveUninitialized: false
	}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next()
	// if they aren't redirect them to the home page
	res.redirect('/')
}

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
	passport.authenticate('google', { scope: ['profile', 'email'] }),
	function()
	{
	// The request will be redirected to Google for authentication, so this
	// function will not be called.
})

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(CALLBACK_PATH,
	passport.authenticate('google', { failureRedirect: '/fail' }),
	function(req, res)
	{
	res.redirect('/success')
	}
)

app.get('/fail', function(req,res)
{
	res.send('login failed')
})

app.get('/login',
	passport.authenticate('google', {scope: ['profile', 'email']}),
	function(req, res) {
	res.redirect('/')
})

app.get('/logout', function(req, res){
	currentProfile = undefined
	req.logout()
	res.redirect('/')
})

app.get('/success', isLoggedIn, function(req,res){
	res.send('sucess!' )
})

app.get('/', function(req, res)
{
	var html = '<html><body style="font-family:monospace">' +
		'<h1>Profile Info</h1>'
	if (currentProfile)
	{
		html+= '<li>Name</li>'+currentProfile.displayName
		html+= '<li>Email</li>'+currentProfile.emails[0].value
	}
	else
		html+= '<li> No user currently logged in </li>'
	html += '</ul>' +
		'<body></html>'
	res.send(html)
})


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