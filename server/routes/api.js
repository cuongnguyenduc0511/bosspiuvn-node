var express = require('express');
var router = express.Router();
var path = require('path');
const { apiRoutes } = require('../routes/api-index');
const commonController = require('../controllers/commonController');

var apiRouters = apiRoutes.map(item => {
    return { path: `/${item}`, routerInstance: require('../routes/' + item) }
})

for(let i = 0; i < apiRouters.length; i++) {
    const { path, routerInstance } = apiRouters[i];
    router.use(path, routerInstance)
}

router.get('/status', (req, res, next) => {
    commonController.getStatusData(req, res);
});

router.get('/stepchart-types', (req, res, next) => {
    commonController.getStepchartTypes(req, res);
});

router.get('/version-categories', (req, res, next) => {
    commonController.getVersionCategory(req, res);
});

router.get('/song-artists', (req, res, next) => {
    commonController.getArtists(req, res);
});

module.exports = router;