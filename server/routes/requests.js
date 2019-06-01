var express = require('express');
var requestRouter = express.Router();
const { updateStatusMiddleware } = require('../middleware/middleware');
const { verifyToken }  = require('../shared/modules/jwtMiddleware');
const requestController = require('../controllers/requestController');

// *** Update Status Route
requestRouter.put('/:id/status', updateStatusMiddleware, (req, res) => {
    requestController.updateRequestStatus(req, res);
});

// *** Fetching Items
// requestRouter.get('/:id', verifyToken, (req, res, next) => {
//     requestController.getItemById(req, res);
// });

requestRouter.get('', (req, res, next) => {
    requestController.getRequests(req, res);
});
// *** End Fetching Items

module.exports = requestRouter;
