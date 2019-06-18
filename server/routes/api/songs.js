var express = require('express');
var songRouter = express.Router();
const commonController = require('../../controllers/commonController');

songRouter.get('/', (req, res, next) => {
    commonController.getSongs(req, res);
});

songRouter.get('/test', (req, res, next) => {
    commonController.getSongsField(req, res);
});

module.exports = songRouter;
