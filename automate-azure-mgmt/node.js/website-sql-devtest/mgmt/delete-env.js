var fs = require('fs'),
    path = require('path'),
    S = require('string'),
    async = require('async'),
    azure = require('azure');

var subscriptionId = '<your subscription id>';
// to get the pem file
// 1. install azure xplat-cli
// 2. import your publish settings file
// 3. run 'azure account cert export'
var pem = fs.readFileSync('<path to your azure mgmt certificate pem file>').toString();

var webspace = 'westuswebspace';
var website = '<your web site name>';
var databaseServer = '<your sql server name>'; // notice: this is generated by azure when creating the sql server

// create client to manage web site
var wsClient = azure.createWebSiteManagementClient(new azure.CertificateCloudCredentials({
  subscriptionId: subscriptionId,
  pem: pem
}));

// create client to manage sql server
var sqlClient = azure.createSqlManagementClient(new azure.CertificateCloudCredentials({
  subscriptionId: subscriptionId,
  pem: pem
}));

// delete a web site
wsClient.webSites.delete(webspace, website, {
  deleteAllSlots: false,
  deleteEmptyServerFarm: false,
  deleteMetrics: false
}, function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log('web site ' + website + ' deleted');
  }
});

// delete a sql server
sqlClient.servers.delete(databaseServer, function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log('sql database server ' + databaseServer + ' created');
  }
});