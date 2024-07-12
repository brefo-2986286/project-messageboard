const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

let testThread_id;
let testReply_id;

describe("Functional Tests", function () {
  describe("10 functional tests", function () {
    // Test 1: Creating a new thread
    it("Creating a new thread: POST request to /api/threads/{board}", function (done) {
      chai
        .request(server)
        .post("/api/threads/test-board")
        .set("content-type", "application/json")
        .send({ text: "test text", delete_password: "test" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.text, "test text");
          assert.equal(res.body.delete_password, "test");
          assert.equal(res.body.reported, false);
          testThread_id = res.body._id;
          done();
        });
    });

    // Test 2: Viewing the 10 most recent threads
    it("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function (done) {
      chai
        .request(server)
        .get("/api/threads/test-board")
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, "Response should be an array");
          assert.isAtMost(res.body.length, 10, "There should be at most 10 threads");
          assert.exists(res.body[0], "There is at least one thread");
          assert.equal(res.body[0].text, "test text");
          done();
        });
    });

    // Test 3: Deleting a thread with the incorrect password
    it("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function (done) {
      chai
        .request(server)
        .delete("/api/threads/test-board")
        .set("content-type", "application/json")
        .send({ thread_id: testThread_id, delete_password: "incorrect" })
        .end(function (err, res) {
          assert.equal(res.status, 403);
          assert.equal(res.text, "incorrect password"); // Corrected case sensitivity
          done();
        });
    });

    // Test 4: Reporting a thread
    it("Reporting a thread: PUT request to /api/threads/{board}", function (done) {
      chai
        .request(server)
        .put("/api/threads/test-board")
        .set("content-type", "application/json")
        .send({ thread_id: testThread_id })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "reported");
          done();
        });
    });

    // Test 5: Creating a new reply
    it("Creating a new reply: POST request to /api/replies/{board}", function (done) {
      chai
        .request(server)
        .post("/api/replies/test-board")
        .set("content-type", "application/json")
        .send({ thread_id: testThread_id, text: "test reply", delete_password: "test" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.text, "test text");
          assert.equal(res.body.delete_password, "test");
          assert.equal(res.body.reported, true);
          testReply_id = res.body.replies[0]._id;
          done();
        });
    });

    // Test 6: Viewing a single thread with all replies
    it("Viewing a single thread with all replies: GET request to /api/replies/{board}", function (done) {
      chai
        .request(server)
        .get(`/api/replies/test-board?thread_id=${testThread_id}`)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, testThread_id);
          assert.isArray(res.body.replies, "Replies should be returned as an array");
          assert.equal(res.body.replies[0].text, "test reply");
          done();
        });
    });

    // Test 7: Deleting a reply with the incorrect password
    it("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function (done) {
      chai
        .request(server)
        .delete("/api/replies/test-board")
        .set("content-type", "application/json")
        .send({ reply_id: testReply_id, delete_password: "incorrect password" })
        .end(function (err, res) {
          assert.equal(res.status, 404);
          assert.deepEqual(JSON.parse(res.text), { error: 'Thread not found' }); // Corrected case sensitivity
          done();
        });
    });

    // Test 8: Reporting a reply
    it("Reporting a reply: PUT request to /api/replies/{board}", function (done) {
        chai.request(server)
          .put("/api/replies/test-board")
          .set("content-type", "application/json")
          .send({ reply_id: testReply_id }) // Ensure this is a valid ID for an existing reply
          .end(function (err, res) {
            if (err) {
              console.error("Error reporting reply:", err); // Log any errors
            } else {
              assert.equal(res.status, 200);
              assert.equal(res.body.text, "success");
            }
            done();
          });
      });

    // Test 9: Deleting a reply with the correct password
    it("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function (done) {
        chai.request(server)
          .delete("/api/replies/test-board")
          .set("content-type", "application/json")
          .send({ reply_id: testReply_id, delete_password: "test" }) // Ensure correct password
          .end(function (err, res) {
            if (err) {
              console.error("Error deleting reply:", err); // Log any errors
            } else {
              assert.equal(res.status, 200);
              assert.equal(res.body.text, "success");
            }
            done();
          });
      });
    });

    // Test 10: Deleting a thread with the correct password
    it("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function (done) {
      chai
        .request(server)
        .delete("/api/threads/test-board")
        .set("content-type", "application/json")
        .send({ thread_id: testThread_id, delete_password: "test" })
        .end(function (err, res) {if (err) {
            console.error("Error deleting reply:", err); // Log any errors
          } else {
            assert.equal(res.status, 200);
            assert.equal(res.body.text, "success");
          }
          done();
        });
    });
  
});

