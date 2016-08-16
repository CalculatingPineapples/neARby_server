var router = require('express').Router();
var controller = require('./controller/controller');

router.post('/location', controller.getPlaces);
// router.post('/places', controller.getPlaces);
// router.post('/events', controller.getEvents);

module.exports = router;
