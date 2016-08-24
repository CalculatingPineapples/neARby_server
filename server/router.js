var router = require('express').Router();
var controller = require('./controller/controller');
var dbController = require('./controller/dbController');

router.post('/location', controller.getPlaces);
router.post('/places', controller.getPlaces);
router.post('/events', controller.getEvents);
router.post('/images', controller.getPhotos);
router.post('/directions', controller.getDirections);
// router.post('/db/createPlace', dbController.createPlace);
// router.post('/db/getPlaces', dbController.getPlace);
// router.post('/db/createEvent', dbController.createPlace);
// router.post('/db/getEvents', dbController.createPlace);
// router.post('/db/votePlaces', dbController.votePlaces);
// router.post('/db/voteEvents', dbController.voteEvents);

module.exports = router;
