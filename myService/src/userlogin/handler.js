const aws = require("aws-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dynamoDb = new aws.DynamoDB({
  apiVersion: "2020-05-19",
  region: "us-east-2",
});
const tableName = "users";
const secret = "testtesttest"
module.exports.login = async (event) => {
  const credentials = JSON.parse(event.body);
  const email = credentials.email;
  const password = Buffer.from(credentials.password, "base64").toString(
  "binary"
  );
  const hash = bcrypt.hashSync(password, 10);
  let response = {
      statusCode: 401,
      body: ""
  };
  const params = {
      Key: {
        email: {
          S: email,
        },
      },
      TableName: tableName,
      ProjectionExpression: 
        'email, password'
  };
  await dynamoDb
  .getItem(params)
  .promise()
  .then((credential)=>{
    if(!credential.Item) throw new Error();
    if(!bcrypt.compareSync(credential.Item.password.S, hash)) throw new Error();
    response.statusCode = 200;
    response.body = jwt.sign(
      {email: email}, 
      secret, 
      {expiresIn: "1hr"}
    );
  })
  .catch((err) => {
      console.log(err);
      response.statusCode = 401;
      response.body = 'Could not verify email or password';
      // return response;
  });
  return response;
};
