var express = require('express');
var bodyParser = require('body-parser');
var router = require('./router');
// var redis;

var app = express();
var port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);


app.listen(process.env.PORT || port);
console.log(`Listening on port ${port}`);

if (process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  var redis = require('redis').createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(':')[1]);
} else {
    var redis = require('redis').createClient();
}

module.exports = redis;
