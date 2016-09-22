var aws = require('aws-sdk');

exports.handler = function(event, context) {
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    var entityId = event.entityId;

    console.log("Retrieving entity Id [" + entityId + "]");
    var docClient = new aws.DynamoDB.DocumentClient()

    var params = {
        TableName: "BrightcoveCallBackEvents",
        KeyConditionExpression: "#en = :eeee",
        ExpressionAttributeNames: {
            "#en": "entity"
        },
        ExpressionAttributeValues: {
            ":eeee": entityId
        },
        ScanIndexForward: false
    };

    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query for entity. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            context.succeed(data);
        }
    });
}
