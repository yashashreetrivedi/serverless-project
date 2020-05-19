'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
//const uuid = require('uuid/v4');
const postsTable = process.env.POSTS_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
module.exports.register = (event, context, callback) => {
    const reqBody = JSON.parse(event.body);
    const post = {
      userId: reqBody.userId,
      name:reqBody.name,
      age:reqBody.age
    };
    return db
      .put({
        TableName: postsTable,
        Item: post
      })
      .promise()
      .then(() => {
        callback(null, response(201, post));
      })
      .catch((err) => response(null, response(err.statusCode, err)));
  };''