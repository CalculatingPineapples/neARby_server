var router = require('express').Router();
var controller = require('./controller/controller');
// var dbController = require('./controller/dbController');

router.post('/location', controller.getPlaces);
router.post('/places', controller.getPlaces);
router.post('/events', controller.getEvents);
// router.post('/create/places', dbController.createPlace);

module.exports = router;