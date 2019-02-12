var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var Chat_Records = new Schema({
    user1_id : String,
    user2_id : String,
    messages : [{
        sender : String,
        Receiver : String,
        message : String,
        date : Date
    }]
})