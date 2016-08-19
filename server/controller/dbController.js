var db = require('./router');

function createPlace(req, res) {
  db.exists(req.body.event, function(err, reply) {
    if (reply === 1) {
      res('this event already exists');
    } else {
      db.set(req.body.event);
      db.expire(req.body.event);
      db.hmset('places', {
        'name': req.body.name,
        'lat': req.body.lat,
        'lon': req.body.lon
      });
      res('event was created');
    }
  });
}

function getPlace(req, res) {
  var results = [];
  db.hgetall('places', function(err, object) {
    for (var key in object) {
      if (Math.abs(key.lat - req.body.lat) < .005 && Math.abs(key.lon - req.body.lat) < .005) {
        results.push(key);
      }
    }
  });
  res(results);
}

function createEvent(req, res) {
  db.exists(req.body.event, function(err, reply) {
    if (reply === 1) {
      res('this event already exists');
    } else {
      db.set(req.body.event);
      db.expire(req.body.event);
      db.hmset('events', {
        'name': req.body.name,
        'lat': req.body.lat,
        'lon': req.body.lon
      });
      res('event was created');
    }
  });
}


function getEvent(req, res){
  var results = [];
  db.hgetall('places', function(err, object) {
    for (var key in object) {
      if (Math.abs(key.lat - req.body.lat) < .005 && Math.abs(key.lon - req.body.lat) < .005) {
        results.push(key);
      }
    }
  });
  res(results);
}

module.exports = {
  createPlace,
  createEvent,
  getPlace,
  getEvent,
};
