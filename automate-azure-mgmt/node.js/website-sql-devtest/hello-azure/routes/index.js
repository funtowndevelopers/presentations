var tests = require('../tests');

exports.index = function(req, res){
  res.render('index', { title: 'Azure' });
};

// will run all the tests when a request is sent to /tests URI
exports.tests = function (req, res) {
  tests.run(function (error, results) {
    res.render('tests', { results: results });
  });
}