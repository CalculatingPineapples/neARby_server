var redis;
if (process.env.REDISTOGO_URL){
  var rtg = require('url').parse(process.env.REDISTOGO_URL);
  redis = require('redis').createClient(rtg.port, rtg.hostname);
} else {
  redis = require('redis').createClient();
}

var counter = 1;

function createPlace(req, res) {
  // check to see if the place is in redis
  redis.exists(req.body.name, function(err, reply) {
    if (err) { res.send('error accessing the database');
    } else if (reply === 1) {
      // if it is, do not add it to the redis
      res.send('this event already exists');
    } else {
      // otherwise add to database, set to expire and then add to users profile
      redis.set(counter, req.body.name);
      redis.expire(req.body.name, 2700);
      redis.hmset(`place${counter}`, {
        'name': req.body.name,
        'description': req.body.description,
        'latitude': req.body.latitude,
        'longitude': req.body.longitude,
        'lat': req.body.lat,
        'lon': req.body.lon,
        'distance': req.body.distance,
        'username': req.body.username,
        'type': req.body.type,
        'upvotes': req.body.upvotes,
        'downvotes': req.body.downvotes,
      });
      counter++;
      redis.lpush(req.body.username, counter);
      res.send(req.body);
    }
  });
}

function votePlaces(req, res) {
  if (req.body.vote > 5) {
    redis.persist(req.body.name);
  } else {
    redis.expire(req.body.name, 2700);
  }
  redis.hmset('places', {
    vote: req.body.vote
  });
}

function voteEvents(req, res) {
  if (req.body.vote > 5) {
    redis.expire(req.body.end);
  } else {
    redis.expire(req.body.name, 2700);
  }
}

function getPlace(req, res) {
  console.log('test got in places!!');
  var results = [];
  // check through all of the database
    for (var i = 1; i <= counter; i++) {
      redis.hgetall(`place${i}`, function(err, object) {
        if (err) {
          console.log('there was an error in the database');
        } else if (object === null) {
          console.log('nothing in the database!');
        } else if (Math.abs(object.latitude - req.body.latitude) < 1 && Math.abs(object.longitude - req.body.longitude) < 1) {
          results.push(object);
        }
        redis.hgetall(`place${counter}`, function(err, object) {
          console.log('data sent', results)
          res.send(results);
        });
      });
    }
}

function createEvent(req, res) {
  redis.exists(req.body.name, function(err, reply) {
    if (err) { res.send('error accessing the database');
  } else if (reply === 1) {
      // if it is, do not add it to the redis
      res.send('this event already exists');
    } else {
      // otherwise add to database, set to expire and then add to users profile
      redis.set(req.body.name);
      redis.expire(req.body.name, 7200);
      redis.hmset('events', {
        'id': counter,
        'name': req.body.name,
        'description': req.body.description,
        'latitude': req.body.latitude,
        'longitude': req.body.longitude,
        'startTime': req.body.startTime,
        'username': req.body.username,
        'lat': req.body.lat,
        'lon': req.body.lon,
        'distance': req.boyd.distance,
        'type': req.body.type,
        'upvotes': 0,
        'downvoted': 0,
      });
      redis.lpush(req.body.user, counter);
      res.send(req.body);
    }
  });
}

function getEvent(req, res){
  var results = [];
  redis.hgetall('places', function(err, object) {
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
  votePlaces,
  voteEvents,
};
