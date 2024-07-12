"use strict";

const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;

module.exports = function (app) {
  app.route("/api/threads/:board")
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        let board = req.body.board || req.params.board;
        const now = new Date();

        const newThread = new ThreadModel({
          text: text,
          delete_password: delete_password,
          replies: [],
          created_on: now,
          bumped_on: now,
          reported: false,
        });

        let Boarddata = await BoardModel.findOne({ name: board }).exec();
        if (!Boarddata) {
          const newBoard = new BoardModel({
            name: board,
            threads: [newThread],
          });
          await newBoard.save();
          res.json(newThread);
        } else {
          Boarddata.threads.push(newThread);
          await Boarddata.save();
          res.json(newThread);
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error saving the thread" });
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        let data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          res.status(404).json({ error: "No board with this name" });
        } else {
          const threads = data.threads
            .sort((a, b) => b.bumped_on - a.bumped_on)
            .slice(0, 10)
            .map((thread) => {
              const {
                _id,
                text,
                created_on,
                bumped_on,
                replies,
              } = thread;
              const sortedReplies = replies
                .sort((a, b) => b.created_on - a.created_on)
                .slice(0, 3)
                .map(reply => ({
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on,
                }));
              return {
                _id,
                text,
                created_on,
                bumped_on,
                replies: sortedReplies,
                replycount: thread.replies.length,
              };
            });
          res.json(threads);
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error fetching threads" });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const board = req.params.board;

        let boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }

        let threadToReport = boardData.threads.id(thread_id);
        if (!threadToReport) {
          return res.status(404).json({ error: "Thread not found" });
        }

        threadToReport.reported = true;
        await boardData.save();
        res.send("reported");
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error reporting thread" });
      }
    });

    app.delete('/api/threads/:board', async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;
    
        // Check if the board exists
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }
    
        // Find the thread to delete
        let threadToDelete = boardData.threads.id(thread_id);
        if (!threadToDelete) {
          return res.status(404).json({ error: "Thread not found" });
        }
    
        // Check delete password
        if (threadToDelete.delete_password !== delete_password) {
          return res.status(403).send("incorrect password");
        }
    
        // Remove the thread reference and save changes
        boardData.threads.pull({ _id: thread_id });
        await boardData.save();
    
        // Adjusted response string to lowercase
        return res.status(200).send("success"); // Note the lowercase 's'
    
      } catch (err) {
        // Enhanced error handling and logging
        console.error("Error deleting thread:", err);
        return res.status(500).json({ error: "Error deleting thread", message: err.message });
      }
    });
  
  

  app.route("/api/replies/:board")
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const board = req.params.board;
        const now = new Date();
        const newReply = new ReplyModel({
          text: text,
          delete_password: delete_password,
          created_on: now,
          reported: false,
        });

        let boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          res.status(404).json({ error: "Board not found" });
        } else {
          let threadToAddReply = boardData.threads.id(thread_id);
          if (threadToAddReply) {
            threadToAddReply.bumped_on = now;
            threadToAddReply.replies.push(newReply);
            await boardData.save();
            res.json(threadToAddReply);
          } else {
            res.status(404).json({ error: "Thread not found" });
          }
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error adding the reply" });
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        let data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          res.status(404).json({ error: "No board with this name" });
        } else {
          const thread = data.threads.id(req.query.thread_id);
          if (thread) {
            res.json({
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: thread.replies.map(reply => ({
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on,
              })),
            });
          } else {
            res.status(404).json({ error: "Thread not found" });
          }
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error fetching the replies" });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;

        let boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }

        let thread = boardData.threads.id(thread_id);
        if (!thread) {
          return res.status(404).json({ error: "Thread not found" });
        }

        let reply = thread.replies.id(reply_id);
        if (!reply) {
          return res.status(404).json({ error: "Reply not found" });
        }

        reply.reported = true;
        await boardData.save();
        res.send("reported");
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error reporting reply" });
      }
    });

    app.route("/api/replies/:board")
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const board = req.params.board;

        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }

        let thread = boardData.threads.id(thread_id);
        if (!thread) {
          return res.status(404).json({ error: "Thread not found" });
        }

        let replyToDelete = thread.replies.id(reply_id);
        if (!replyToDelete) {
          return res.status(404).json({ error: "Reply not found" });
        }

        if (replyToDelete.delete_password !== delete_password) {
          return res.status(403).send("incorrect password");
        }

        replyToDelete.text = "[deleted]";
        await boardData.save();

        res.status(200).send("success");
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting reply" });
      }
    });
};
  

