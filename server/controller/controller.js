var request = require('request');
var initLon = null;
var initLat = null;
var redis = require('./dbController');
var counter = require('./dbController')

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function hypotenuseDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000; // Radius of the earth in m
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in m
  return d;
}

function findXDistance(initLat, newLat) {
  return (newLat - initLat) * 111230;
}

function square(number) {
  return number * number;
}

function findYDistance(hypotenuse, xDistance, initLon, newLon) {
  var yDistance = Math.sqrt(square(hypotenuse) - square(xDistance));
  return (newLon - initLon > 0) ? yDistance : -1 * yDistance;
}

function checkInit(req) {
  if (req.body.threejsLat === 0 && req.body.threejsLon === 0) {
    initLat = req.body.latitude;
    initLon = req.body.longitude;
  }
}

var placesKeyword = {
  food: 'restaurant',
  hotel: 'lodging',
  cafes: 'bakery|cafe',
  nightlife: 'bar|night_club',
  shopping: 'clothing_store|department_store|electronics_store|shopping_mall',
  publicTransit: 'bus_station|subway_station|train_station',
  bank: 'atm|bank',
  gasStation: 'gas_station',
  parking: 'parking',
  park: 'park',
};

function placesFilter(obj) {
  var filtered = false;
  var results = [];
  for (var key in obj) {
    if (obj[key] === true) {
      filtered = true;
      results.push(placesKeyword[key]);
    }
  }
  if (filtered) {
    return `&type=${results.join('+')}`;
  } else {
    return '';
  }
}

function placesSearch(string) {
  if (string === '' || string === undefined) {
    return '';
  } else {
    var stringArray = string.split(' ');
    return `&keyword=${stringArray.join('+')}`;
  }
}

function getPlaces(req, res) {
  checkInit(req);
  var googleOpenNow = '';
  if (req.body.openNow !== undefined) {
    googleOpenNow = '&opennow';
  }
  var radius = 1000;
  var apiKey = 'AIzaSyD7aR69bFQ1ao2A3PKTBRGUEp4cSWaxnmw';
  var link = `https://maps.googleapis.com/maps/api/place/search/json?location=${req.body.latitude},${req.body.longitude}&radius=${radius}${placesFilter(req.body)}${googleOpenNow}${placesSearch(req.body.placeSearch)}&key=${apiKey}`;
  return new Promise((resolve, reject) => {
    request(link, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var placesObj = [];
        var googleResults = JSON.parse(body);
        googleResults.results.forEach(function(result, index) {
            var googleLat = findXDistance(initLat, result.geometry.location.lat);
            var distanceFromInit = hypotenuseDistance(initLat, initLon, result.geometry.location.lat, result.geometry.location.lng);
            var googleDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, result.geometry.location.lat, result.geometry.location.lng);
            var googleLon = findYDistance(distanceFromInit, googleLat, initLon, req.body.longitude);
            googleDistance = Math.floor(googleDistance * 3.28084);

            var name = result.name;
            if (name !== null) {
              name = result.name.replace(/'/g, '');
            }

            var address = result.vicinity;
            if (address !== null) {
              address = result.vicinity.replace(/'/g, '');
            }
            var place = {
            name: name,
            googleId: result.place_id,
            lat: googleLat,
            lon: googleLon,
            realLat: result.geometry.location.lat,
            realLon: result.geometry.location.lng,
            distance: googleDistance,
            img: result.icon,
            address: address,
            type: 'place',
            };
            placesObj.push(place);
        });
        resolve(res.send(placesObj));
      }
    });
  });
}

function getPlace(req, res) {
  var results = [];
  console.log('first time i went thoguth here', results)
    for (var i = 1; i <= counter; i++) {
      redis.hgetall(`place${i}`, function(err, object) {
        if (err) {
          console.log('there was an error in the database');
        } else if (object === null) {
          console.log('nothing in the database!');
        } else if (Math.abs(object.latitude - req.body.latitude) < 1 && Math.abs(object.longitude - req.body.longitude) < 1) {
          results.push(object);
        }
      });
    if (i === counter) {
      redis.hgetall(`place${counter}`, function() {
        console.log('second time i went thoguth here', results)
        res.send(results);
      });
    }
  }
  // check through all of the database
}


function dateFormat(date) {
  var day = date.getDate();
  if ((date.getDate()) <= 9) {
    day = `0${date.getDate()}`;
  }
  var month = date.getMonth() + 1;
  if ((date.getMonth() + 1) <= 9) {
    month = `0${date.getMonth() + 1}`;
  }
  return `${date.getFullYear()}${month}${day}00`;
}

