var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongSchema = Schema({
    songName:  { type: String },
    artist:  { type: String },
    seriesGroupCategory: { type: String },
    thumbnailUrl: { type: String }
}, { collection: 'song' });

var Song = module.exports = mongoose.model('song', SongSchema);

module.exports.getPaginationData = async (recordPerPage, skip, query) => {
    const result = await Song.aggregate([
        { $sort: { songName: 1 } },
        { $project: { _id: 0, value: "$_id", songName: "$songName" , artist: 1, group: '$seriesGroupCategory' }},
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

module.exports.getVersionCategory = function(callback) {
    Song.distinct("seriesGroupCategory", callback);
}

module.exports.getAllData = function (callback) {
    Song.aggregate([
        { $match: { isAvailable: true }},
        {$project: { _id: 0, value: "$_id", songName: "$songName" , artist: 1, group: '$seriesGroupCategory', thumbnailUrl: 1 }}
    ], callback);
}
