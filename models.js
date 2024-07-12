const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
  text: String,
  delete_password: String,
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new Schema({
  text: String,
  delete_password: String,
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [ReplySchema]
});

const BoardSchema = new Schema({
  name: String,
  threads: [ThreadSchema]
});

const BoardModel = mongoose.model('Board', BoardSchema);
const ThreadModel = mongoose.model('Thread', ThreadSchema);
const ReplyModel = mongoose.model('Reply', ReplySchema);

module.exports = {
  Board: BoardModel,
  Thread: ThreadModel,
  Reply: ReplyModel
};