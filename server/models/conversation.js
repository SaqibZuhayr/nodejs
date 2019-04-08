const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    participants : [
        {
            senderId : {type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
            receiverId : {type: mongoose.Schema.Types.ObjectId, ref: 'Users'}
        }
    ]

});
module.exports = mongoose.model('Conversation',ConversationSchema);