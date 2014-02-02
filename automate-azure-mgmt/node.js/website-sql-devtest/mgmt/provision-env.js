// Provision the website+sql devtest environment

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
var username = '<your sql server username>';
var password = '<your sql server password>';
var database = '<your sql database name>';

var connectionStringTemplate = 'Server=tcp:{{serverName}}.database.windows.net,1433;Database={{databaseName}};User ID={{username}}@{{serverName}};Password={{password}};Trusted_Connection=False;Encrypt=True;Connection Timeout=30;';

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

// create a web site
function createWebSite (name, callback) {
  wsClient.webSites.create(webspace, {
    name: name,
    hostNames: [name + '.azurewebsites.net'],
    webSpaceName: webspace
  }, function (err, result) {
    if (err) {
      callback(err);
    } else {
      console.log('web site ' + name + ' created');
      callback(err, result);
    }
  });
};

// create a sql server
function createSqlDatabaseServer (username, password, callback) {
  sqlClient.servers.create({
    administratorUserName: username,
    administratorPassword: password,
    location: 'West US'
  }, function (err, result) {
    if (err) {
      callback(err);
    } else {
      console.log('sql database server ' + result.serverName + ' created');
      callback(err, result);
    }
  });
};

// create a sql database
function createSqlDatabase (server, databaseName, callback) {
  sqlClient.databases.create(server.serverName, {
    name: databaseName,
    edition: azure.Constants.SqlAzureConstants.WEB_EDITION,
    collationName: azure.Constants.SqlAzureConstants.DEFAULT_COLLATION_NAME,
    maximumDatabaseSizeInGB: azure.Constants.SqlAzureConstants.WEB_1GB
  }, function (err, result) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      console.log('sql database ' + databaseName + ' created');
      callback(err, [result, server]);
    }
  });
};

// configure web site connection string
// also enable local git for later deployment usage
function setWebSiteConnectionString (name, connectionString, callback) {
  async.waterfall([function (callback) {
    wsClient.webSites.getConfiguration(webspace, name, function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(err, result);
      }
    });
  }, function (config, callback) {
    config.scmType = 'LocalGit';

    if (!config.connectionStrings) {
      config.connectionStrings = [];
    }
    config.connectionStrings.push(connectionString);

    if (!config.appSettings) {
      config.appSettings = {};
    }
    // this will be used in the Node.js app later
    // the app will use process.env.HOST_NAME to figure out which DNS name to use to access the web site
    config.appSettings['HOST_NAME'] = 'http://' + name + '.azurewebsites.net';

    wsClient.webSites.updateConfiguration(webspace, name, config, function (err, result) {
      if (err) {
        callback(err);
      } else {
        console.log('connection string ' + connectionString.name + ' = ' + connectionString.connectionString + ' configured');
        callback(err, result);
      }
    });
  }], function (err, result) {
    if (err) {
      callback(err);
    } else {
      callback(err, result);
    }
  });
};

// create the entire devtest environment
// try to create services in parallel as much as possible
async.waterfall([function (callback) {
  async.parallel([function (callback) {
    async.waterfall([function (callback) {
      createSqlDatabaseServer(username, password, callback); // return server
    }, function (server, callback) {
      createSqlDatabase(server, database, callback); // return [database, server]
    }], function (err, result) { // result = [database, server]
      if (err) {
        callback(err);
      } else {
        callback(err, result); // return [database, server]
      }
    });
  }, function (callback) {
    createWebSite(website, callback);
  }], function (err, results) { // results = [[database, server], website]
    if (err) {
      callback(err);
    } else {
      callback(err, {
        type: 'SQLAzure',
        name: 'db',
        connectionString: S(connectionStringTemplate).template({
          databaseName: results[0].name,
          username: username,
          serverName: results[0][1].serverName,
          password: password
        }).s
      }); // return connection string
    }
  });
}, function (connectionString, callback) {
  setWebSiteConnectionString(website, connectionString, callback);
}], function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log("Finish!");
  }
});
