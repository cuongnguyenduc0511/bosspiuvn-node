const statusModel = require('../models/status');
const stepchartTypesModel = require('../models/stepchartTypes');
const songModel = require('../models/song');

module.exports.getStatusData = (req, res) => {
    statusModel.getAllData((err, data) => {
        if(err) {
            res.send(err);
        } else {
            res.status(200).json(data);
        }
    });
};

module.exports.getStepchartTypes = (req, res) => {
    stepchartTypesModel.getAllData((err, data) => {
        if(err) {
            res.send(err);
        } else {
            res.status(200).json(data);
        }
    });
};

module.exports.getSongs = (req, res) => {
    console.log('get songs');
    songModel.getAllData((err, data) => {
        if(err) {
            res.send(err);
        } else {
            res.status(200).json(data);
        }
    });
};

module.exports.getVersionCategory = (req, res) => {
    songModel.getVersionCategory((err, data) => {
        if(err) {
            res.send(err);
        } else {
            res.status(200).json(data);
        }
    });
};