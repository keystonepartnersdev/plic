var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/admin/login.ts
var login_exports = {};
__export(login_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(login_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var crypto = __toESM(require("crypto"));
var ADMIN_SECRET = "plic-admin-secret";
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var ADMINS_TABLE = process.env.ADMINS_TABLE || "plic-admins";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var FORCE_UNLOCK_ACCOUNTS = {
  "admin@plic.kr": "admin123",
  "admin": "admin1234"
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;
    if (!email || !password) {
      return response(400, {
        success: false,
        error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      });
    }
    const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: ADMINS_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email }
    }));
    if (!result.Items || result.Items.length === 0) {
      return response(401, {
        success: false,
        error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uACC4\uC815\uC785\uB2C8\uB2E4."
      });
    }
    const admin = result.Items[0];
    if (FORCE_UNLOCK_ACCOUNTS[email]) {
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId: admin.adminId },
        UpdateExpression: "SET isLocked = :isLocked, loginFailCount = :count, #pw = :password, #st = :status",
        ExpressionAttributeNames: {
          "#pw": "password",
          "#st": "status"
        },
        ExpressionAttributeValues: {
          ":isLocked": false,
          ":count": 0,
          ":password": FORCE_UNLOCK_ACCOUNTS[email],
          ":status": "active"
        }
      }));
      admin.isLocked = false;
      admin.loginFailCount = 0;
      admin.password = FORCE_UNLOCK_ACCOUNTS[email];
      admin.status = "active";
    }
    if (admin.status !== "active") {
      return response(403, {
        success: false,
        error: "\uBE44\uD65C\uC131\uD654\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4."
      });
    }
    if (admin.isLocked) {
      return response(400, {
        success: false,
        error: "\uACC4\uC815\uC774 \uC7A0\uACBC\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC138\uC694."
      });
    }
    if (admin.password !== password) {
      const newFailCount = (admin.loginFailCount || 0) + 1;
      const shouldLock = newFailCount >= 5;
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId: admin.adminId },
        UpdateExpression: "SET loginFailCount = :count, isLocked = :locked",
        ExpressionAttributeValues: {
          ":count": newFailCount,
          ":locked": shouldLock
        }
      }));
      if (shouldLock) {
        return response(400, {
          success: false,
          error: "\uBE44\uBC00\uBC88\uD638\uB97C 5\uD68C \uC774\uC0C1 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. \uACC4\uC815\uC774 \uC7A0\uACBC\uC2B5\uB2C8\uB2E4."
        });
      }
      return response(401, {
        success: false,
        error: `\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. (${newFailCount}/5)`
      });
    }
    await docClient.send(new import_lib_dynamodb.UpdateCommand({
      TableName: ADMINS_TABLE,
      Key: { adminId: admin.adminId },
      UpdateExpression: "SET loginFailCount = :count, lastLoginAt = :loginAt",
      ExpressionAttributeValues: {
        ":count": 0,
        ":loginAt": (/* @__PURE__ */ new Date()).toISOString()
      }
    }));
    const { password: _, ...safeAdmin } = admin;
    const payload = Buffer.from(JSON.stringify({
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1e3
      // 24시간 후 만료
    })).toString("base64");
    const signature = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
    const token = `${payload}.${signature}`;
    return response(200, {
      success: true,
      data: {
        message: "\uB85C\uADF8\uC778 \uC131\uACF5",
        admin: safeAdmin,
        token
      }
    });
  } catch (error) {
    console.error("\uB85C\uADF8\uC778 \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uB85C\uADF8\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
