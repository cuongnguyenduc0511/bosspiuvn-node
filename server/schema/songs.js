var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const modelName = 'songs';

const SongSchema = Schema({
    songName: {
        intl: { type: String, required: true },
        kr: { type: String }
    },
    artist: { type: Schema.Types.Array, required: true },
    series: { type: String, required: true },
    version: { type: String, required: true },
    category: {
        type: Schema.Types.String,
        required: true
    },
    type: {
        type: Schema.Types.String,
        required: true
    },
    isUCS: {
        type: Boolean,
        required: true
    }
}, { collection: modelName });

var SongModel = mongoose.model(modelName, SongSchema);

module.exports = {
    SongModel
}
