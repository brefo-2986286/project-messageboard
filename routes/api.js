'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for threads and replies
const ReplySchema = new Schema({
  text: String,
  created_on: { type: Date, default: Date.now },
  delete_password: String,
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new Schema({
  text: String,
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  delete_password: String,
  reported: { type: Boolean, default: false },
  replies: [ReplySchema]
});

const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = function(app) {

  // Creating a new thread
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;
        const newThread = new Thread({ text, delete_password, board });
        const savedThread = await newThread.save();
        res.json(savedThread);
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select('-delete_password -reported')
          .lean();
        threads.forEach(thread => {
          thread.replies = thread.replies.slice(0, 3);
        });
        res.json(threads);
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (thread.delete_password !== delete_password) {
          return res.status(400).send('incorrect password');
        }
        await thread.remove();
        res.send('success');
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .put(async (req, res) => {
      try {
        const { report_id } = req.body;
        await Thread.findByIdAndUpdate(report_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).send(err.message);
      }
    });

  // Creating a new reply
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const reply = { text, delete_password };
        const thread = await Thread.findById(thread_id);
        thread.replies.push(reply);
        thread.bumped_on = new Date();
        await thread.save();
        res.json(reply);
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        const thread = await Thread.findById(thread_id)
          .select('-delete_password -reported');
        res.json(thread);
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        if (reply.delete_password !== delete_password) {
          return res.status(400).send('incorrect password');
        }
        reply.remove();
        await thread.save();
        res.send('success');
      } catch (err) {
        res.status(500).send(err.message);
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        reply.reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
};
