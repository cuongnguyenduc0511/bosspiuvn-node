// jshint ignore: start

var mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ArtistSchema = new Schema({
    intl: {
        type: String,
        trim: true,
        required: true
    },
    kr: {
        type: String,
        trim: true,
    }
}, { collection: 'song_artists' });


var Artists = mongoose.model('song_artists', ArtistSchema);

module.exports.getArtists = async function () {
    try {
        const result = Artists.aggregate([
            { $project: { _id: 1, name: '$intl' } }
        ]);
        return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}