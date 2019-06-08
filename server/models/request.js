// jshint ignore: start

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { DB, SORT_TYPE, REQUEST_STATUS, STATUS_CODE, UPDATE_MODE } = require('../shared/constant');
const sanitize = require('../shared/modules/sanitize');
const { escapeRegExp } = require('../shared/modules/escapeReg');

const RequestSchema = new Schema({
  requestId: { type: String, required: true },
  song: { type: Schema.Types.ObjectId, required: true },
  contentName: String,
  requester: { type: String, required: true },
  stepmaker: { type: String, required: true },
  stepchartInfo: {
    stepchartType: {
      type: String,
      required: true
    },
    stepchartLevel: {
      type: String,
      required: true
    }
  },
  ucsLink: {
    type: String,
    validate: {
      validator: function (value) {
        return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
      },
      message: props => `${props.path} is not valid`
    },
    required: true
  },
  note: {
    requesterNote: { type: String },
    customNote: { type: String, default: '' }
  },
  email: {
    type: String,
    validate: {
      validator: function (value) {
        return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(value);
      },
      message: props => `${props.path} is not valid`
    },
    required: true
  },
  lastUpdatedDate: { type: Date },
  requestDate: { type: Date, default: Date.now },
  expiredDate: { type: Date },
  status: {
    type: String,
    required: true,
    default: REQUEST_STATUS.ACTIVATION_PENDING
  },
  playedBy: Schema.Types.Mixed,
  activationToken: {
    token: { type: String },
    exp: { type: Date }
  },
  updateRequestToken: {
    token: { type: String },
    exp: { type: Date }
  },
  deleteRequestToken: {
    token: { type: String },
    exp: { type: Date }
  },
  publishedVideoUrl: String,
  isActivated: { type: Boolean, default: false },
  isSpecial: { type: Boolean, default: false },
  isOldRequest: { type: Boolean, default: false }
}, { collection: 'requests' });

var UCSRequest = mongoose.model('requests', RequestSchema);

let session = null

module.exports.getSession = async () => {
  session = await UCSRequest.startSession();
  return session;
}

module.exports.addData = async (newData) => {
  try {
    const result = await UCSRequest.create([newData], { session: session });
    return Promise.resolve(result[0]);
  } catch (err) {
    const { name, _message, message } = err;
    const errorObj = {
      status: STATUS_CODE.BAD_REQUEST,
      error: {
        message: _message,
        name,
        fullMessage: message
      }
    }
    return Promise.reject(errorObj);
  }
};

module.exports.getItemByIdAsync = async id => {
  try {
    const result = await UCSRequest.aggregate([
      {
        $lookup:
        {
          from: DB.STEPCHART_TYPE,
          localField: 'stepchartInfo.stepchartType',
          foreignField: 'stepchartTypeValue',
          as: 'stepchartInfo.stepchartType'
        },
      },
      {
        $lookup:
        {
          from: DB.STATUS,
          localField: "status",
          foreignField: "statusValue",
          as: "status"
        }
      },
      {
        $lookup:
        {
          from: DB.SONG,
          localField: "song",
          foreignField: "_id",
          as: "songInfo"
        }
      },
      { $unwind: '$stepchartInfo.stepchartType' },
      { $unwind: '$songInfo' },
      { $unwind: '$status' },
      {
        $project: {
          _id: 0,
          requestId: 1,
          song: {
            value: "$songInfo._id",
            name: "$songInfo.songName",
            artist: '$songInfo.artist',
            group: '$songInfo.seriesGroupCategory',
            thumbnailUrl: "$songInfo.thumbnailUrl"
          },
          stepchartInfo: {
            stepchartType: {
              value: '$stepchartInfo.stepchartType.stepchartTypeValue',
              shortLabel: '$stepchartInfo.stepchartType.shortTypeName',
              longLabel: '$stepchartInfo.stepchartType.stepchartTypeName'
            },
            stepchartLevel: 1
          },
          contentName: 1,
          stepmaker: 1,
          requestDate: 1,
          ucsLink: 1,
          requesterNote: '$note.requesterNote',
          customNote: '$note.customNote',
          playedBy: 1,
          requester: 1,
          deleteToken: '$deleteRequestToken',
          updateToken: '$updateRequestToken',
          activationToken: 1,
          isActivated: 1,
          email: 1, // Sensitive Data
          status: {
            value: '$status.statusValue',
            label: '$status.statusLabel'
          },
          isOldRequest: 1
        }
      },
      { $match: { requestId: id } }
    ]);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.resolve(err);
  }
}

module.exports.getPaginationData = async (recordPerPage, skip, query) => {
  try {
    const result = await UCSRequest.aggregate([
      { $sort: { 'requestDate': SORT_TYPE.DESCENDING } },
      {
        $lookup:
        {
          from: DB.STEPCHART_TYPE,
          localField: 'stepchartInfo.stepchartType',
          foreignField: 'stepchartTypeValue',
          as: 'stepchartInfo.stepchartType'
        },
      },
      {
        $lookup:
        {
          from: DB.STATUS,
          localField: "status",
          foreignField: "statusValue",
          as: "status"
        }
      },
      {
        $lookup:
        {
          from: DB.SONG,
          localField: "song",
          foreignField: "_id",
          as: "songInfo"
        }
      },
      { $unwind: '$stepchartInfo.stepchartType' },
      { $unwind: '$songInfo' },
      { $unwind: '$status' },
      {
        $project: {
          _id: 0,
          requestId: 1,
          song: {
            name: "$songInfo.songName",
            artist: '$songInfo.artist',
            group: '$songInfo.seriesGroupCategory',
            thumbnailUrl: "$songInfo.thumbnailUrl"
          },
          stepchartInfo: {
            stepchartType: {
              value: '$stepchartInfo.stepchartType.stepchartTypeValue',
              shortLabel: '$stepchartInfo.stepchartType.shortTypeName',
              longLabel: '$stepchartInfo.stepchartType.stepchartTypeName'
            },
            stepchartLevel: 1
          },
          contentName: 1,
          requester: 1,
          stepmaker: 1,
          status: {
            value: '$status.statusValue',
            label: '$status.statusLabel',
            clientBadgeStyle: '$status.clientLabelClass'
          },
          isOldRequest: 1
        }
      },
      { $match: query },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: recordPerPage },
          ],
          pageInfo: [
            { $count: "totalItems" }
          ],
        }
      },
      { $unwind: "$pageInfo" },
      { $project: { items: 1, totalItems: "$pageInfo.totalItems" } },
    ]);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.countAllItems = async () => {
  const result = await UCSRequest.countDocuments({});
  return Promise.resolve(result);
}

