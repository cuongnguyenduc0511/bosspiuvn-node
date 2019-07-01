var mongoose = require('mongoose');

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
    nickName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        require: true,
        default: 'USER'
    },
    createdAt: {
        type: Date,
        required: true
    },
    isLocked: {
        type: Boolean,
        required: true,
        default: false
    }
}, { collection: 'users' });


var Users = mongoose.model('users', UserSchema);

module.exports = {
    model: Users
}