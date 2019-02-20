var express = require('express');
var requestRouter = express.Router();
const { verifyToken }  = require('../shared/modules/jwtMiddleware');
const requestController = require('../controllers/requestController');

// *** Fetching Items
requestRouter.get('/:id', verifyToken, (req, res, next) => {
    requestController.getItemById(req, res);
});

requestRouter.get('', (req, res, next) => {
    requestController.getRequests(req, res);
});
// *** End Fetching Items

module.exports = requestRouter;
