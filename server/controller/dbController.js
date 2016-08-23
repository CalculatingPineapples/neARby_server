var db = require('redis').createClient();
var counter = 1;

function createPlace(req, res) {
  // check to see if the place is in DB
  db.exists(req.body.name, function(err, reply) {
    if (err) { res.send('error accessing the database');
  } else if (reply === 1) {
      // if it is, do not add it to the db
      res('this event already exists');
    } else {
      // otherwise add to database, set to expire and then add to users profile
      db.set(req.body.name);
      db.expire(req.body.name, 2700);
      db.hmset('places', {
        'id': counter,
        'name': req.body.name,
        'description': req.body.description,
        'latitude': req.body.latitude,
        'longitude': req.body.longitude,
        'lat': req.body.lat,
        'lon': req.body.lon,
        'type': req.body.type,
        'user': req.body.user
      });
      db.lpush(req.body.user, counter);
      res('event was created');
    }
  });
}

function getPlace(req, res) {
  var results = [];
  db.hgetall('places', function(err, object) {
    if (err) { res.send('error checking the database');
    } else {
      for (var key in object) {
        if (Math.abs(key.lat - req.body.lat) < .005 && Math.abs(key.lon - req.body.lat) < .005) {
          results.push(key);
        }
      }
    }
});
  res(results);
}

function createEvent(req, res) {
  db.exists(req.body.name, function(err, reply) {
    if (err) { res.send('error accessing the database');
  } else if (reply === 1) {
      // if it is, do not add it to the db
      res('this event already exists');
    } else {
      // otherwise add to database, set to expire and then add to users profile
      db.set(req.body.name);
      db.expire(req.body.name, 7200);
      db.hmset('events', {
        'id': counter,
        'name': req.body.name,
        'description': req.body.description,
        'latitude': req.body.latitude,
        'longitude': req.body.longitude,
        'lat': req.body.lat,
        'lon': req.body.lon,
        'type': req.body.type,
        'user': req.body.user,
        'time': req.body.time
      });
      db.lpush(req.body.user, counter);
      res('event was created');
    }
  });
}

function getEvent(req, res){
  var results = [];
  db.hgetall('places', function(err, object) {
    if (err) { res.send('error accessing the database');
    } else {
      for (var key in object) {
        if (Math.abs(key.lat - req.body.lat) < 0.005 && Math.abs(key.lon - req.body.lat) < 0.005) {
          results.push(key);
        }
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
