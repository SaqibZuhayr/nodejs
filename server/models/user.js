var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  first_name:  String,
  last_name: String,
  email:   String,
  contact : String,
  username : String,
  password : String,
  chats :
  [{
        id : String
  }],
  account :{
      currentAmount : String,
      earnings : {
        date : Date,
        client_id : String,
        order_id : String,
      },
      transactions : [
          {
              amount : String,
              date : Date,
              type : String 
          }
      ]
      
      
  },
  orders : [
    {
      gig_id : String,
      title : String,
      description : String,
      amount : String,
      time_limit : String,
      dispute_id : String
    }
],
   gigs : [{
       id : String
   }],
   questions : [{
    id : String
   }],
   answers : [{
       id : String
   }],
   jobs : [{
        title : String,
        category : String,
        details : String,
        applied : [{
            user_id:String
        }]
   }]
})

var User = mongoose.model('Users',User);

// var user = new User({
//     email : "nouman",
//     password : "2323232"
// });
// user.save().then((doc)=>{
//         //return user.generateAuthToken();
// }).then((token)=>{
//         //res.header('x-auth',token).send(user);
// }).catch((e)=>{
//         //res.status(400).send(e);
// })

module.exports={User};