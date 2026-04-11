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

// functions/users/withdraw.ts
var withdraw_exports = {};
__export(withdraw_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(withdraw_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var USERS_TABLE = "plic-users";
var DEALS_TABLE = "plic-deals";
var WITHDRAWN_USERS_TABLE = "plic-withdrawn-users";
var WITHDRAWN_DEALS_TABLE = "plic-withdrawn-deals";
var COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
var ACTIVE_DEAL_STATUSES = ["awaiting_payment", "pending", "reviewing", "hold"];
var RETENTION_YEARS = 5;
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var getUserEmailFromToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const command = new import_client_cognito_identity_provider.GetUserCommand({ AccessToken: token });
    const result = await cognitoClient.send(command);
    const email = result.UserAttributes?.find((attr) => attr.Name === "email")?.Value;
    return email || null;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};
function maskName(name) {
  if (!name) return "***";
  if (name.length === 1) return "*";
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}
function maskEmail(email) {
  if (!email) return "***@***";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? local[0] + "***" : local.substring(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
}
function maskPhone(phone) {
  if (!phone) return "***-****-****";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  return `***-****-${last4}`;
}
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  if (event.httpMethod !== "DELETE") {
    return response(405, { success: false, error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uB294 \uBA54\uC11C\uB4DC\uC785\uB2C8\uB2E4." });
  }
  const email = await getUserEmailFromToken(event.headers.Authorization || event.headers.authorization);
  if (!email) {
    return response(401, { success: false, error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
  }
  try {
    const queryResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email }
    }));
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, { success: false, error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
    }
    const user = queryResult.Items[0];
    const uid = user.uid;
    if (user.status === "withdrawn") {
      return response(400, { success: false, error: "\uC774\uBBF8 \uD0C8\uD1F4\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4." });
    }
    const dealsResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: DEALS_TABLE,
      IndexName: "uid-index",
      KeyConditionExpression: "uid = :uid",
      ExpressionAttributeValues: { ":uid": uid }
    }));
    const allDeals = dealsResult.Items || [];
    const activeDeals = allDeals.filter((deal) => ACTIVE_DEAL_STATUSES.includes(deal.status));
    if (activeDeals.length > 0) {
      return response(400, {
        success: false,
        error: "\uC9C4\uD589 \uC911\uC778 \uAC70\uB798\uAC00 \uC788\uC5B4 \uD0C8\uD1F4\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        activeDeals: activeDeals.length
      });
    }
    const now = /* @__PURE__ */ new Date();
    const withdrawnAt = now.toISOString();
    const retentionUntil = new Date(now.getFullYear() + RETENTION_YEARS, now.getMonth(), now.getDate()).toISOString();
    await docClient.send(new import_lib_dynamodb.PutCommand({
      TableName: WITHDRAWN_USERS_TABLE,
      Item: {
        uid,
        maskedName: maskName(user.name),
        maskedEmail: maskEmail(user.email),
        maskedPhone: maskPhone(user.phone),
        grade: user.grade,
        kakaoId: user.kakaoId || null,
        joinedAt: user.createdAt,
        withdrawnAt,
        retentionUntil,
        reason: "user_request"
      }
    }));
    const completedDeals = allDeals.filter(
      (deal) => ["completed", "cancelled", "refunded", "expired"].includes(deal.status)
    );
    for (const deal of completedDeals) {
      await docClient.send(new import_lib_dynamodb.PutCommand({
        TableName: WITHDRAWN_DEALS_TABLE,
        Item: {
          wdid: `wd_${deal.did}`,
          uid,
          originalDid: deal.did,
          amount: deal.amount,
          fee: deal.fee,
          status: deal.status,
          recipientName: deal.recipientName ? maskName(deal.recipientName) : void 0,
          recipientBank: deal.recipientBank,
          createdAt: deal.createdAt,
          completedAt: deal.completedAt || deal.updatedAt,
          withdrawnAt,
          retentionUntil
        }
      }));
    }
    await docClient.send(new import_lib_dynamodb.DeleteCommand({
      TableName: USERS_TABLE,
      Key: { uid }
    }));
    const cognitoUsername = user.email;
    if (cognitoUsername) {
      try {
        await cognitoClient.send(new import_client_cognito_identity_provider.AdminDeleteUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: cognitoUsername
        }));
      } catch (cognitoError) {
        if (cognitoError.name !== "UserNotFoundException") {
          console.error("Cognito user deletion failed:", cognitoError);
        }
      }
    }
    return response(200, {
      success: true,
      message: "\uD68C\uC6D0 \uD0C8\uD1F4\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      data: {
        withdrawnAt,
        retentionInfo: {
          retentionUntil,
          description: "\uC804\uC790\uC0C1\uAC70\uB798\uBC95 \uB4F1 \uAD00\uB828 \uBC95\uB839\uC5D0 \uB530\uB77C \uAC70\uB798 \uBC0F \uACB0\uC81C \uAE30\uB85D\uC740 5\uB144\uAC04 \uBD84\uB9AC \uBCF4\uAD00\uB429\uB2C8\uB2E4."
        }
      }
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return response(500, {
      success: false,
      error: "\uD68C\uC6D0 \uD0C8\uD1F4 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=withdraw.js.map