module.exports.updateRequestByID = async (requestId, updateData) => {
  var opts = { runValidators: true, context: 'query', session: session };
  try {
    const result = await UCSRequest.findOneAndUpdate({ "requestId": requestId }, { $set: updateData }, opts);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.updateRequestByIDPrototype = async (requestId, updateData) => {
  var opts = { runValidators: true, context: 'query', session: session };
  try {
    const result = await Promise.resolve(UCSRequest.findOneAndUpdate({ "requestId": requestId }, { $set: updateData }, opts).then(() => UCSRequest.aggregate([
      {
        $lookup:
        {
          from: DB.STEPCHART_TYPE,
          localField: 'stepchartInfo.stepchartType',
          foreignField: 'stepchartTypeValue',
          as: 'stepchartInfo.stepchartType'
        },
      },
      {
        $lookup:
        {
          from: DB.STATUS,
          localField: "status",
          foreignField: "statusValue",
          as: "status"
        }
      },
      {
        $lookup:
        {
          from: DB.SONG,
          localField: "song",
          foreignField: "_id",
          as: "songInfo"
        }
      },
      { $unwind: '$stepchartInfo.stepchartType' },
      { $unwind: '$songInfo' },
      { $unwind: '$status' },
      {
        $project: {
          _id: 0,
          requestId: 1,
          song: {
            value: "$songInfo._id",
            name: "$songInfo.songName",
            artist: '$songInfo.artist',
            group: '$songInfo.seriesGroupCategory',
            thumbnailUrl: "$songInfo.thumbnailUrl"
          },
          stepchartInfo: {
            stepchartType: {
              value: '$stepchartInfo.stepchartType.stepchartTypeValue',
              shortLabel: '$stepchartInfo.stepchartType.shortTypeName',
              longLabel: '$stepchartInfo.stepchartType.stepchartTypeName'
            },
            stepchartLevel: 1
          },
          contentName: 1,
          stepmaker: 1,
          requestDate: 1,
          ucsLink: 1,
          requesterNote: '$note.requesterNote',
          customNote: '$note.customNote',
          playedBy: 1,
          requester: 1,
          deleteToken: '$deleteRequestToken',
          updateToken: '$updateRequestToken',
          activationToken: 1,
          isActivated: 1,
          publishedVideoUrl: 1,
          email: 1, // Sensitive Data
          status: {
            value: '$status.statusValue',
            label: '$status.statusLabel'
          },
          isOldRequest: 1
        }
      },
      { $match: { requestId } }
    ]).session(session))).then(data => {
      return data[0]
    })
    // console.log('Prototype Update');
    // console.log(result);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.removeFields = async (requestId, removeFields) => {
  try {
    var opts = { session: session };
    const result = await UCSRequest.findOneAndUpdate({ "requestId": requestId }, { $unset: removeFields }, opts);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.removeToken = async (requestId, mode) => {
  let removeToken;
  switch (mode) {
    case UPDATE_MODE.UPDATE: removeToken = { $unset: { updateRequestToken: 1 } }; break;
    case UPDATE_MODE.DELETE: removeToken = { $unset: { deleteRequestToken: 1 } }; break;
  }

  await UCSRequest.findOneAndUpdate({ "requestId": requestId }, removeToken);
}

module.exports.activateRequest = async (requestId) => {
  var opts = { runValidators: true, context: 'query' };
  try {
    const result = UCSRequest.findOneAndUpdate({ "requestId": requestId }, { $set: { isActivated: true, status: REQUEST_STATUS.PENDING }, $unset: { activationToken: 1 } }, opts);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.deleteRequest = async requestId => {
  try {
    const result = await UCSRequest.deleteOne({ "requestId": requestId });
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.searchQuery = req => {
  let query = {};
  const { decodeAndSanitizeValue } = sanitize;
  const { search, stepchart_type, stepchart_level, status } = req.query;

  if (search) {
    let searchValue = decodeAndSanitizeValue(search);
    searchValue = escapeRegExp(search);

    Object.assign(query, {
      $or: [{ "stepmaker": { $regex: searchValue, $options: 'gi' } }, { "requester": { $regex: searchValue, $options: 'gi' } }, { "contentName": { $regex: searchValue, $options: 'gi' } }, { 'song.name': { $regex: new RegExp(searchValue), $options: 'imsx' } }]
    });
  }

  if (stepchart_type) {
    Object.assign(query, {
      "stepchartInfo.stepchartType.value": decodeAndSanitizeValue(stepchart_type)
    });
  }

  if (stepchart_level) {
    Object.assign(query, {
      "stepchartInfo.stepchartLevel": decodeAndSanitizeValue(stepchart_level)
    });
  }

  if (status) {
    Object.assign(query, {
      "status.value": decodeAndSanitizeValue(status)
    });
  }

  return query;
}
