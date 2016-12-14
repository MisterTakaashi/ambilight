var express = require('express'),
    bodyParser = require('body-parser');
    http = require('http'),
    path = require('path'),
    fs = require('fs');

var app = express();

app.set('port', process.env.PORT || 3001); //port
app.use(express.static(path.join(__dirname, 'public'))); //folder for static content
app.set('views', __dirname + '/views'); //folder for view
app.set('view engine', 'ejs'); //template engine
app.use(bodyParser.urlencoded({ extended: true })); //for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); //for parsing JSON

var httpOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}

//Routes
app.get("/", (req, res) => {
    res.render('index', {});
});

//Initialize the awesome
http.createServer(app).listen(app.get('port'), function(){
//http.createServer(httpOptions, app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});