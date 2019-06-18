const statusModel = require('../models/status');
const stepchartTypesModel = require('../models/stepchartTypes');
const { STATUS_CODE, STANDARD_STEPCHART_LEVELS, COOP_STEPCHART_TYPES } = require('../shared/constant');
const songModel = require('../models/song');
const artistModel = require('../models/artists');
const { map, assign, omit, forEach, sortBy } = require('lodash');
const seriesData = require('../../public/series.json');

module.exports.getStatusData = (req, res) => {
  statusModel.getAllData((err, data) => {
    if (err) {
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

module.exports.getSongsField = async (req, res) => {
  try {
    const songResult = await songModel.getSongsField();
    
    // let newResult  = map(songResult, function(value) {
    //   const { _id: groupName, items: songItems } = value;
    //   return {
    //     groupName,
    //     items: songItems
    //   }
    // });

    newResult = map(songResult, function(songItem) {
      let seriesObj;
      const { _id: songSeriesGroupName, items } = songItem;
      forEach(seriesData.series, (seriesItem) => {
        const { title: seriesGroupName, order, categoryId } = seriesItem;
        if(seriesGroupName === songSeriesGroupName) {
          seriesObj = {
            order,
            categoryId
          }
          return false;
        }
      });
      return assign({}, seriesObj, { groupName: songSeriesGroupName , items });
    });

    newResult = sortBy(newResult, ['order'])

    res.send(newResult);
  } catch (err) {
    console.log(err);
    res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'Error while fetching songs'
    });
  }
};

module.exports.getSongs = (req, res) => {
  console.log('get songs');
  songModel.getAllData((err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(data);
    }
  });
};

module.exports.getVersionCategory = (req, res) => {
  songModel.getVersionCategory((err, data) => {
    if (err) {
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

module.exports.getCommonData = async (req, res) => {
  try {
    const stepchartTypesData = await stepchartTypesModel.getStandardStepchartTypes();
    res.status(STATUS_CODE.SUCCESS).json({
      stepchartTypes: stepchartTypesData,
      stepchartLevels: {
        standard: STANDARD_STEPCHART_LEVELS,
        coop: COOP_STEPCHART_TYPES
      }
    });
  } catch (err) {
    console.log(err);
    return res.send(STATUS_CODE.BAD_REQUEST).send({
      message: 'Error while fetching data'
    })
  }
}