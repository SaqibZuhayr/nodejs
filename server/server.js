var express = require('Express');
var bodyParser = require('body-parser');
const multer = require("multer");
const HttpStatus = require('http-status-codeS');
var keyword_extractor = require("keyword-extractor");
const fs = require('fs')
var dateFormat = require('dateformat');


var { mongoose } = require('./db/mongoose');
var { User } = require('./models/user');
var { Question } = require('./models/question');
let { Gigs } = require('./models/gigs')
const stripe = require('stripe')('sk_test_tD7ONVYIktON3WD37yTJQTGi');
//const upload = multer({ dest: "images/" });
var { Message } = require('./models/messageModels');
var { Conversation } = require('./models/conversation');
var { Keywords } = require('./models/keywords');

// const MIME_TYPE_MAP = {
//     "image/png": "png",
//     "image/jpeg": "jpg",
//     "image/jpg": "jpg"
// };


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const isValid = MIME_TYPE_MAP[file.mimetype];
//         let error = new Error("Invalid mime type");
//         if (isValid) {
//             error = null;
//         }
//         cb(error, "images");
//     },
//     filename: (req, file, cb) => {
//         const name = file.originalname
//             .toLowerCase()
//             .split(" ")
//             .join("-");
//         const ext = MIME_TYPE_MAP[file.mimetype];
//         cb(null, name + "-" + Date.now() + "." + ext);
//     }
// });

