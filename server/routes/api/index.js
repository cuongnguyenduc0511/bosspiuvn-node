const _fs = require('fs');
var express = require('express');
var apiRouter = express.Router();
const commonController = require('../../controllers/commonController'); 

const apiRouteDirectory = './server/routes/api/'
_fs.readdirSync(apiRouteDirectory).forEach(async file => {
    const path = file.split('.js')[0];
    if (path !== 'index') {
        const routerInstance = await require(`../api/${path}`)
        await apiRouter.use(`/${path}`, routerInstance);    
    }
});

apiRouter.get('/status', (req, res, next) => {
    commonController.getStatusData(req, res);
});

apiRouter.get('/stepchart-types', (req, res, next) => {
    commonController.getStepchartTypes(req, res);
});

apiRouter.get('/version-categories', (req, res, next) => {
    commonController.getVersionCategory(req, res);
});

apiRouter.get('/song-artists', (req, res, next) => {
    commonController.getArtists(req, res);
});

module.exports = apiRouter;
