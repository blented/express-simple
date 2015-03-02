var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')


var port = 3000

app.get('/', function(req, res)
{
	res.sendFile('test10.zip', {root: __dirname})
})

http.listen(port, function()
{

	console.log('\n\nServer listening at:\n')

	// loop through the networkInterfaces and list
	// each IPv4 that we find
	_.each(os.networkInterfaces(), function(i)
	{
		_.each(i, function(entry)
		{
			if (entry.family == 'IPv4')
				console.log('http://' +
					entry.address + ':' +
					port)
		})
	})
})
