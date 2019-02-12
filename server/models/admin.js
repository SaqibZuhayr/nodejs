var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var Admin = new Schema({
    name : String,
    password : String,
    disputes : [{
        id : String
    }],
    users : [{
        id : String
    }]
})