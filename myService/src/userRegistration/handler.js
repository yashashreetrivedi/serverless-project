const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dynamoDb = new aws.DynamoDB({
  apiVersion: '2020-05-19',
  region: 'us-east-2'
});

const STAGE = process.env.STAGE;

const dbUserId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let id = Math.random() * 16 | 0, v = c == 'x' ? id : (id & 0x3 | 0x8);
    return v.toString(16);
  });
}

const validateFormat = (input, inputType) => {
  let valid;
  switch(inputType) {
    case 'username': 
      valid = input.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/igm);
      break;
    case 'password': 
      valid = input.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/igm);
      break;
    default:
      valid = false;
  }
  if(!valid) {
    console.log('no match', valid);
    throw new Error('invalid '+ inputType);
  }
};

exports.handler = async (event) => {
  const credentials = JSON.parse(event.body);
  const username = credentials.username;
  const password = Buffer.from(credentials.password, 'base64').toString('binary');
  const userId = dbUserId();
  const token = jwt.sign({ username: username }, 'Someturingnoguesstumbler',{expiresIn : "1hr"});
  
  let response = {
      statusCode: 200,
      body: '',
  };
  
  try {
    validateFormat(username, 'username');
    validateFormat(password, 'password');  
  } catch(err) {
    response.statusCode = 400;
    response.body = err.message;
    return response;
  }
  
  const hash = bcrypt.hashSync(password, 10);
 
  const params = {
    Item: {
      "userId":{
        S:userId
      },
    "username": {
        S: username
      },
      "password": {
        S: hash
      }
    },
    TableName: 'Users'
  };
  
  await dynamoDb.putItem(params).promise()
  .then(() => {
   
   response.statusCode = 200;
   response.body = token;
  
  }).catch((err) => {
    
    response.statusCode = 500;
    response.body = err.message;
     
  });  

    return response;
};
