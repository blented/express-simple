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