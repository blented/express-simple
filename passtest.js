var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')

var GOOGLE_CLIENT_ID
var passport = require('passport')

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: 333,//GOOGLE_CLIENT_ID,
    clientSecret: 444,// GOOGLE_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:4000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.use(passport.initialize())
app.use(passport.session())

var config = require('./config.js') 


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

app.get('/auth/google',
  passport.authenticate('google', { scope: 'https://www.google.com/m8/feeds' }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/auth/google/return', 
  passport.authenticate('google', { 
  	successRedirect: '/secretpage',
  	failureRedirect: '/auth/google' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/auth/return');
  });


app.get('/secretpage', function(req,res)
{
	var html = '<html><body style="font-family:monospace">' +
		'<h1>Auth page found</h1></body></html>'
		res.send(html)

})


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
