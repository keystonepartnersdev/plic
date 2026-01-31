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

// business-verify.ts
var business_verify_exports = {};
__export(business_verify_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(business_verify_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "PUT,OPTIONS"
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
    const uid = event.pathParameters?.uid;
    if (!uid) {
      return response(400, {
        success: false,
        error: "\uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    if (!event.body) {
      return response(400, {
        success: false,
        error: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const body = JSON.parse(event.body);
    const { status, memo } = body;
    if (!status || !["verified", "rejected"].includes(status)) {
      return response(400, {
        success: false,
        error: "\uC720\uD6A8\uD55C \uC0C1\uD0DC\uAC12\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. (verified \uB610\uB294 rejected)"
      });
    }
    const getResult = await docClient.send(new import_lib_dynamodb.GetCommand({
      TableName: USERS_TABLE,
      Key: { uid }
    }));
    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const user = getResult.Item;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newUserStatus = status === "verified" ? "active" : user.status;
    const updateExpression = [
      "#status = :userStatus",
      "businessInfo.verificationStatus = :verificationStatus",
      "updatedAt = :now"
    ];
    const expressionAttributeValues = {
      ":userStatus": newUserStatus,
      ":verificationStatus": status,
      ":now": now
    };
    if (status === "verified") {
      updateExpression.push("businessInfo.verifiedAt = :verifiedAt");
      expressionAttributeValues[":verifiedAt"] = now;
    }
    if (memo) {
      updateExpression.push("businessInfo.verificationMemo = :memo");
      expressionAttributeValues[":memo"] = memo;
    }
    await docClient.send(new import_lib_dynamodb.UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: expressionAttributeValues
    }));
    const message = status === "verified" ? "\uC0AC\uC5C5\uC790 \uC778\uC99D\uC774 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uC0AC\uC5C5\uC790 \uC778\uC99D\uC774 \uAC70\uC808\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    return response(200, {
      success: true,
      message,
      data: {
        uid,
        userStatus: newUserStatus,
        verificationStatus: status
      }
    });
  } catch (error) {
    console.error("\uC0AC\uC5C5\uC790 \uC778\uC99D \uCC98\uB9AC \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uC0AC\uC5C5\uC790 \uC778\uC99D \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
