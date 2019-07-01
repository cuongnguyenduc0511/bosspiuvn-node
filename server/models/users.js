// jshint ignore: start
const { model: Users } = require('../db-schema/user');
const bcrypt = require('bcrypt');
const { SALT_ROUNDS } = require('../shared/constant');
var mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

module.exports.addUser = async (newData) => {
  try {
    const hashPassword = await bcrypt.hash(newData.password, SALT_ROUNDS);
    console.log(hashPassword);
    newData.password = hashPassword;
    var newUser = new Users(newData);
    const result = await newUser.save();
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
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

module.exports.getUserById = async (userId) => {
  try {
    const query = {
      _id: ObjectId(userId)
    }
    const result = await Users.findOne(query);  
    return Promise.resolve(result);
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

// module.exports.getUsers = function (callback) {
//     Users.aggregate([
//         { $project: { _id: 1, nickname: 1 } }
//     ], callback);
// }

module.exports.comparePassword = async function (inputPassword, hash) {
  try {
    const isMatch = bcrypt.compare(inputPassword, hash);
    return Promise.resolve(isMatch);
  } catch (err) {
    return Promise.reject(err);
  }
};