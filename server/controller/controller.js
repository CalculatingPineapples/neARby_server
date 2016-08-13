var request = require('request');
var initLon = null;
var initLat = null;
var stubHubID = 'B9FE35EDF2A34297E0440021286899D6';
var stubHubToken = '1b466ec5b866af29fc90e73b3a907561';
var stubHubRefreshToken = 'a260ebe6f55a8736d842c08aa82a9e6'

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

function getPlaces(req, res) {
  // check to see if it is the initial location
  if (req.body.threejsLat === 0 && req.body.threejsLon === 0) {
    initLat = req.body.latitude;
    initLon = req.body.longitude;
  }
  var googleType = '';
  var googleKeyword = '';
  var googleOpenNow = '';
  if (req.body.type !== undefined) {
    googleType = `&type=${req.body.type}`;
  }
  if (req.body.keyword !== undefined) {
    googleKeyword = `&keyword=${req.body.keyword}`;
  }
  if (req.body.openNow !== undefined) {
    googleOpenNow = '&opennow';
  }
  // call to google API to get locations around
  var radius = 1000;
  var googleApiKey = 'AIzaSyDXk9vLjijFncKwQ-EeTW0tyiKpn7RRABU';
  var googleApiLink = `https://maps.googleapis.com/maps/api/place/search/json?location=${req.body.latitude},${req.body.longitude}&radius=${radius}${googleKeyword}${googleOpenNow}${googleType}&key=${googleApiKey}`;
  return new Promise((resolve, reject) => {
    request(googleApiLink, function(error, response, body) {
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
        resolve(res.send(placesObj));
      }
    });
  });
}

function fbGetVenues (req, res) {

  https://graph.facebook.com/v2.7/search?center=37.783537,-122.409003&distance=1000&fields=id&limit=1000&type=place
  var eventRadius = 1000;
  var fbVenuesApiLink = `https://graph.facebook.com/v2.7/search?center=${req.body.latitude},${req.body.longitude}&distance=${eventRadius}&fields=id&limit=1000&type=place&access_token=${req.body.fbApiKey}`;
  return new Promise((resolve, reject) => {
    request(fbVenuesApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var fbVenuesObj = [];
        var fbResults = JSON.parse(body);
        fbResults.data.forEach(function(result) {
          fbVenuesObj.push(result.id);
        });
        resolve(fbGetEvents(res, res, fbVenuesObj));
      }
    });
  });
}

function flikrGetPlace (req, res) {
  var flickrApiKey = 'test';
  var flickrApiLink = `https://api.flickr.com/services/rest/?method=flickr.people.findByUsername&api_key=${flickrApiKey}&username=${req.body.place}&format=rest`;
  return new Promise((resolve, reject) => {
    request(flickrApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var userId = JSON.parse(body);
        resolve(flickrGetPhotos(res, res, userId.user.id, flickrApiKey));
      }
    });
  });
}


function fbGetEvents (req, res, venuesObj) {
  var fbEventApiLink = `https://graph.facebook.com/v2.5/?ids=${venuesObj.join(',')}&fields=id,name,cover.fields(id,source),picture.type(large),location,events.fields(id,name,cover.fields(id,source),picture.type(large),description,start_time,attending_count,declined_count,maybe_count,noreply_count).since(${fbEventStart})${fbEventEnd}access_token=${req.body.fbApiKey}`;
  var fbEventStart = (new Date(req.body.start_time).getTime() / 1000).toFixed();
  var fbEventEnd = '';
  if (req.body.end_time !== undefined) {
    fbEventEnd = `.until(${(new Date().getTime(req.body.end_time) / 1000).toFixed()}`;
  }
  return new Promise((resolve, reject) => {
    request(fbEventApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var fbEvents = [];
        var fbResults = JSON.parse(body);
        fbResults.data.forEach(function(result) {
          if (result.events !== undefined) {

            var fbLat = findXDistance(initLat, result.geometry.location.lat);
            var distanceFromInit = hypotenuseDistance(initLat, initLon, result.geometry.location.lat, result.geometry.location.lng);
            var fbDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, result.geometry.location.lat, result.geometry.location.lng);
            var fbLon = findYDistance(distanceFromInit, fbLat, initLon, req.body.longitude);
            fbDistance = Math.floor(fbDistance * 3.28084);

            var eventPlace = {
            venueName: result.name,
            eventName: result.events.data.name,
            eventTime: result.events.data.start_Time,
            lat: fbLat,
            lon: fbLon,
            distance: fbDistance,
            img: result.icon,

            };

            fbEvents.push(eventPlace);
          }
        });
        resolve(res(fbEvents));
      }
    });
  });
}


function flickrGetPhotos(req, res, userId, apiKey) {
  var flickrApiLink = `https://api.flickr.com/services/rest/?method=flickr.people.getPhotosOf&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1`;
  return new Promise((resolve, reject) => {
    request(flickrApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var photoArr = [];
        body.photos.photo.forEach(function(photo) {
          var url = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg`;
          photoArr.push(url);
        });
      }
    resolve(res.send(photoArr));
    });
  });
}


module.exports = {
  getPlaces,
  fbGetVenues,
  flikrGetPlace,
};
