var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var question = new Schema({
    question : String,
    user_id : String,
    askedBy : String,
    category : String,
    keywords : [String],
    answer : [{
        answer : String,
        user_id : String,
        answeredBy: String,
        approved : Boolean,
        rating :[ {
            ratedBy : String,
            ratedAs : String
        }]
    }]
})
var Question = mongoose.model('Questions',question);
module.exports={Question}