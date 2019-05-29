const statusModel = require('../models/status');
const stepchartTypesModel = require('../models/stepchartTypes');
const { STATUS_CODE } = require('../shared/constant');
const songModel = require('../models/song');
const artistModel = require('../models/artists');

module.exports.getStatusData = (req, res) => {
    statusModel.getAllData((err, data) => {
        if(err) {
            res.send(err);
        } else {
            res.status(200).json(data);
        }
    });
};

module.exports.getStepchartTypes = async (req, res) => {
    try {
        const stepchartTypesData = await stepchartTypesModel.getStandardStepchartTypes();
        res.status(STATUS_CODE.SUCCESS).json(stepchartTypesData);
    } catch (err) {
        return res.send(STATUS_CODE.BAD_REQUEST).send({
            message: 'Error while fetching stepchart types'
        })
    }
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

module.exports.getArtists = (req, res) => {
    artistModel.getArtists().then(data => {
        res.status(STATUS_CODE.SUCCESS).send(data);
    }).catch(err => {
        res.status(STATUS_CODE.BAD_REQUEST).send({
            message: 'An error occurred while fetching artists data, please try again later'
        })
    })
};
