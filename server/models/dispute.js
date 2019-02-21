var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var Dispute = new Schema({
    type : String,
    for_user_id : String,
    against_user_id :String
})