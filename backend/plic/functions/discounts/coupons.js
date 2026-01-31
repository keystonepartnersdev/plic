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

// coupons.ts
var coupons_exports = {};
__export(coupons_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(coupons_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || "plic-discounts";
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var getUserFromToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const command = new import_client_cognito_identity_provider.GetUserCommand({ AccessToken: token });
    const result = await cognitoClient.send(command);
    const uid = result.UserAttributes?.find((attr) => attr.Name === "sub")?.Value;
    if (!uid) return null;
    const userResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "uid = :uid",
      ExpressionAttributeValues: { ":uid": uid }
    }));
    const user = userResult.Items?.[0];
    return {
      uid,
      grade: user?.grade || "basic"
    };
  } catch (error) {
    console.error("\uD1A0\uD070 \uAC80\uC99D \uC2E4\uD328:", error);
    return null;
  }
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const headers = event.headers || {};
    const user = await getUserFromToken(headers.Authorization || headers.authorization);
    const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: "#type = :type AND isActive = :isActive",
      ExpressionAttributeNames: {
        "#type": "type"
      },
      ExpressionAttributeValues: {
        ":type": "coupon",
        ":isActive": true
      }
    }));
    let coupons = result.Items || [];
    coupons = coupons.filter((coupon) => {
      if (coupon.startDate && coupon.startDate > now) {
        return false;
      }
      if (coupon.expiry && coupon.expiry < now) {
        return false;
      }
      return true;
    });
    if (user) {
      coupons = coupons.filter((coupon) => {
        if (coupon.targetUserIds && coupon.targetUserIds.length > 0) {
          if (!coupon.targetUserIds.includes(user.uid)) {
            return false;
          }
        }
        if (coupon.targetGrades && coupon.targetGrades.length > 0) {
          if (!coupon.targetGrades.includes(user.grade)) {
            return false;
          }
        }
        if (coupon.allowedGrades && coupon.allowedGrades.length > 0) {
          if (!coupon.allowedGrades.includes(user.grade)) {
            return false;
          }
        }
        return true;
      });
    }
    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      name: coupon.name,
      type: coupon.type,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount || 0,
      startDate: coupon.startDate,
      expiry: coupon.expiry,
      canStack: coupon.canStack ?? true,
      isReusable: coupon.isReusable ?? true,
      isActive: coupon.isActive,
      isUsed: coupon.isUsed || false,
      description: coupon.description
    }));
    return response(200, {
      coupons: formattedCoupons,
      total: formattedCoupons.length
    });
  } catch (error) {
    console.error("\uCFE0\uD3F0 \uBAA9\uB85D \uC870\uD68C \uC624\uB958:", error);
    return response(500, {
      coupons: [],
      total: 0,
      error: error.message || "\uCFE0\uD3F0 \uBAA9\uB85D \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
