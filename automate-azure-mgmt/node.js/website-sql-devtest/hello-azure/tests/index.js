var request = require('request'),
    async = require('async');

// run all the tests one by one
exports.run = function(callback){
  async.series([function (cb) {
    testWebSiteRunning(cb);
  }, function (cb) {
    testWebSiteHomePageHasString('Azure', cb);
  }], callback);
};

// check whether the web site is running
function testWebSiteRunning (callback) {
  // the environment variable 'HOST_NAME' is set in provision-env.js
  request(process.env.HOST_NAME, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, {
        name: 'testWebSiteRunning',
        pass: true,
        message: 'Great!'
      });
    } else {
      callback(null, {
        name: 'testWebSiteRunning',
        pass: false,
        message: error
      });
    }
  });
};

// check whether the home page contains some string content
function testWebSiteHomePageHasString (content, callback) {
  request(process.env.HOST_NAME, function (error, response, body) {
    if (body && body.indexOf(content) > 0) {
      callback(null, {
        name: 'testWebSiteHomePageHasString',
        pass: true,
        message: 'Great!'
      });
    } else {
      callback(null, {
        name: 'testWebSiteHomePageHasString',
        pass: false,
        message: 'home page does not have string "' + content + '"'
      });
    }
  });
};