var eventsCategory = {
  business: 'conference+business',
  family: 'family_fun_kids',
  comedy: 'comedy',
  festivals: 'festivals_parades+food,outdoors_recreation',
  sports: 'sports',
  music: 'music',
  social: 'attractions+community+singles_social',
  film: 'movies_film',
  art: 'art+performing_arts',
  sci_tec: 'science+technology',
};

function eventsFilter(obj, string) {
  var filtered = false;
  var results = [];
  for (var key in obj) {
    if (obj[key] === true) {
      filtered = true;
      results.push(eventsCategory[key]);
    }
  }
  if (string !== '' || string !== undefined) {
    filtered = true;
    results.push(string);
  }
  if (filtered) {
    return `&q=${results.join('+')}`;
  } else {
    return '';
  }
}

function getEvents(req, res) {
  checkInit(req);
  var startDate = new Date();
  var endDate = new Date();
  endDate.setDate(endDate.getDate() + req.body.eventDays - 1);
  var date = `${dateFormat(startDate)}-${dateFormat(endDate)}`;
  var eventsApiKey = 'CbNBBV9Qm4wTwMpg';
  var radius = 0.5;
  var eventsApiLink = `http://api.eventful.com/json/events/search?...&location=${req.body.latitude},${req.body.longitude}&within=${radius}&units=miles&date=${date}${eventsFilter(req.body, req.body.eventSearch)}&app_key=${eventsApiKey}`;
  return new Promise((resolve, reject) => {
    request(eventsApiLink, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        if (!error && response.statusCode === 200) {
          var eventObj = [];
          var eventsResults = JSON.parse(body);
          if (eventsResults.events !== null && eventsResults.events.event[0] !== undefined) {
          eventsResults.events.event.forEach(function(event) {
            var eventLat = findXDistance(initLat, event.latitude);
            var distanceFromInit = hypotenuseDistance(initLat, initLon, event.latitude, event.longitude);
            var eventDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, event.latitude, event.longitude);
            var eventLon = findYDistance(distanceFromInit, eventLat, initLon, req.body.longitude);
            eventDistance = Math.floor(eventDistance * 3.28084);

            var name = event.title;
            if (name !== null) {
              name = event.title.replace(/'/g, '');
              name = event.title.replace(/#&39/g, '');
            }

            var venue = event.venue_name;
            if (venue !== null) {
              venue = event.venue_name.replace(/'/g, '');
              venue = event.venue_name.replace(/#&39/g, '');
            }

            var address = event.venue_address;
            if (address !== null) {
              address = event.venue_address.replace(/'/g, '');
              venue = event.venue_name.replace(/#&39/g, '');
            }

            var description = event.description;
            if (description !== null) {
              description = event.description.replace(/'/g, '');
              description = event.description.replace(/#&39/g, '');
            }

            var place = {
            name: name,
            venue: venue,
            address: address,
            startTime: event.start_time,
            endTime: event.stop_time,
            lat: eventLat,
            lon: eventLon,
            realLat: event.latitude,
            realLon: event.longitude,
            distance: eventDistance,
            url: event.url,
            image: event.image,
            details: event.description,
            type: 'event'
            };
            eventObj.push(place);
          });
          }
          resolve(res.send(eventObj));
        }
      }
    });

  });
}

function getPhotos(req, res) {
  var flickrApiKey = '0067ef61b0e0fe17b2d46892a314223b';
  var flickrGetPhotosLink = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrApiKey}&text=san+francisco+${req.body.name.replace(' ', '+')}&format=json&nojsoncallback=1`;
  return new Promise((resolve, reject) => {
    request(flickrGetPhotosLink, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        var results = [];
        var images = JSON.parse(body);
        images.photos.photo.forEach(function(item) {
          var url = `https://farm${item.farm}.staticflickr.com/${item.server}/${item.id}_${item.secret}.jpg`;
          results.push(url);
        });
      }
    resolve(res.send(results));
    });
  });
}

function getDirections(req, res) {
  var ApiDirectionKey = 'AIzaSyD2yLYA4u-MuYGMJrBgrerIF898U2s6MlA';
  var getDirectionsLink = `https://maps.googleapis.com/maps/api/directions/json?origin=${req.body.curLat},${req.body.curLon}&destination=${req.body.destLat},${req.body.destLon}&mode=walking&key=${ApiDirectionKey}`;
  return new Promise((resolve, reject) =>  {
    request(getDirectionsLink, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        var results = [];
        var directions = JSON.parse(body);
        directions.routes[0].legs[0].steps.forEach(function(item) {
          var newItems = item.html_instructions.replace('<div style="font-size:0.9em">', '.  ');
          results.push(newItems.replace(/<(?:.|\n)*?>/gm, ''));
        });
      }
      resolve(res.send(results));
    });
  });
}

module.exports = {
  getPlaces,
  getEvents,
  getPhotos,
  getDirections,
};
