var express = require('express');
var router = express.Router();

const { verifyToken } = require('../shared/modules/jwtMiddleware');
const userController = require('../controllers/userController');
const accessTokenController = require('../controllers/accessTokenController');

router.post('/login', (req, res, next) => {
    userController.authenticate(req, res);
});

router.get('/user', verifyToken, (req, res, next) => {
    userController.getUserInfo(req, res);
});

router.get('/logout', verifyToken, (req, res, next) => {
    accessTokenController.setRevoked(req, res, next);
});

router.post('/user/create', (req, res, next) => {
    userController.addUser(req, res, next);
});

module.exports = router;