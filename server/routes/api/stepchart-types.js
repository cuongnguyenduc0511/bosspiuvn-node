const express = require('express');
const stepchartTypeRouter = express.Router();
const commonController = require('../../controllers/commonController'); 

stepchartTypeRouter.get('/', (req, res) => {
    commonController.getStepchartTypes(req, res);
});

module.exports = stepchartTypeRouter;
