
var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy


var config = require('./config.js') 

var port = config.port
var filename = '10mb.zip'
var IPs = ''

var GOOGLE_CLIENT_ID = '829367360562-ln33ucp1j0eitrrerjlrkmcnocfem93h.apps.googleusercontent.com'
var GOOGLE_CLIENT_SECRET = 'N9YedL1LMJjBnuD9RukOBp9y'

var testingUser = []

var name = ''
var profile = undefined


passport.use(new GoogleStrategy({

	clientID        : GOOGLE_CLIENT_ID,
	clientSecret    : GOOGLE_CLIENT_SECRET,
	callbackURL     : "http://www.ingenuitystudios.us/loginCallback"

    },
    function(token, refreshToken, profile, done) {
    	//name = profile.name
    	//console.log(name)
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
        	//console.log("this is the user")
        	//name = profile.name
        	//profile = profile
        	return done(null, profile)
        })
    }
))


app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
  done(null, user)
});

passport.deserializeUser(function(obj, done) {
  done(null, obj)
});

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next()

    // if they aren't redirect them to the home page
    res.redirect('/')
}


app.get('/loginCallback', function(req, res)
{	
	 passport.authenticate('google', { failureRedirect: '/fail',
  									successRedirect: '/success' }),
	 function(req, res) {
    res.redirect('/success')
})

app.get('/auth/google',
  passport.authenticate('google', {scope: ['profile', 'email']}),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  })

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/fail',
  									successRedirect: '/success' }),
  function(req, res) {
    res.redirect('/success')
  });



app.get('/login', 
  passport.authenticate('google', {scope: ['profile', 'email']}),
  function(req, res) {
    res.redirect('/')
  });

app.get('/fail', isLoggedIn, function(req,res){
	res.send('fail!' )
})


app.get('/success', isLoggedIn, function(req,res){
	res.send('sucess!' )
})

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/')
}); 




var serverInfo = {
	'Type': 'type',
	'Platform': 'platform',
	'CPU Architecture': 'arch',
	'Release': 'release',
	'Uptime': 'uptime',
	'Load Averages': 'loadavg',
	'Total Memory': 'totalmem',
	'Free Memory': 'freemem',
	'CPUs': 'cpus',
	'Network Interfaces': 'networkInterfaces'
}

app.get('/file', function(req, res)
{
	res.sendFile(filename, {root: __dirname})
	res.set({
		'Content-Disposition': 'attachment; filename="'+ filename +'"',
		'Content-Type': 'application/zip'
	})
})


app.get('/', function(req, res)
{
	var html = '<html><body style="font-family:monospace">' +
		'<h1>Server Info: ' + name + '</h1>' +
		'<ul>' +
		'<li><strong>IPs:</strong><ul>' + IPs + '</ul></li>'

	var info
	_.each(serverInfo, function(val, key)
	{
		info = os[val]()
		if (_.isArray(info) || _.isObject(info))
			info = JSON
				.stringify(info, null, 4)
				.replace(/\n/g, '<br>')
				.replace(/ /g, '&nbsp;')
		html += '<li><strong>' + key + ':</strong> ' + info + '</li>'
	})
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

