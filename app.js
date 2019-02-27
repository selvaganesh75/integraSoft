
var http = require('http');
var fs = require('fs');
var express = require('express');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var app = express();
var hbs = exphbs.create({helpers:{selectedCountry:function(){return 'selected'},indexInc:function(index){ return index + 1 }}});

var partialsPath = __dirname + '/app/server/views/partials/';
app.locals.pretty = true;
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/app/server/views');
app.engine('.hbs', exphbs({extname: '.hbs',layout: false,partialsDir:partialsPath}));
app.set('view engine', '.hbs');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));
// build mongo database connection url //
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || 27017;
process.env.DB_NAME = process.env.DB_NAME || 'node-login';


if (app.get('env') != 'live'){
	process.env.DB_URL = 'mongodb://'+process.env.DB_HOST+':'+process.env.DB_PORT;
}	else {
// prepend url with authentication credentials // 
	process.env.DB_URL = 'mongodb+srv://selvaganesh:Selva%407584@cluster0-y1wt4.mongodb.net/test?retryWrites=true';
}
app.use(session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ url: process.env.DB_URL })
	})
);	

require('./app/server/routes')(app);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
