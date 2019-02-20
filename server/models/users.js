// jshint ignore: start

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
const { SALT_ROUNDS } = require('../shared/constant');

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const UserSchema = new Schema({
    username: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    }
}, { collection: 'users' });


var Users = mongoose.model('users', UserSchema);

module.exports.addUser = function (newData, callback) {
    bcrypt.hash(newData.password, SALT_ROUNDS, function (err, hash) {
        newData.password = hash
        var newUser = new Users(newData);
        newUser.save(callback);
    });
};

module.exports.findUser = async function (userData) {
    const username = userData.username;
    const query = {
        username: username
    }
    
    try {
        const result = await Users.findOne(query);
        return Promise.resolve(result);
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

module.exports.getUserById = function (userId, callback) {
    const query = {
        _id: ObjectId(userId)
    }
    Users.findOne(query, callback);
};

module.exports.getUsers = function (callback) {
    Users.aggregate([
        { $project: { _id: 1, nickname: 1 } }
    ], callback);
}

module.exports.comparePassword = async function (inputPassword, hash) {
    try {
        const isMatch = bcrypt.compare(inputPassword, hash);
        return Promise.resolve(isMatch);
    } catch (err) {
        return Promise.reject(err);
    }
};