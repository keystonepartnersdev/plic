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

// confirm.ts
var confirm_exports = {};
__export(confirm_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(confirm_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || "";
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    if (!event.body) {
      return response(400, {
        success: false,
        error: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const body = JSON.parse(event.body);
    const { email, code } = body;
    if (!email || !code) {
      return response(400, {
        success: false,
        error: "\uC774\uBA54\uC77C\uACFC \uC778\uC99D\uCF54\uB4DC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    try {
      await cognitoClient.send(new import_client_cognito_identity_provider.ConfirmSignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        ConfirmationCode: code
      }));
    } catch (cognitoError) {
      if (cognitoError.name === "CodeMismatchException") {
        return response(400, {
          success: false,
          error: "\uC778\uC99D\uCF54\uB4DC\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
        });
      }
      if (cognitoError.name === "ExpiredCodeException") {
        return response(400, {
          success: false,
          error: "\uC778\uC99D\uCF54\uB4DC\uAC00 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0C8 \uCF54\uB4DC\uB97C \uC694\uCCAD\uD574\uC8FC\uC138\uC694."
        });
      }
      if (cognitoError.name === "NotAuthorizedException") {
        return response(400, {
          success: false,
          error: "\uC774\uBBF8 \uC778\uC99D\uC774 \uC644\uB8CC\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4."
        });
      }
      throw cognitoError;
    }
    const queryResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email }
    }));
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, {
        success: false,
        error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const user = queryResult.Items[0];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newStatus = "pending_verification";
    await docClient.send(new import_lib_dynamodb.UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid: user.uid },
      UpdateExpression: "SET #status = :status, isVerified = :verified, updatedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": newStatus,
        ":verified": true,
        ":now": now
      }
    }));
    return response(200, {
      success: true,
      data: {
        message: "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D \uAC80\uD1A0 \uD6C4 \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4."
      }
    });
  } catch (error) {
    console.error("\uC774\uBA54\uC77C \uC778\uC99D \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uC774\uBA54\uC77C \uC778\uC99D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
