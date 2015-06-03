var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


var config = require('./config.js') 

var GOOGLE_CLIENT_ID = '829367360562-ln33ucp1j0eitrrerjlrkmcnocfem93h.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'N9YedL1LMJjBnuD9RukOBp9y';

passport.use(new GoogleStrategy
({
   clientID: GOOGLE_CLIENT_ID,
   clientSecret: GOOGLE_CLIENT_SECRET,
   callbackURL: "http://www.ingenuitystudios.us/loginCallback"
 },
  function(accessToken, refreshToken, profile, done) {
	return done(null, false);
  }
));

app.use(passport.initialize())

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


app.get('/loginCallback', function(req, res)
{
	res.send('wrong place buddy' + req.isAuthenticated)
})

app.get('/auth/google',
  passport.authenticate('google', {scope: ['profile', 'email'],
								   successRedirect:'/profile'}),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  })


app.get('/login', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login',
  									successRedirect: '/profile' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/success', isLoggedIn, function(req,res){

})
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
}); 




var port = config.port
var filename = '10mb.zip'
var IPs = ''


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
	});
})

app.get('/profile', isLoggedIn, function(req, res) 
{
	res.send(req.user+ 'logged in')
});

app.get('/', function(req, res)
{
	var html = '<html><body style="font-family:monospace">' +
		'<h1>Server Info: ' + config.sitename + '</h1>' +
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
