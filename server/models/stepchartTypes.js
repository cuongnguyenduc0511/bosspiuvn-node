var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StepChartTypeSchema = Schema({
    stepchartTypeValue: String,
    stepchartTypeName: String,
    shortTypeName: String,
}, { collection: 'stepchart_type' });

var StepChartType = module.exports = mongoose.model('stepchart_type', StepChartTypeSchema);

module.exports.getAllData = function(callback) {
    StepChartType.aggregate([
        {$project: { 
            _id: 0, 
            value: '$stepchartTypeValue', 
            title: { $concat: [ "$stepchartTypeName", " (" , "$shortTypeName", ")" ] }, 
            longLabel: "$stepchartTypeName",
            shortLabel: "$shortTypeName" 
        }}
    ], callback);
}
