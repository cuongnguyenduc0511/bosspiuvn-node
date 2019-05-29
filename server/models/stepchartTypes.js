var mongoose = require('mongoose');
const { SORT_TYPE } = require('../shared/constant');
var Schema = mongoose.Schema;

var StepChartTypeSchema = Schema({
    stepchartTypeValue: String,
    stepchartTypeName: String,
    shortTypeName: String,
}, { collection: 'stepchart_types' });

var StepChartType = mongoose.model('stepchart_types', StepChartTypeSchema);

module.exports.getStandardStepchartTypes = async () => {
    try {
        const result = await StepChartType.aggregate([
            { $sort: { order: SORT_TYPE.ASCENDING } },
            { $match: { 'isStandard': true } },
            {$project: { 
                _id: 0, 
                value: '$stepchartTypeValue', 
                title: { $concat: [ "$stepchartTypeName", " (" , "$shortTypeName", ")" ] }, 
                longLabel: "$stepchartTypeName",
                shortLabel: "$shortTypeName" 
            }}
        ]);
        return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

module.exports.getTypeDetails = async (type) => {
    try {
        const result = await StepChartType.aggregate([
            { $sort: { order: SORT_TYPE.ASCENDING } },
            {$project: { 
                _id: 0, 
                value: '$stepchartTypeValue', 
                title: { $concat: [ "$stepchartTypeName", " (" , "$shortTypeName", ")" ] }, 
                longLabel: "$stepchartTypeName",
                shortLabel: "$shortTypeName" 
            }},
            { $match: { 'value': type } }
        ]);
        return Promise.resolve(result[0]);
    } catch (err) {
        return Promise.reject(err);
    }
}

