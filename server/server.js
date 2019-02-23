var express = require('Express');
var bodyParser = require('body-parser');
const multer = require("multer");

var { mongoose } = require('./db/mongoose');
var { User } = require('./models/user');
var { Question } = require('./models/question');
let { Gigs } = require('./models/gigs')

const upload = multer({dest: "images/"});

const MIME_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg"
  };
  
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isValid = MIME_TYPE_MAP[file.mimetype];
      let error = new Error("Invalid mime type");
      if (isValid) {
        error = null;
      }
      cb(error, "images");
    },
    filename: (req, file, cb) => {
      const name = file.originalname
        .toLowerCase()
        .split(" ")
        .join("-");
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, name + "-" + Date.now() + "." + ext);
    }
  });

var app = express();

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

//angular (public) files
//app.use(express.static(__dirname + '/../public')); 


//method for addtion of contact
app.post('/user', (req, res) => {
    //mongoose object instance
    var user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
    });
    //saving contact to db
    user.save().then((doc) => {
        //returning new object to user
        res.status(200).send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for deleting contact
// app.post('/delete',(req,res)=>{
//     //mongoose method for deleting object from db
//     Contact.findByIdAndRemove(req.body.id).then((doc)=>{
//         //returning deleted object to user
//         res.send(doc);
// },(err)=>{
//     res.status(400).send(err);
// })
// });
//User login authentication
app.post('/user/auth', (req, res) => {
    //mongoose method for deleting object from db
    //console.log(req.body.email);
    console.log(req.body.password);
    console.log(req.body.email);
    User.find({ "email": req.body.email, "password": req.body.password }).then((doc) => {
        console.log(doc);
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});
//method for fetching questions
app.post('/questions', (req, res) => {

    console.log('asdasd')
    let arr = [];
    Question.find({}).then((doc) => {

        doc.forEach(element => {
            console.log(element);
            User.findOne({_id: element.user_id }).then((user) => {
                arr.push({ question: element, user: { 'username': user.username } });
                if (doc.length == arr.length) {
                    res.send(arr);
                }
            }), (err) => {
                res.status(400).send(err);
            }
        })

    }, (err) => {
        res.status(400).send(err);
    })
});
//method for fetching answers
app.post('/answers', (req, res) => {
    let arr = [];
    //console.log('asdasd')
    //console.log(req.body.questionID);
    Question.find({ '_id': req.body.questionID }).then((doc) => {
        console.log(doc);
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for posting question
app.post('/postquestion', (req, res) => {
   console.log(req.body.userid);
    //console.log('asdasd')
    //console.log(req.body.questionID);
    var question = new Question({
        question: req.body.question,
        user_id: req.body.userid,
        category: req.body.category

    });
    //saving contact to db
    question.save().then((doc) => {
        //returning new object to user
        res.status(200).send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for posting answers
app.post('/postanswer', (req, res) => {

    //console.log('asdasd')
    //console.log(req.body.questionID);
    //saving answer to db
    const answer = {
        answer : req.body.answer,
        user_id : req.body.userid, 
    }
    Question.findOne(
        {_id: req.body.questionID }
    ).then((doc) => {
        console.log(doc);
        doc.answer.push(answer);
        doc.save((err) => {
            if(err){
                res.status(400).send(err);
            }
            else{
                console.log("saved");
            }

        });
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for fetching Jobs
app.post('/viewjobs', (req, res) => {
    let arr=[];
    User.find({}).then((doc) => {
        doc.forEach(element => {
            element.jobs.forEach(element1 => {
                arr.push(element1)
            });

        });
        res.send(arr);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for posting jobs
app.post('/postjobs', (req, res) => {
    console.log(req.body.userid);
    User.findOne(
        {_id: req.body.userid }
    ).then((doc) => {
        console.log(doc);
        doc.jobs.push(req.body.job);
        doc.save((err) => {
            if(err){
                res.status(400).send(err);
            }
            else{
                console.log("saved");
            }

        });
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
});
//methid for fetching job details
app.post('/jobdetails', (req, res) => {
    let arr = {};
    User.find({}).then((doc) => {
        doc.forEach(element => {
            element.jobs.forEach(element1 => {
                if(element1._id == req.body.jobID){
                    res.send(element1);
                }
                    
                
            });

        });
    }, (err) => {
        res.status(400).send(err);
    })
});
//method for fetching users
app.post('/fetchusers',(req, res) => {
    User.find({}).then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
 });
 //method for deleting user
 app.post('/deleteuser',(req, res) => {
    //  console.log(req.body.id)
    User.find({'_id':req.body.id}).remove().then((doc) => {
        Question.find({'user_id':req.body.id}).remove().then((doc1)=>{
            
        })
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
 });
 //method for deleting question
 app.post('/deletequestion',(req, res) => {
    //  console.log(req.body.id)
    Question.find({'_id':req.body.id}).remove().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
 });
 //method for admin dashboard
 app.post('/adminDashboard',(req, res) => {
    //  console.log(req.body.id)
    countanswer = 0;
    countquestion = 0;
    countuser =0;
    User.countDocuments({}).then((doc) => {
        countuser = doc;
        Question.find({}).then((doc1)=>{
            countquestion=doc1.length;
            doc1.forEach((element ,index)=> {
                console.log(' ================ ', element.answer.length);
                countanswer+=Number(element.answer.length);
                if(doc1.length==index+1){
                    res.send({
                        countanswer,
                        countquestion,
                        countuser
                    });
                }

            });
        })
       // console.log(countuser);
       // res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
 }); 


//method for adding gigs
app.post('/addgig', upload.single('image'), (req, res) => {
     //console.log(req.body);
    var gigs = new Gigs({
        userid : req.body.userid,
        title : req.body.gig.gig_title,
        description : req.body.gig.gig_description,
        photo : req.body.image,
        rate : req.body.gig.gig_rate,
        reviews : [{
            order_id : null,
            user_id : null,
            client_id : null,
            reviews_rating : null,
            comment : null
        }]
        })
    gigs.save().then((doc)=>{
        res.send(doc)
    },()=>{
        res.send("error");
    })

   
 });

//method for fetching gigs
 app.post('/fetchgigs',(req, res) => {
    //  console.log(req.body.id)
    Gigs.find({}).then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
    
 });

//method for updating object
// app.post('/update',(req,res)=>{
//     //mongoose method for finding object by id and then updating it
//     Contact.findByIdAndUpdate(req.body.id,{$set : { name : req.body.name,email : req.body.email,phone : req.body.phone}},{new : true}).then((doc)=>{ 
//         //sending updated object to user
//         res.send({contact : doc});
// },(err)=>{
//     res.status(400).send(err);
// })
// });

//method for finding single contact by id
// app.post('/Singleuser',(req,res)=>{
//     //mongoose method for finding object by id
//     Contact.findById(req.body.id).then((doc)=>{
//             //sending obj to user
//             res.send({contact : doc});
//     },(err)=>{
//         res.status(400).send(err);
//     })
// });

//method for listing object
// app.get('/user',(req,res)=>{
//     Contact.find().then((doc)=>{
//             //returning object to user
//             res.status(200).send(doc);
//     },(err)=>{
//         res.status(400).send(err);
//     })
// });


app.listen(3000, () => {
    console.log('Server started on 3000')
})