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

// functions/admin/admins-manage.ts
var admins_manage_exports = {};
__export(admins_manage_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(admins_manage_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
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
var generateAdminId = () => `ADM${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  const adminId = event.pathParameters?.adminId;
  const method = event.httpMethod;
  try {
    if (method === "GET" && !adminId) {
      const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
        TableName: ADMINS_TABLE
      }));
      const admins = (result.Items || []).map((admin) => {
        const { password, passwordHash, ...safeAdmin } = admin;
        return safeAdmin;
      });
      return response(200, {
        success: true,
        data: {
          admins,
          count: admins.length
        }
      });
    }
    if (method === "GET" && adminId) {
      const result = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId }
      }));
      if (!result.Item) {
        return response(404, {
          success: false,
          error: "\uAD00\uB9AC\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      const { password, ...safeAdmin } = result.Item;
      return response(200, {
        success: true,
        data: { admin: safeAdmin }
      });
    }
    if (method === "POST" && !adminId) {
      const body = JSON.parse(event.body || "{}");
      const { email, name, phone, role, password } = body;
      if (!email || !name || !role || !password) {
        return response(400, {
          success: false,
          error: "\uD544\uC218 \uD56D\uBAA9\uC774 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        });
      }
      const existingResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
        TableName: ADMINS_TABLE,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email }
      }));
      if (existingResult.Items && existingResult.Items.length > 0) {
        return response(400, {
          success: false,
          error: "\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4."
        });
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newAdmin = {
        adminId: generateAdminId(),
        email,
        name,
        phone: phone || "",
        role,
        password,
        status: "active",
        isMaster: false,
        loginFailCount: 0,
        isLocked: false,
        createdAt: now,
        createdBy: "admin",
        updatedAt: now
      };
      await docClient.send(new import_lib_dynamodb.PutCommand({
        TableName: ADMINS_TABLE,
        Item: newAdmin
      }));
      const { password: _, ...safeAdmin } = newAdmin;
      return response(201, {
        success: true,
        data: {
          message: "\uAD00\uB9AC\uC790\uAC00 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          admin: safeAdmin
        }
      });
    }
    if (method === "PUT" && adminId) {
      const body = JSON.parse(event.body || "{}");
      const { name, phone, role, status, password, isLocked } = body;
      const existingResult = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId }
      }));
      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: "\uAD00\uB9AC\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      if (existingResult.Item.isMaster && role && role !== "super") {
        return response(400, {
          success: false,
          error: "\uB9C8\uC2A4\uD130 \uACC4\uC815\uC758 \uC5ED\uD560\uC740 \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      const updateExpressions = ["#updatedAt = :updatedAt"];
      const expressionNames = { "#updatedAt": "updatedAt" };
      const expressionValues = { ":updatedAt": (/* @__PURE__ */ new Date()).toISOString() };
      if (name !== void 0) {
        updateExpressions.push("#name = :name");
        expressionNames["#name"] = "name";
        expressionValues[":name"] = name;
      }
      if (phone !== void 0) {
        updateExpressions.push("phone = :phone");
        expressionValues[":phone"] = phone;
      }
      if (role !== void 0) {
        updateExpressions.push("#role = :role");
        expressionNames["#role"] = "role";
        expressionValues[":role"] = role;
      }
      if (status !== void 0) {
        updateExpressions.push("#status = :status");
        expressionNames["#status"] = "status";
        expressionValues[":status"] = status;
      }
      if (password !== void 0) {
        updateExpressions.push("#password = :password");
        expressionNames["#password"] = "password";
        expressionValues[":password"] = password;
      }
      if (isLocked !== void 0) {
        updateExpressions.push("isLocked = :isLocked");
        expressionValues[":isLocked"] = isLocked;
      }
      const result = await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "ALL_NEW"
      }));
      const { password: _, ...safeAdmin } = result.Attributes || {};
      return response(200, {
        success: true,
        data: {
          message: "\uAD00\uB9AC\uC790 \uC815\uBCF4\uAC00 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          admin: safeAdmin
        }
      });
    }
    if (method === "DELETE" && adminId) {
      const existingResult = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId }
      }));
      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: "\uAD00\uB9AC\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      if (existingResult.Item.isMaster) {
        return response(400, {
          success: false,
          error: "\uB9C8\uC2A4\uD130 \uACC4\uC815\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      await docClient.send(new import_lib_dynamodb.DeleteCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId }
      }));
      return response(200, {
        success: true,
        data: {
          message: "\uAD00\uB9AC\uC790\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        }
      });
    }
    return response(405, {
      success: false,
      error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBA54\uC11C\uB4DC\uC785\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error("\uAD00\uB9AC\uC790 \uAD00\uB9AC \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uAD00\uB9AC\uC790 \uAD00\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
