var app = require('express')()
var http = require('http').Server(app)
var os = require('os')
var _ = require('lodash')
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
