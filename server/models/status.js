var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatusSchema = Schema({
	statusValue: String,
	statusLabel: String
}, { collection: 'status' });

var Status = module.exports = mongoose.model('status', StatusSchema);

module.exports.getAllData = function (callback) {
	Status.aggregate([
		{
			$project: {
				_id: 0,
				value: "$statusValue",
				label: "$statusLabel"
			}
		},
	], callback);
};
