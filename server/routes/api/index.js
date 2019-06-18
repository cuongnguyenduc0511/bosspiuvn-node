const _fs = require('fs');
const express = require('express');
const apiRouter = express.Router();
const commonController = require('../../controllers/commonController'); 
const { isEmpty } = require('lodash');

const apiRouteDirectory = './server/routes/api/'
_fs.readdirSync(apiRouteDirectory).forEach(async file => {
    const path = file.split('.js')[0];
    const routerInstance = await require(`../api/${path}`);
    if (path !== 'index' && !isEmpty(routerInstance)) {
        await apiRouter.use(`/${path}`, routerInstance); 
    }
});

apiRouter.get('/version-categories', (req, res, next) => {
    commonController.getVersionCategory(req, res);
});

apiRouter.get('/song-artists', (req, res, next) => {
    commonController.getArtists(req, res);
});

apiRouter.get('/commons', (req, res) => {
    commonController.getCommonData(req, res);
})

module.exports = apiRouter;