var app = express();

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

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
    //console.log(req.body.password);
    // console.log(req.body.email);
    User.find({ "email": req.body.email, "password": req.body.password }).then((doc) => {
        //console.log(doc);
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});
//method for fetching questions
app.post('/questions', (req, res) => {

    // console.log('asdasd')
    let arr = [];
    let tag = {};
    if (req.body.search) {
        searchQuestions(req, res);
        return;

    }
    if (req.body.tag) {
        tag["category"] = req.body.tag
    }
    if (req.body.id) {
        tag["user_id"] = req.body.id
    }
    //console.log(tag)
    Question.find(tag).sort('_id').then((doc) => {
        doc.forEach(element => {
            // console.log(element);
            User.findOne({ _id: element.user_id }).then((user) => {
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
    let score = 0;
    //console.log('asdasd')
    //console.log(req.body.questionID);
    Question.findOne({ '_id': req.body.questionID }).then((doc) => {
        answers = [];
        result = {
            'askedBy': doc.askedBy,
            'question': doc.question,
            'questionid': doc._id,
            'category': doc.category,
            answers
        }
        if (doc.answer.length > 0) {
            doc.answer.forEach(element => {
                score = 0;
                element.rating.forEach((element2) => {
                    if (element2.ratedAs == "add") {
                        score++;
                    }
                    else {
                        score--;
                    }
                });

                result.answers.push({ answer: element, score })
                if (result.answers.length == doc.answer.length) {
                    res.send(result);
                }
            });
        }
        else {
            res.send(result);
        }







    }, (err) => {
        res.status(400).send(err);
    })
});

//method for posting question
app.post('/postquestion', async (req, res) => {
    // console.log(req.body.userid);
    //console.log('asdasd')
    //console.log(req.body.questionID);

    var questionKeywords = keywordsSearch(req.body.question);
    var question = new Question({
        question: req.body.question,
        user_id: req.body.userid,
        askedBy: req.body.askedBy,
        category: req.body.category,
        keywords: questionKeywords

    });
    //saving contact to db
    const savedQuestion = await question.save();
    let relatedQs = [];
    relatedQs.push(savedQuestion._id);
    User.findOne({ '_id': req.body.userid }).then((user) => {
        user.questions.push({ id: savedQuestion._id })
        user.save();
    })
    questionKeywords.forEach(element => {
        Keywords.findOne({ keyword: element }).then((kw) => {
            if (kw) {
                kw.relatedQuestions.push(savedQuestion._id);
                kw.save();
            }
            else {
                new Keywords({
                    keyword: element,
                    relatedQuestions: relatedQs

                }).save()
            }
        })
        res.send({ message: 'Question posted' })
    });
});

//method for posting answers
app.post('/postanswer', (req, res) => {

    //console.log('asdasd')
    //console.log(req.body.questionID);
    //saving answer to db
    const answer = {

        answer: req.body.answer,
        user_id: req.body.userid,
        answeredBy: req.body.answeredBy,
        approved: false,
        rating: []

    }
    Question.findOne(
        { _id: req.body.questionID }
    ).then((doc) => {
        console.log(doc);
        doc.answer.push(answer);
       var a =  doc.answer[doc.answer.length-1]._id
        doc.save();
        User.findOne({'_id':req.body.userid}).then((user)=>{
            user.answers.push({id : a})
            user.save()
        })
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

//method for fetching Jobs
app.post('/viewjobs', (req, res) => {
    let arr = [];
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
//method for fetching my jobs
app.post('/myjobs', (req, res) => {
    User.findOne({ '_id': req.body.userid }).then((user) => {
        res.send(user.jobs);
    })
});
// method for fetching applicants
app.post('/getapplicants', (req, res) => {
    let applicants = []
    User.findOne({ 'jobs._id': req.body.jobID }).then((user) => {
        user.jobs.forEach(job => {
            if (job._id == req.body.jobID) {
                job.applied.forEach(applicant => {
                    User.findOne({ '_id': applicant.user_id }).then((user) => {
                        applicants.push(user);
                        if (job.applied.length == applicants.length) {
                            res.send(applicants)
                        }
                    })
                });
            }
        });
    })
});

//method for job apply
app.post('/applyjob', (req, res) => {

    User.findOne({ 'jobs._id': req.body.jobID }).then((user) => {
        console.log(req.body)
        if (user._id == req.body.userid) {
            res.send({ message: 'You cannot apply for your own job' })
        }
        else {
            user.jobs.forEach(job => {
                if (job._id == req.body.jobID) {
                   if(job.applied){
                       job.applied.forEach(applicant => {
                           if(applicant.user_id == req.body.userid){
                               res.send({message : 'You have already applied'})
                           }
                       });
                       job.applied.push({user_id : req.body.userid});
                       job.save()
                       res.send({message : 'Your application is submitted'})
                   }
                   else{
                    job.applied.push({user_id : req.body.userid});
                    job.save()
                    res.send({message : 'Your application is submitted'})
                   }
                }
                user.save();

            });

        }
    })
});

//method for posting jobs
app.post('/postjobs', (req, res) => {
    //console.log(req.body.userid);
    User.findOne(
        { _id: req.body.userid }
    ).then((doc) => {
        // console.log(doc);
        doc.jobs.push(req.body.job);
        doc.save((err) => {
            if (err) {
                res.status(400).send(err);
            }
            else {
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
                if (element1._id == req.body.jobID) {
                    res.send(element1);
                }


            });

        });
    }, (err) => {
        res.status(400).send(err);
    })
});
//method for fetching users
app.post('/fetchusers', (req, res) => {
    User.find({}).then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});
//method for deleting user
app.post('/deleteuser', (req, res) => {
    //  console.log(req.body.id)
    User.find({ '_id': req.body.id }).remove().then((doc) => {
        Question.find({ 'user_id': req.body.id }).remove().then((doc1) => {

        })
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});
//method for deleting question
app.post('/deletequestion', (req, res) => {
    //  console.log(req.body.id)
    Question.find({ '_id': req.body.id }).remove().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});
//method for admin dashboard
app.post('/adminDashboard', (req, res) => {
    //  console.log(req.body.id)
    countanswer = 0;
    countquestion = 0;
    countuser = 0;
    User.countDocuments({}).then((doc) => {
        countuser = doc;
        Question.find({}).then((doc1) => {
            countquestion = doc1.length;
            doc1.forEach((element, index) => {
                // console.log(' ================ ', element.answer.length);
                countanswer += Number(element.answer.length);
                if (doc1.length == index + 1) {
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
app.post('/addgig', async (req, res) => {
    //console.log(req.body);
    var gigs = new Gigs({
        userid: req.body.userid,
        username: req.body.username,
        title: req.body.gig.gig_title,
        description: req.body.gig.gig_description,
        photo: req.body.image,
        rate: req.body.gig.gig_rate,
        reviews: []
    })
    const savedGig = await gigs.save()
    User.findOne({ '_id': req.body.userid }).then((user) => {
        user.gigs.push({
            id: savedGig._id
        })
        user.save()
    })
   res.send(savedGig)


});

//method for fetching gigs
app.post('/fetchgigs', (req, res) => {
    let user = {}
    if (req.body.userid) {
        user["userid"] = req.body.userid
    }
    //  console.log(req.body.id)
    Gigs.find(user).then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});

// method for gig detail
app.post('/gigdetail', (req, res) => {
    //  console.log(req.body.id)
    Gigs.findOne({ '_id': req.body.gigid }).then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});
//method for adding reviews
app.post('/addreview', (req, res) => {
     //console.log(req.body)
     User.findOne({'_id':req.body.client_id}).select({'username':1, '_id':0}).then((us)=>{
         Gigs.findOne({'_id':req.body.gigid}).then((gig)=>{
             gig.reviews.push({
                order_id : req.body.orderid,
                client_id : us.username,
                reviews_rating : req.body.reviews_rating,
                comment : req.body.comment
             })
             gig.save();
             res.send({message : 'Review added'})
         })
     })
});

//method for fetching question tags
app.get('/getquestiontags', (req, res) => {
    //  console.log(req.body.id)
    Question.distinct('category').then((doc) => {
        console.log("categories", doc)
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});

//method for fetching freelance tags
app.get('/getfreelancetags', (req, res) => {
    //  console.log(req.body.id)
    Gigs.distinct('title').then((doc) => {
        //console.log("title", doc)
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});

//method for fetching job tags
app.get('/getjobtags', (req, res) => {
    //  console.log(req.body.id)
    User.distinct('jobs.category').then((doc) => {
        // console.log("jobs.category", doc)
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});

app.post('/payment', async (req, res) => {
    //  console.log(req.body.id)
    console.log(req.body)
    var deliveredUserName;
    var gigname;
    Gigs.findOne({ '_id': req.body.gigid }).then((gig) => {
        gigname = gig.title;

    });


    try {
        const { status } = await stripe.charges.create({
            amount: req.body.amount * 100,
            currency: 'usd',
            description: 'asdsadsd',
            source: req.body.id
        });
        console.log(status);

        if (status) {
            User.findOne({ 'ordersAccepted._id': req.body.orderid }).then((user) => {
                deliveredUserName = user.username
                user.account.currentAmount = user.account.currentAmount + req.body.amount;
                user.account.earnings.push({
                    amount: req.body.amount,
                    date: dateFormat(),
                    client_id: req.body.userid,
                    gig_name: gigname
                })
                user.save();
            })
            User.findOne({ '_id': req.body.userid }).then((user) => {
                user.account.transactions.push({
                    amount: req.body.amount,
                    date: Date.now(),
                    client_id: deliveredUserName,
                    gig_name: gigname
                })
                user.save();
            })

            res.json({ status })
        }
    } catch (e) {
        res.status(500).end();
    }

});

//method for fetching job tags
//  app.get('/gettrendingjobs',(req, res) => {
//     //  console.log(req.body.id)
//     User.find('jobs.category').sort({lastDate : -1}).then((doc) => {
//         console.log("jobs.category",doc)
//         res.send(doc);
//     }, (err) => {
//         res.status(400).send(err);
//     })

//  });

//method for searching questions
function searchQuestions(req, res) {
    let arr = []
    Question.find({ 'category': { '$regex': ".*" + req.body.search + ".*" } }).then((doc) => {
        doc.forEach(element => {
            // console.log(element);
            User.findOne({ _id: element.user_id }).then((user) => {
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
}
//method for user answers
app.post('/useranswers', (req, res) => {
    //console.log(req.body.userid)
    let arr = []
    Question.find({}).then((doc) => {
        doc.forEach(element => {
            element.answer.forEach(answer => {
                if (answer.user_id === req.body.userid) {
                    arr.push({
                        'questionObj': { 'question': element.question, 'askedBy': element.askedBy, 'category': element.category },
                        'answerObj': answer
                    });
                }
            });
        });
        res.send(arr);
        //console.log(arr);
        //res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })

});

app.post('/chat', (req, res) => {
    const { senderId, receiverId } = req.body;

    Conversation.find({
        $or: [
            {
                participants: {
                    $elemMatch: {
                        senderId: req.body.senderId, receiverId: req.body.receiverId
                    }
                }
            },
            {
                participants: {
                    $elemMatch: {
                        senderId: req.body.receiverId, receiverId: req.body.senderId
                    }
                }
            }
        ]
    },
        async (err, result) => {
            if (result.length > 0) {
                await Message.updateOne({
                    conversationId: result[0]._id

                },
                    {
                        $push: {
                            message: {
                                senderId: req.body.senderId,
                                receiverId: req.body.receiverId,
                                sendername: req.body.senderName,
                                receivername: req.body.receiverName,
                                body: req.body.message
                            }
                        }
                    }).then((doc) => {
                        //console.log(doc)
                        res.status(HttpStatus.OK).json({ message: 'Message sent asd' })
                    })
                    .catch(err => res.status(HttpStatus.INTERNAL_SERVER_ERROR));
            } else {
                const newConversation = new Conversation();
                newConversation.participants.push({
                    senderId: req.body.senderId,
                    receiverId: req.body.receiverId

                });
                const saveConversation = await newConversation.save();
                const newMessage = new Message();
                //console.log(saveConversation._id)
                newMessage.conversationId = saveConversation._id;
                newMessage.sender = req.body.senderName;
                newMessage.receiver = req.body.receiverName;
                newMessage.message.push({

                    senderId: req.body.senderId,
                    receiverId: req.body.receiverId,
                    sendername: req.body.senderName,
                    receivername: req.body.receiverName,
                    body: req.body.message

                });

                await newMessage
                    .save().then(() => res.status(HttpStatus.OK).json({ message: 'Message sent' }))
                    .catch(err => res.status(HttpStatus.INTERNAL_SERVER_ERROR));

                await User.update({
                    _id: req.body.senderId

                },
                    {
                        $push: {
                            chatList: {
                                $each: [
                                    {
                                        receiverId: req.body.receiverId,
                                        msgId: newMessage._id
                                    }
                                ],
                                $position: 0
                            }
                        }
                    }
                );
                await User.update({
                    _id: req.body.receiverId
                },
                    {
                        $push: {
                            chatList: {
                                $each: [
                                    {
                                        receiverId: req.body.senderId,
                                        msgId: newMessage._id
                                    }
                                ]
                                ,
                                $position: 0
                            }
                        }
                    }
                );

            }
        }
    );

});

app.post('/getchat', async (req, res) => {
    // console.log('getchat');
    const { senderId, receiverId } = req.body;

    const conversation = await Conversation.findOne({
        $or: [
            {
                participants: {
                    $elemMatch: {
                        senderId: req.body.senderId, receiverId: req.body.receiverId
                    }
                }
            },
            {
                participants: {
                    $elemMatch: {
                        senderId: req.body.receiverId, receiverId: req.body.senderId
                    }
                }
            }
        ]
    }).select('_id');
    if (conversation) {
        const messages = await Message.findOne({
            conversationId: conversation._id
        });
        res.status(HttpStatus.OK).json({ message: 'Messages returned', messages });
    }
});

// method for rating answers
app.post('/rateanswer', (req, res) => {
    //  console.log(req.body.id)
    //console.log(req.body);
    Question.findOne({ 'answer._id': req.body.answerId }).select('answer').then((doc) => {
        doc.answer.forEach(ANSWER => {
            if (ANSWER._id == req.body.answerId) {
                ANSWER.rating.forEach(RATING => {
                    if (RATING.ratedBy == req.body.userid) {
                        res.send({ message: 'already rated' });
                        return;
                    }

                });
                ANSWER.rating.push({ ratedBy: req.body.userid, ratedAs: req.body.rate });
                ANSWER.save();
                res.send(doc);

            }
        });
        doc.save();
    });
});
// method  for approving answer
app.post('/approveAnswer', (req, res) => {
    //console.log(req.body.orderType);
    //console.log(req.body)
    Question.findOne({ 'answer._id': req.body.answerId }).then((doc) => {
        if (doc.user_id == req.body.questionBy) {
            doc.answer.forEach(ans => {
                if (ans._id == req.body.answerId) {
                    // console.log('aur suna')
                    ans.approved = true;
                    ans.save();
                }
            });
            doc.save();
            res.send({ message: 'Done' });


        }
    });

});





require('./socket')(io);

app.post('/getConversations', (req, res) => {
    //console.log(req.body.userid,)
    let users = [];
    let chatlist = [];
    Conversation.find().
        then((doc) => {
            doc.forEach(element => {
                element.participants.forEach(element2 => {
                    if (element2.senderId == req.body.userid || element2.receiverId == req.body.userid) {
                        if (element2.senderId != req.body.userid) {
                            users.push({ 'id': element2.senderId });

                        }
                        if (element2.receiverId != req.body.userid) {
                            users.push({ 'id': element2.receiverId });
                        }
                    }
                });
            });
            users.forEach(element => {
                User.findOne({ '_id': element.id }).then((doc2) => {
                    chatlist.push(doc2);
                    if (users.length == chatlist.length) {
                        res.send(chatlist);
                    }
                })
            });
        })
    //     
});

//method for submitting order
app.post('/submitOrder', (req, res) => {
    //console.log(req.body);
    User.update({
        _id: req.body.receiverid
    },
        {
            $push: {
                ordersRequested: {
                    $each: [
                        {
                            userid: req.body.userid,
                            gig_id: req.body.gigid,
                            title: req.body.order.order_name,
                            description: req.body.order.order_description,
                            amount: req.body.order.order_price,
                            time_limit: req.body.order.order_delivery_time,
                            dispute_id: null,
                            completed: false
                        }
                    ]
                    ,
                    $position: 0
                }
            }
        }
    ).then((doc) => {
        console.log("Done");
        res.send(doc);
    });



});

//method for fetching orders
app.post('/getOrderRequests', (req, res) => {
    //console.log(req.body.orderType);
    User.findOne({ '_id': req.body.userid }).then((doc) => {
        res.send(doc.ordersRequested);
    });

});

app.post('/getPendingOrders', (req, res) => {
    //console.log(req.body.orderType);
    User.findOne({ '_id': req.body.userid }).then((doc) => {
        res.send(doc.ordersAccepted);
    });

});
//method for fetching account details
app.post('/getAccountDetails', (req, res) => {
    //console.log(req.body.orderType);
    User.findOne({ '_id': req.body.userid }).then((doc) => {
        res.send(doc.account);
    });

});
// method for fetching my orders
app.post('/getMyOrders', (req, res) => {
    //console.log(req.body.orderType);
    User.findOne({ '_id': req.body.userid }).then((doc) => {
        res.send({
            ordersAccepted: doc.myOrders,
            ordersReceived: doc.ordersReceived
        });
    });

});
//method for delivering orders
var storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

var upload2 = multer({ storage: storage1 })
app.post('/deliverOrder', upload2.single('file'), (req, res) => {


    console.log(req.file)

    var address = "/public/" + req.file.filename

    User.findOne({ '_id': req.body.userid }).then((user) => {
        user.ordersReceived.push({
            deliveredBy: req.body.myid,
            orderid: req.body.orderid,
            orderName: req.file.filename,
            orderFile: address,
            gig_id : req.body.gigid
        })
        user.save();
        User.findOne({ '_id': req.body.myid }).select('ordersAccepted').then((orders) => {
            orders.ordersAccepted.forEach(order => {
                console.log(order._id, req.body.orderid)
                if (order._id == req.body.orderid) {
                    order.completed = true;
                }
            });
            orders.save();
        })

    });

    res.send({ message: 'Oka done' })
});
app.get('/public/:file', function (req, res) {
    file = req.params.file;

    var filePath = "public/" + file


    fs.exists(filePath, function (exists) {
        if (exists) {
            // Content-type is very interesting part that guarantee that
            // Web browser will handle response in an appropriate manner.
            res.download(filePath)
        } else {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("ERROR File does not exist");
        }
    });


});
//method for accepting order
app.post('/acceptOrder', (req, res) => {
    // console.log(req.body)
    // User.findOne({'_id':req.body.userid}).then((doc)=>{

    // });

    User.findOneAndUpdate(
        { _id: req.body.userid },
        { $pull: { ordersRequested: { _id: req.body.orderid } } },
        { new: false },
        (err, doc) => {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            else {
                // console.log("------------------ ", doc, "--------------------");
                let tem = doc.ordersRequested.filter((val) => {
                    // console.log(val._id , req.body.orderid);
                    if (val._id == req.body.orderid) {
                        // console.log(val)
                        return val;
                    }

                })
                if (req.body.requestType == "accept") {
                    doc.ordersAccepted.push(tem[0]);
                    doc.save();
                    User.findOne({ '_id': tem[0].userid }).then((user) => {
                        //console.log(user, "-------------------------------------");
                        user.myOrders.push(tem[0]);
                        user.save();
                    })
                }
                res.send({ message: "Orders updated" });


            }


        }
    );

});
//method for suggested Questions
app.post('/suggestedQuestions', (req, res) => {
    //mongoose method for finding object by id
    let q = [];
    Question.findOne({ '_id': req.body.questionID }).then((doc) => {
        //sending obj to user
        questions = []
        doc.keywords.forEach(element => {
            questions.push(new Promise(function (resolve, reject) {
                var query = { keyword: element };
                Keywords.find(query, function (err, info) {
                    Question.find({ _id: { $in: info[0].relatedQuestions } })
                        .then(quest => {
                            resolve(quest);
                        })
                });
            }));
        });
        Promise.all(questions).then(function (results) {
            res.send(results)
        });
    });
});



function keywordsSearch(str) {

    var extraction_result = keyword_extractor.extract(str, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true

    });
    console.log(extraction_result)
    return extraction_result;
}



//method for listing object
// app.get('/user',(req,res)=>{
//     Contact.find().then((doc)=>{
//             //returning object to user
//             res.status(200).send(doc);
//     },(err)=>{
//         res.status(400).send(err);
//     })
// });


server.listen(3000, () => {
    console.log('Server started on 3000')
})