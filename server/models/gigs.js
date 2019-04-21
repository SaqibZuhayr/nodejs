var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/aAndf');
var Schema = mongoose.Schema;

var gigs = new Schema({
    userid : String,
    username : String,
    title : String,
    description : String,
    photo : String,
    rate : String,
    reviews : [{
        order_id : String,
        client_id : String,
        reviews_rating : Number,
        comment : String
    }]

})

let Gigs = mongoose.model('Gigs',gigs);

module.exports={Gigs};