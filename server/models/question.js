var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var Question = new Schema({
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