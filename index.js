var http = require('http');
var express = require('express');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var CollectionDriver = require('./collectionDriver').CollectionDriver;
var FileDriver = require('./fileDriver').FileDriver;

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var mongoHost = 'localHost';
var mongoPort = 27017;
var fileDriver;
var collectionDriver;

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.connect(function (err, mongoClient) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else if (!mongoClient) {
    console.error('Error! Exiting... Must start MongoDB first');
    process.exit(1);
  }
  var db = mongoClient.db('MyDatabase');
  fileDriver = new FileDriver(db);
  collectionDriver = new CollectionDriver(db);
});

app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.send(
    '<html><body><h1>Node.js + MongoDB + iOS app tutorial</h1></body></html>'
  );
});

app.post('/files', function (req, res) {
  fileDriver.handleUploadRequest(req, res);
});
app.get('/files/:id', function (req, res) {
  fileDriver.handleGet(req, res);
});

app.get('/:collection', function (req, res) {
  var params = req.params;
  collectionDriver.findAll(params.collection, function (error, objs) {
    if (error) {
      res.send(400, error);
    } else {
      if (req.accepts('html')) {
        res.render('data', {
          objects: objs,
          collection: params.collection
        });
      } else {
        res.set('Content-Type', 'application/json');
        res.send(200, objs);
      }
    }
  });
});

app.get('/:collection/:entity', function (req, res) {
  var params = req.params;
  var entity = params.entity;
  var collection = params.collection;
  if (entity) {
    collectionDriver.get(collection, entity, function (error, objs) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(200, objs);
      }
    });
  } else {
    res.send(400, { error: 'bad url', url: req.url });
  }
});

app.post('/:collection', function (req, res) {
  var object = req.body;
  var collection = req.params.collection;
  collectionDriver.save(collection, object, function (err, docs) {
    if (err) {
      res.send(400, err);
    } else {
      res.send(201, docs);
    }
  });
});

app.put('/:collection/:entity', function (req, res) {
  var params = req.params;
  var entity = params.entity;
  var collection = params.collection;
  if (entity) {
    collectionDriver.update(collection, req.body, entity, function (
      error,
      objs
    ) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(200, objs);
      }
    });
  } else {
    var error = { message: 'Cannot PUT a whole collection' };
    res.send(400, error);
  }
});

app.delete('/:collection/:entity', function (req, res) {
  // A
  var params = req.params;
  var entity = params.entity;
  var collection = params.collection;
  if (entity) {
    collectionDriver.delete(collection, entity, function (error, objs) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(200, objs);
      }
    });
  } else {
    var error = { message: 'Cannot DELETE a whole collection' };
    res.send(400, error);
  }
});

// wrong address error handing
app.use(function (req, res) {
  res.render('404', { url: req.url });
});

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
