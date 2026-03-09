"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// login.ts
var login_exports = {};
__export(login_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(login_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || process.env.USER_POOL_CLIENT_ID || "";
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var ALLOWED_ORIGINS = [
  "https://plic.kr",
  "https://www.plic.kr",
  "https://plic.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
];
function getCorsHeaders(origin) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type,Authorization,Cookie",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
}
var respond = (statusCode, body, origin) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  body: JSON.stringify(body)
});
var handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === "OPTIONS") {
    return respond(200, {}, origin);
  }
  try {
    const body = JSON.parse(event.body || "{}");
    if (!body.email || !body.password) {
      return respond(400, {
        success: false,
        error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
      }, origin);
    }
    const queryResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": body.email }
    }));
    const users = queryResult.Items || [];
    if (users.length === 0) {
      return respond(401, {
        success: false,
        error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    const user = users[0];
    if (user.status === "withdrawn") {
      return respond(400, {
        success: false,
        error: "\uD0C8\uD1F4\uD55C \uD68C\uC6D0\uC785\uB2C8\uB2E4."
      }, origin);
    }
    const authResult = await cognitoClient.send(new import_client_cognito_identity_provider.InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password
      }
    }));
    const tokens = {
      accessToken: authResult.AuthenticationResult?.AccessToken,
      refreshToken: authResult.AuthenticationResult?.RefreshToken,
      idToken: authResult.AuthenticationResult?.IdToken,
      expiresIn: authResult.AuthenticationResult?.ExpiresIn
    };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid: user.uid },
        UpdateExpression: "SET #lastLogin = :lastLogin, #updated = :updated",
        ExpressionAttributeNames: {
          "#lastLogin": "lastLoginAt",
          "#updated": "updatedAt"
        },
        ExpressionAttributeValues: {
          ":lastLogin": now,
          ":updated": now
        },
        ReturnValues: "ALL_NEW"
      }));
    } catch (updateError) {
      console.error("[Login] lastLoginAt \uC5C5\uB370\uC774\uD2B8 \uC2E4\uD328:", updateError);
    }
    const responseBody = {
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        status: user.status,
        feeRate: user.feeRate,
        monthlyLimit: user.monthlyLimit,
        usedAmount: user.usedAmount
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn
    };
    if (user.status === "suspended") {
      responseBody.warning = "\uACC4\uC815\uC774 \uC815\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC1A1\uAE08 \uAE30\uB2A5\uC774 \uC81C\uD55C\uB429\uB2C8\uB2E4.";
    }
    return respond(200, responseBody, origin);
  } catch (err) {
    console.error("[Login] Error:", err.name, err.message);
    if (err.name === "NotAuthorizedException") {
      return respond(401, {
        success: false,
        error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "UserNotConfirmedException") {
      return respond(400, {
        success: false,
        error: "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "UserNotFoundException") {
      return respond(401, {
        success: false,
        error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "PasswordResetRequiredException") {
      return respond(400, {
        success: false,
        error: "\uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "UserNotConfirmedException") {
      return respond(400, {
        success: false,
        error: "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "ResourceNotFoundException") {
      console.error("[Login] Cognito \uB9AC\uC18C\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. CLIENT_ID:", COGNITO_CLIENT_ID);
      return respond(500, {
        success: false,
        error: "\uC778\uC99D \uC11C\uBE44\uC2A4 \uC124\uC815 \uC624\uB958\uC785\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC138\uC694."
      }, origin);
    }
    if (err.name === "TooManyRequestsException") {
      return respond(429, {
        success: false,
        error: "\uB108\uBB34 \uB9CE\uC740 \uC694\uCCAD\uC774 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      }, origin);
    }
    return respond(500, {
      success: false,
      error: "\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, origin);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=login.js.map
