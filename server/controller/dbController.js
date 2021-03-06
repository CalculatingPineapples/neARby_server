// var redis;
// if (process.env.REDISTOGO_URL){
//   var rtg = require('url').parse(process.env.REDISTOGO_URL);
//   redis = require('redis').createClient(rtg.port, rtg.hostname);
// } else {
//   redis = require('redis').createClient();
// }

// var counter = 1;

// function createPlace(req, res) {
//   // check to see if the place is in redis
//   redis.exists(req.body.name, function(err, reply) {
//     if (err) { console.log('error accessing the database');
//     } else if (reply === 1) {
//       // if it is, do not add it to the redis
//       console.log('this event already exists');
//     } else {
//       // otherwise add to database, set to expire and then add to users profile
//       redis.set(counter, req.body.name);
//       redis.expire(req.body.name, 2700);
//       redis.hmset(`place${counter}`, {
//         'name': req.body.name,
//         'description': req.body.description,
//         'latitude': req.body.latitude,
//         'longitude': req.body.longitude,
//         'lat': req.body.lat,
//         'lon': req.body.lon,
//         'distance': Math.floor(req.body.distance),
//         'username': req.body.username,
//         'type': req.body.type,
//         'upvotes': req.body.upvotes,
//         'downvotes': req.body.downvotes,
//         'img': req.body.img,
//         'userVotes': ''
//       });
//       var copy = Object.assign({}, req.body);
//       copy.id = `eventd${counter}`;
//       counter++;
//       redis.lpush(req.body.username, counter);
//       res.send(copy);
//     }
//   });
// }

// function votePlaces(req, res) {
//   console.log('got in vote Events: ', req.body);
//   var copy = Object.assign({}, req.body);
//   var vote = req.body.upvotes - req.body.downvotes;
//   if (req.body.vote === 'upvote') {
//     vote++;
//     copy.upvotes = Number(copy.upvotes) + 1;
//   } else {
//     vote--;
//     copy.downvotes = Number(copy.downvotes) + 1;
//   }
//   if (vote > 5) {
//     // to persist the database
//   } else {
//     redis.expire(req.body.id, 2700);
//   }
//   console.log('test', copy)
//   res.send(copy);
// }

// function voteEvents(req, res) {
//   console.log('got in vote Events: ', req.body);
//   var copy = Object.assign({}, req.body);
//   var vote = req.body.upvotes - req.body.downvotes;
//   if (req.body.vote === 'upvote') {
//     vote++;
//     copy.upvotes = Number(copy.upvotes) + 1;
//   } else if (req.body.vote === 'downvote') {
//     vote--;
//     copy.downvotes = Number(copy.downvotes) + 1;
//   }
//   if (vote > 5) {
//     // to persist the database
//   } else {
//     redis.expire(req.body.id, 2700);
//   }
//   console.log('test', copy);
//   res.send(copy);
// }

// function getPlace(req, res) {
//   var results = [];
//   // check through all of the database
//     for (var i = 1; i <= counter; i++) {
//       redis.hgetall(`place${i}`, function(err, object) {
//         if (err) {
//           console.log('there was an error in the database');
//         } else if (object === null) {
//           console.log('nothing in the database!');
//         } else if (Math.abs(object.latitude - req.body.latitude) < 1 && Math.abs(object.longitude - req.body.longitude) < 1) {
//           if (object.img !== '') {
//             object.img = object.img.split(',');
//           }
//           results.push(object);
//         }
//       });
//     if (i === counter) {
//       redis.hgetall(`place${counter}`, function() {
//         res.send(results);
//       });
//     }
//   }
// }

// function createEvent(req, res) {
//   redis.exists(req.body.name, function(err, reply) {
//     if (err) { throw err;
//     } else if (reply === 1) {
//       // if it is, do not add it to the redis
//       console.log('this event already exists');
//     } else {
//       // otherwise add to database, set to expire and then add to users profile
//       redis.set(req.body.name);
//       redis.expire(req.body.name, 7200);
//       redis.hmset('events', {
//         'id': counter,
//         'name': req.body.name,
//         'description': req.body.description,
//         'latitude': req.body.latitude,
//         'longitude': req.body.longitude,
//         'startTime': req.body.startTime,
//         'username': req.body.username,
//         'lat': req.body.lat,
//         'lon': req.body.lon,
//         'distance': Math.floor(req.body.distance),
//         'type': req.body.type,
//         'upvotes': 0,
//         'downvoted': 0,
//         'img': req.body,
//         'userVotes': ''
//       });
//       var copy = Object.assign({}, req.body)
//       copy.id = `eventd${counter}`;
//       counter++;
//       redis.lpush(req.body.user, counter);
//       res.send(copy);
//     }
//   });
// }

// function getEvent(req, res){
//   var results = [];
//   for (var i = 1; i <= counter; i++) {
//     redis.hgetall(`event${i}`, function(err, object) {
//       if (err) { throw err
//       } else if (object === null) {
//         console.log('nothing in the database!');
//       } else if (Math.abs(object.latitude - req.body.latitude) < 1 && Math.abs(object.longitude - req.body.longitude) < 1) {
//       if (object.img !== '') {
//         object.img = object.img.split('');
//       }
//         results.push(object);
//       }
//     });
//     if (i === counter) {
//       redis.hgetall(`event${counter}`, function() {
//         res.send(results);
//       });
//     }
//   }
// }

// module.exports = {
//   createPlace,
//   createEvent,
//   getPlace,
//   getEvent,
//   votePlaces,
//   voteEvents,
//   counter,
//   redis
// };
