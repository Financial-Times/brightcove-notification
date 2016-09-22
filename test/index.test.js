var aws = require('aws-sdk-mock');
var brightcoveQueryLambda = require('../index.js')
const context = require('aws-lambda-mock-context');
const ctx = context();

var event = { "entity": "9999" }

exports.testBrightCoveStoreCallback = function(test) {
    var data = {
        "Item": {
            "versionNumber": 1,
            "entityType": "TITLE",
            "action": "CREATE",
            "entity": "666",
            "status": "SUCCESS",
            "notificationTimeDate": 1461768103877
        }
    };
    aws.mock('DynamoDB.DocumentClient', 'get', function(params, callback) {
        callback(null, data);
    });

    brightcoveQueryLambda.handler(event, ctx);

    test.ok(ctx.Promise.then(), "Brightcove getItem passed OK");

    aws.restore();
    test.done();
};