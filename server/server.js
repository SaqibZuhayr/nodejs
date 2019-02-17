var express = require('Express');
var bodyParser = require('body-parser');

var { mongoose } = require('./db/mongoose');
var { User } = require('./models/user');
var { Question } = require('./models/question');

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

    //console.log('asdasd')
    let arr = [];
    Question.find({}).then((doc) => {

        doc.forEach(element => {
            User.findOne({ '_id': element.user_id }).then((user) => {
                arr.push({ question: element, user: { 'username': user.username } })
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

    //console.log('asdasd')
    //console.log(req.body.questionID);
    Question.find({ '_id': req.body.questionID }).then((doc) => {
        console.log();
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for posting question
app.post('/postquestion', (req, res) => {

    //console.log('asdasd')
    //console.log(req.body.questionID);
    var question = new Question({
        question: req.body.question,
        user_id: '5c095910aca26c1254be01ff',
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
    Question.updateOne(
        { '_id': req.body.questionID },
        { $push: { answer: { answer: req.body.answer, user_id: req.body.questionID, rating: { approved: false, score: 0 } } } },
        { returnOriginal: false }
    ).then((doc) => {
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