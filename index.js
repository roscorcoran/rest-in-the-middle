var http = require('http'),
  https = require('https'),
  fs = require('fs'),
  colors = require('colors'),
  sys = require('sys'),
  urlPattern = require('url-pattern'),
  nedb = require('nedb'),
  zlib = require('zlib'),
  url = require('url');

/*
 * TODO:
 * Config
 * HTTP --> HTTPS
 * Refactor
 * Proxy
 * */


var proxyPort = 3128;
var responseDir = './responses';
var record = false;
var overwrite = true;
var playback = !record;
var enableProxy = true;
var configFile = 'config.json';
var config = {};

fs.watchFile(configFile, function (c, p) {
  loadConfig(configFile, function () {
    sys.log('Reloaded'.green);
  });
});

function loadConfig(configFile, done) {
  done = done || function () {
    };
  fs.readFile(configFile, function (err, data) {
    if (err) throw err;
    config = JSON.parse(data);
    //sys.log("New config".blue, config);
    done(config);
  });
}

loadConfig(configFile, function () {
  //sys.log('Loaded'.green);
});

var db = new nedb({filename: './responses', autoload: true});

var routes = [
  {
    'hostname': 'www.speedtest.net',
    'url': '*',
    'action': 'proxy'
  },
  {
    'hostname': 'roscorcoran.com',
    'url': '*',
    'action':'monitor'
  },
  {
    'hostname': 'all',
    'url': '*',
    'action':'proxy'
  }
];

function getRoute(urlString) {
  var urlObj = url.parse(urlString);
  sys.log('Route: '.green, urlObj.hostname, urlObj.path);
  for (var i = 0; i < routes.length; i++) {
    if (urlObj.hostname.search(routes[i].hostname) >= 0 || urlObj.hostname == 'all') {
      sys.log('host: MATCHES'.green);
      var pattern = new urlPattern(routes[i].url);
      if (pattern.match(urlObj.path)) {
        sys.log('Route: MATCHES'.green);
        return routes[i].action;
      }
    }
  }
  return false;
}


function saveResponse(res) {
  console.log(res);
  var urlString = res.url;
  sys.log("saving".green, urlString);

  var request = {
    _id: urlString,
    body: res.body,
    headers: res.headers
  };

  db.findOne({_id: urlString}, function (err, doc) {
    if (err) {
      throw err;
    }
    if (doc) {
      if (overwrite) {
        db.update({_id: urlString}, request, {}, function (err, numReplaced) {
          if (err) {
            sys.log(err);
            throw err;
          }
          sys.log('Cache: '.blue, urlString + ' It\'s saved!'.green);
        });
      }
    } else {
      db.insert(request, function (err, newDoc) {
        if (err) {
          sys.log(err);
          throw err;
        }
        sys.log('Cache: '.blue, newDoc._id + ' It\'s saved!'.green);
      });
    }

  });

}


function getResponse(res, callback) {
  var urlString = res.url;
  sys.log("getting".green, urlString.blue);
  db.findOne({_id: urlString}, function (err, res) {
    if (err) {
      throw err;
    }
    //sys.log(res);
    if (res) {
      callback(res);
    } else {
      callback(null);
    }

  });
}


http.createServer(function (origRequest, origResponse) {
  var socket = origRequest.socket;

  // pause the socket during authentication so no data is lost
  //socket.pause();

  var ip = origRequest.connection.remoteAddress;
  sys.log("Incoming request: ".green, (ip + ": " + origRequest.method + " " + origRequest.url).blue);
  var action = getRoute(origRequest.url);
  if (action) {
    if (playback && action == 'monitor') {
      getResponse(origRequest, function (res) {
        if (res.body) {
          sys.log("Data loaded from fs: ".green, res.toString().blue);
          origResponse.write(res.body);
          origResponse.end();
        } else {
          sys.log("No data found".red);
          origResponse.statusCode = '404';
          //origResponse.write('{"error":"No data"}');
          origResponse.end();
        }
      });
    }
    if (enableProxy) {
      sys.log('Proxy Enabled'.green);
      //origRequest.rejectUnauthorized = false;
      var newReq = url.parse(origRequest.url);
      //var newReq = {
      //  host: origRequest.host,
      //  hostname: origRequest.hostname,
      //  port: 80,
      //  method: origRequest.method,
      //  path: origRequest.path,
      //  headers:origRequest.headers,
      //  socket: origRequest.socket
      //};
      newReq.method = origRequest.method;
      newReq.headers = origRequest.headers;
      newReq.headers['X-Forwarded-For'] = socket.remoteAddress;
      newReq.encoding = null;
      //sys.log(newReq.headers);
      //origResponse.writeHead(200, origResponse.headers);

      //newReq.assignSocket(origRequest.socket);
    //***REMOVED***
    //***REMOVED***
    //***REMOVED***
    //sys.log('Making request'.green, options.hostname, options.port, options.path, options.method, options.headers);
    var proxy_request = http.request(newReq, function (res) {
      sys.log("Proxied response: ".green, ip + ": " + res.method + " " + res.url, res.statusCode);

      var resBody = [];

      res.on('data', function (chunk) {
        resBody.push(chunk);
        //sys.log(resBody.blue);
      });

      res.on('end', function () {
        var buffer = Buffer.concat(resBody);
        //sys.log('Proxy received BODY: '.yellow + resBody);
        //sys.log(buffer);
        //origResponse.write(new Buffer(buffer));
        //origResponse.end();
        var encoding = res.headers['content-encoding'];
        if (encoding == 'gzip') {
          zlib.gunzip(buffer, function(err, decoded) {
            callback(err, decoded && decoded.toString());
          });
        } else if (encoding == 'deflate') {
          zlib.inflate(buffer, function(err, decoded) {
            callback(err, decoded && decoded.toString());
          })
        } else {
          callback(null, buffer.toString());
        }
        //sys.log(resBody);

        function callback(err, data){
          if (err) sys.log(err);
          //sys.log(data);
          res.body = data;
          res.url = origRequest.url;
          if (record && action == 'monitor') {
            saveResponse(res);
          }

          //sys.log('Proxy received BODY: '.yellow + resBody);
          if(!playback || action !== 'monitor'){
            origResponse.write(data);
            origResponse.end();
          }

        }
      });

    });

    proxy_request.on('error', function (e) {
      sys.log('Problem with proxy request: '.red, e.message);
    });

    proxy_request.end();
  }
}else{

  }

//var options = origRequest;
//options.hostname = to.hostname;
//options.port = to.port;
//options.path = to.url || origRequest.url;
//options.headers = to.headers || origRequest.headers;


}).
listen(proxyPort);
