const mongoose = require('mongoose');
const Reply    = require('./reply.js');
const Schema = mongoose.Schema;

const threadSchema = new Schema({
  _id        : Schema.Types.ObjectId,
  text       : { type: String, required: true },
  password   : { type: String, required: true },
  created_on : { type: Date, default: Date.now },
  bumped_on  : { type: Date, default: Date.now },
  reported   : { type: Boolean, default: false },
  replies    : [{ type: Schema.Types.ObjectId, ref: 'Reply' }]
});

threadSchema.post('remove', function(doc) {
  Reply.deleteMany({
    _id: { "$in": doc.replies }
  }, {}, function(err) {});
});

/* 
  There is actually no reason to reference the replies
  instead of embbeding it inside the thread. A reply
  is forever within one single thread, not ever being
  used in a different thread. Embedding would reduce
  the amount of queries to find a specific reply,
  improving the overall application performance.
  The same applies for referencing threads inside a board.
*/

module.exports = mongoose.model('Thread', threadSchema);