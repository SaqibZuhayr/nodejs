var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var question = new Schema({
    question : String,
    user_id : String,
    category : String,
    answer : [{
        answer : String,
        user_id : String,
        rating : {
            approved : Boolean,
            score : String
        }
    }]
})
var Question = mongoose.model('Questions',question);
module.exports={Question}