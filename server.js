const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const phea = require('phea');
const credentials = require('./credentials.json');

const io = require('socket.io')(http);

app.set('port', process.env.PORT || 3001); //port
app.use(express.static(path.join(__dirname, 'public'))); //folder for static content
app.set('views', __dirname + '/views'); //folder for view
app.set('view engine', 'ejs'); //template engine
app.use(bodyParser.urlencoded({ extended: true })); //for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); //for parsing JSON

/*
var httpOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}
*/

const GROUP_ID = 5;
let TRANSITION_TIME = 1000 / 2;

const init = async () => {
  const bridge = await phea.bridge(credentials);
  const group = await bridge.getGroup(GROUP_ID);

  console.log(group);

  const exitHandler = (options, exitCode) => {
    bridge.stop();

    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
  }

  io.on('connection', (socket) => {
    console.log('Client connected :D');
    bridge.start(GROUP_ID);

    const numberOfLights = group.lights.length;

    let i = 0;

    socket.on('transitionTime', (transitionTime) => {
      console.log('received new TRANSITION_TIME');

      TRANSITION_TIME = transitionTime;
    });

    socket.on('colors', (colors) => {
      console.log('Reception des colors', colors);

      const colorsArray = Object.values(colors);

      for(let id = 0; id < numberOfLights; id++) {
          bridge.transition(id+1, colorsArray[(i+id) % colorsArray.length], 1000 / 2);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected :/');
      bridge.stop();
    });
  });

  process.on('exit', exitHandler.bind(null,{cleanup:true}));
  process.on('SIGINT', exitHandler.bind(null, {exit:true}));
  process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
  process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
  process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

  initExpress()
}

const initExpress = () => {
  //Routes
  app.get("/", (req, res) => {
    res.render('index', {});
  });

  //Initialize the awesome
  http.listen(app.get('port'), () => {
    console.log("Express server listening on port " + app.get('port'));
  });
};


init();
