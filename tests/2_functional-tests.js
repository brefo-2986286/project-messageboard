const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let thread_id;
  let reply_id;
  const board = 'testboard';
  const delete_password = 'password123';

  // Creating a new thread
  test('POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post(`/api/threads/${board}`)
      .send({
        text: 'Test thread',
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        thread_id = res.body._id;
        done();
      });
  });

  // Viewing the 10 most recent threads with 3 replies each
  test('GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        res.body.forEach(thread => {
          assert.isArray(thread.replies);
          assert.isAtMost(thread.replies.length, 3);
        });
        done();
      });
  });

  // Deleting a thread with the incorrect password
  test('DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({
        thread_id: thread_id,
        delete_password: 'wrongpassword'
      })
      .end((err, res) => {
        assert.equal(res.status, 400);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // Deleting a thread with the correct password
  test('DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({
        thread_id: thread_id,
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // Reporting a thread
  test('PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put(`/api/threads/${board}`)
      .send({
        report_id: thread_id
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // Creating a new reply
  test('POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post(`/api/replies/${board}`)
      .send({
        thread_id: thread_id,
        text: 'Test reply',
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        reply_id = res.body._id;
        done();
      });
  });

  // Viewing a single thread with all replies
  test('GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get(`/api/replies/${board}`)
      .query({
        thread_id: thread_id
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'replies');
        assert.isArray(res.body.replies);
        done();
      });
  });

  // Deleting a reply with the incorrect password
  test('DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: thread_id,
        reply_id: reply_id,
        delete_password: 'wrongpassword'
      })
      .end((err, res) => {
        assert.equal(res.status, 400);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // Deleting a reply with the correct password
  test('DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: thread_id,
        reply_id: reply_id,
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // Reporting a reply
  test('PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put(`/api/replies/${board}`)
      .send({
        thread_id: thread_id,
        reply_id: reply_id
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });
});
