var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { FETCH_DATA_MODE, REQUEST_STATUS, DB } = require('../shared/constant');
const { assign, omit, merge } = require('lodash');

const dbSchema = new Schema({
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

var UCSRequest = mongoose.model('requests', dbSchema);

const getAggregatedSchema = (fetchSchema) => ([
  {
    $lookup: {
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
    $project: fetchSchema
  }
]);

const viewInfoSchema = {
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
  isActivated: 1,
  status: {
    value: '$status.statusValue',
    label: '$status.statusLabel'
  }
}

const detailsSchema = assign({}, viewInfoSchema, {
  deleteToken: '$deleteRequestToken',
  updateToken: '$updateRequestToken',
  activationToken: 1,
  email: 1,
  expiredDate: 1
});

const paginationSchema = () => {
  let defaultSchema = merge({
    status: {
      clientBadgeStyle: '$status.clientLabelClass'
    }
  }, viewInfoSchema);
  return omit(defaultSchema, ['requesterNote', 'requestDate', 'customNote', 'playedBy', 'ucsLink']);
}

const getSchema = (fetchDataMode) => {
  let aggregatedSchema;
  switch(fetchDataMode) {
    case FETCH_DATA_MODE.VIEW: {
      aggregatedSchema = getAggregatedSchema(viewInfoSchema);
    } break;
    case FETCH_DATA_MODE.DETAILS: {
      aggregatedSchema = getAggregatedSchema(detailsSchema);
    } break;
    case FETCH_DATA_MODE.PAGINATION: {
      let schema = paginationSchema();
      aggregatedSchema = getAggregatedSchema(schema);
    }
  }
  return aggregatedSchema;
}

module.exports = {
  model: UCSRequest,
  getSchema
}