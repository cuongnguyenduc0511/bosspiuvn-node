const { model: requestModel, getSchema } = require('../db-schema/request');
const { FETCH_DATA_MODE, UPDATE_MODE, SORT_TYPE } = require('../shared/constant');
const { find, concat, assign, isEmpty } = require('lodash');
const { decodeAndSanitizeObject } = require('../shared/modules/sanitize');
const { escapeRegExp } = require('../shared/modules/escapeReg');

let requestSession = null

module.exports.startSession = async () => {
  requestSession = await requestModel.startSession();
  return requestSession;
}

module.exports.getItemById = async (requestId, showDetails = false) => {
  try {
    let fetchMode = showDetails ? FETCH_DATA_MODE.DETAILS : FETCH_DATA_MODE.VIEW;
    const schema = getSchema(fetchMode);
    schema.push({ $match: { requestId } });
    const result = await requestModel.aggregate(schema).session(requestSession);
    return Promise.resolve(result[0]);
  } catch (err) {
    console.log('get error');
    console.log(err);
    return Promise.reject(err);
  }
}

module.exports.addData = async (newData) => {
  try {
    const result = await Promise.resolve(requestModel.create([newData], { session: requestSession }).
      then(() => {
        const schema = getSchema(FETCH_DATA_MODE.DETAILS);
        return requestModel.aggregate(schema).session(requestSession);
      }).then(res => {
        return find(res, { 'requestId': newData.requestId });
      })
    );
    return Promise.resolve(result);
  } catch (err) {
    console.log('add request error');
    console.log(err);
    return Promise.reject(err);
  }
};

module.exports.updateRequestByID = async (requestId, updateObj) => {
  var opts = { runValidators: true, context: 'query', session: requestSession };
  try {
    const result = await Promise.resolve(requestModel.findOneAndUpdate({ "requestId": requestId }, updateObj, opts).then(() => {
      const schema = getSchema(FETCH_DATA_MODE.DETAILS);
      schema.push({ $match: { requestId } });
      return requestModel.aggregate(schema).session(requestSession);
    }).then(data => {
      return data[0]
    }));
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.deleteRequestByID = async (requestId) => {
  try {
    const result = await requestModel.deleteOne({ "requestId": requestId }).session(requestSession);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.removeToken = async (requestId, mode) => {
  let removeToken;
  var opts = {session: requestSession};
  switch (mode) {
    case UPDATE_MODE.UPDATE: removeToken = { $unset: { updateRequestToken: 1 } }; break;
    case UPDATE_MODE.DELETE: removeToken = { $unset: { deleteRequestToken: 1 } }; break;
  }

  await requestModel.findOneAndUpdate({ "requestId": requestId }, removeToken, opts);
}

module.exports.getPaginationData = async (recordPerPage, skip, query) => {
  try {
    const schema = getSchema(FETCH_DATA_MODE.PAGINATION);
    const concatSchema = concat([{ $sort: { 'requestDate': SORT_TYPE.DESCENDING } }], schema, [
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
      { $project: { items: 1, totalItems: "$pageInfo.totalItems" } }
    ])
    const result = await requestModel.aggregate(concatSchema);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.countAllItems = async () => {
  const result = await requestModel.countDocuments({});
  return Promise.resolve(result);
}

module.exports.searchQuery = req => {
  let query = {};
  const { search, stepchart_type, stepchart_level, status } = req.query;
  const params = {
    search,
    stepchart_type,
    stepchart_level,
    status
  }

  decodeAndSanitizeObject(params);

  if (search) {
    const searchValue = escapeRegExp(params.search);
    console.log(searchValue)
    assign(query, {
      $or: [{ "stepmaker": { $regex: searchValue, $options: 'gi' } }, { "requester": { $regex: searchValue, $options: 'gi' } }, { "contentName": { $regex: searchValue, $options: 'gi' } }, { 'song.name': { $regex: new RegExp(searchValue), $options: 'imsx' } }]
    });
  }


  if (!isEmpty(params.stepchart_type)) {
    assign(query, {
      "stepchartInfo.stepchartType.value": params.stepchart_type
    });
  }

  if (!isEmpty(params.stepchart_level)) {
    assign(query, {
      "stepchartInfo.stepchartLevel": params.stepchart_level
    });
  }

  return query;
}
