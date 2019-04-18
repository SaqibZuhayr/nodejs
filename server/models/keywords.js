const mongoose = require('mongoose');

const KeywordsSchema = mongoose.Schema({
    keyword : String,
    relatedQuestions : []
});
var Keywords = mongoose.model('Keywords', KeywordsSchema);
module.exports = {Keywords};