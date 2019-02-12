var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var Gigs = new Schema({
    title : String,
    description : String,
    photos : [{
        picture_path : String
    }],
    rate : String,
    reviews : [{
        order_id : String,
        user_id : String,
        client_id : String,
        reviews_rating : String,
        comment : String
    }]

})