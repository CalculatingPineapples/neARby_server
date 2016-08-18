var request = require('request');
var initLon = null;
var initLat = null;

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// calculates the total distance
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

// calculates the x distance
function findXDistance(initLat, newLat) {
  return (newLat - initLat) * 111230;
}

function square(number) {
  return number * number;
}

// calculates the y distance using Pythagorean Theorem
function findYDistance(hypotenuse, xDistance, initLon, newLon) {
  var yDistance = Math.sqrt(square(hypotenuse) - square(xDistance));
  return (newLon - initLon > 0 ) ? yDistance : -1 * yDistance;
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
  cafes: 'bakery+cafe',
  nightlife: 'bar+night_club',
  shopping: 'clothing_store+department_store+electronics_store+shopping_mall',
  publicTransit: 'bus_station+subway_station+train_station',
  bank: 'atm+bank',
  gasStation: 'gas_station',
  parking: 'parking',
  parks: 'park',
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
  // call to google API to get locations around
  var radius = 1000;
  var apiKey = 'AIzaSyDXk9vLjijFncKwQ-EeTW0tyiKpn7RRABU';
  var link = `https://maps.googleapis.com/maps/api/place/search/json?location=${req.body.latitude},${req.body.longitude}&radius=${radius}${placesFilter(req.body)}${googleOpenNow}${placesSearch(req.body.placeSearch)}&key=${apiKey}`;
  return new Promise((resolve, reject) => {
    request(link, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var placesObj = [];
        var googleResults = JSON.parse(body);
        // iterate over the get request to extract data we want
        googleResults.results.forEach(function(result, index) {
          // calculate each of the distances in meters
            var googleLat = findXDistance(initLat, result.geometry.location.lat);
            var distanceFromInit = hypotenuseDistance(initLat, initLon, result.geometry.location.lat, result.geometry.location.lng);
            var googleDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, result.geometry.location.lat, result.geometry.location.lng);
            var googleLon = findYDistance(distanceFromInit, googleLat, initLon, req.body.longitude);
            googleDistance = Math.floor(googleDistance * 3.28084);
            // populate an object with all necessary information
            var place = {
            name: result.name,
            lat: googleLat,
            lon: googleLon,
            distance: googleDistance,
            img: result.icon,
            };
            placesObj.push(place);
        });

        // send back data to client side
        resolve(res.send(placesObj));
      }
    });
  });
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
  business: 'conference,business',
  family: 'family_fun_kids',
  comedy: 'comedy',
  festivals: 'festivals_parades,food,outdoors_recreation',
  sports: 'sports',
  music: 'music',
  social: 'attractions,community,singles_social',
  film: 'movies_film',
  art: 'art,performing_arts',
  sci_tec: 'science+technology',
};

function eventsFilter(obj) {
  var filtered = false;
  var results = [];
  for (var key in obj) {
    if (obj[key] === true) {
      filtered = true;
      results.push(placesKeyword[key]);
    }
  }
  if (filtered) {
    return `&category=${results.join('+')}`;
  } else {
    return '';
  }
}

function eventsSearch(string) {
  if (string === '' || string === undefined) {
    return '';
  } else {
    var stringArray = string.split(' ');
    return `&keyword=${stringArray.join('+')}`;
  }
}

function getEvents(req, res) {
  console.log('Events Post Request: ');
  console.log(req.body);
  checkInit(req);
  var startDate = new Date();
  var endDate = new Date();
  endDate.setDate(endDate.getDate() + req.body.eventDays - 1);
  var date = `${dateFormat(startDate)}-${dateFormat(endDate)}`;
  var eventsApiKey = 'CbNBBV9Qm4wTwMpg';
  var radius = .25;
  var eventsApiLink = `http://api.eventful.com/json/events/search?...&location=${req.body.latitude},${req.body.longitude}&within=${radius}&units=miles&date=${date}${eventsFilter(req.body)}${eventsSearch(req.body.eventSearch)}&app_key=${eventsApiKey}`;
  console.log(eventsApiLink);
  return new Promise((resolve, reject) => {
    request(eventsApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var eventObj = [];
        var eventsResults = JSON.parse(body);
        eventsResults.events.event.forEach(function(event) {
          var eventLat = findXDistance(initLat, event.latitude);
          var distanceFromInit = hypotenuseDistance(initLat, initLon, event.latitude, event.longitude);
          var eventDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, event.latitude, event.longitude);
          var eventLon = findYDistance(distanceFromInit, eventLat, initLon, req.body.longitude);
          eventDistance = Math.floor(eventDistance * 3.28084);

          var place = {
          name: event.title,
          lat: eventLat,
          lon: eventLon,
          distance: eventDistance,
          };
          eventObj.push(place);
        });
        console.log(eventObj)
        resolve(res.send(eventObj));
      }
    });

  });
}

function getVenueID(req, res) {
  var flickrApiKey = 'd06a651de2c308348be5326769d1ce47';
  var flickrIdApiLink = `https://api.flickr.com/services/rest/?method=flickr.people.findByUsername&api_key=${flickrApiKey}&username=${req.body.username.join('+')}`;
  return new Promise((resolve, reject) => {
    request(flickrIdApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body);
        getPhotos(req, res, result.user.id);
      }
    });
  });
}

function getPhotos(req, res, userId) {
  var flickrApiKey = 'd06a651de2c308348be5326769d1ce47';
  var flickrGetPhotosLink = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrApiKey}&user_id=${userId}&format=json&nojsoncallback=1`;
  return new Promise((resolve, reject) => {
    request(flickrGetPhotosLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var results = JSON.parse(body);
        var photoLinks = [];
        results.photos.photo.forEach(function(photo) {
          photoLinks.push(`https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`);
        });
      }
      resolve(res.send(photoLinks));
    });
  });
}

module.exports = {
  getPlaces,
  getEvents,
  getVenueID,
};
