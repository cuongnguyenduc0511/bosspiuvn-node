var mongoose = require('mongoose');
var Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId;

var SongSchema = Schema({
  songName: { type: String },
  artist: { type: String },
  seriesGroupCategory: { type: String },
  thumbnailUrl: { type: String }
}, { collection: 'songs' });

var Song = module.exports = mongoose.model('songs', SongSchema);

module.exports.getPaginationData = async (recordPerPage, skip, query) => {
  const result = await Song.aggregate([
    { $sort: { songName: 1 } },
    { $project: { _id: 0, value: "$_id", songName: "$songName", artist: 1, group: '$seriesGroupCategory' } },
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

  return Promise.all(result);
}

module.exports.getVersionCategory = (callback) => {
  Song.distinct("seriesGroupCategory", callback);
}

module.exports.getAllData = (callback) => {
  Song.aggregate([
    { $match: { isAvailable: true } },
    { $project: { _id: 0, value: "$_id", songName: "$songName", artist: 1, group: '$seriesGroupCategory', thumbnailUrl: 1 } }
  ], callback);
}

module.exports.getSongById = async (id) => {
  try {
    const result = await Song.aggregate([
      { $match: { _id: ObjectId(id) } },
      { $project: { _id: 0, value: "$_id", songName: "$songName", artist: 1, group: '$seriesGroupCategory', thumbnailUrl: 1 } }
    ]);
    return Promise.resolve(result[0]);
  } catch (err) {
    Promise.reject(err);
  }
}
