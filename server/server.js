var express = require('express');
var bodyParser = require('body-parser');
var router = require('./router');

var app = express();
var port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);


app.listen(process.env.PORT || port);
console.log(`Listening on port ${port}`);

