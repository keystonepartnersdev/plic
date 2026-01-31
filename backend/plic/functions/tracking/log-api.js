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

// log-api.ts
var log_api_exports = {};
__export(log_api_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(log_api_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var API_LOGS_TABLE = process.env.API_LOGS_TABLE || "plic-api-logs";
var TTL_DAYS = 30;
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Correlation-ID",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var generateLogId = () => `LOG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
var SENSITIVE_FIELDS = ["password", "token", "accessToken", "refreshToken", "idToken", "secret", "apiKey", "Authorization"];
var maskSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);
  if (typeof data === "object") {
    const masked = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        masked[key] = "***MASKED***";
      } else if (typeof value === "object") {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
  return data;
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const logs = Array.isArray(body.logs) ? body.logs : [body];
    if (logs.length === 0) {
      return response(400, { success: false, error: "\uB85C\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
    }
    const ttl = Math.floor(Date.now() / 1e3) + TTL_DAYS * 24 * 60 * 60;
    const batches = [];
    for (let i = 0; i < logs.length; i += 25) {
      const batch = logs.slice(i, i + 25).map((log) => {
        let level = log.level || "INFO";
        if (log.statusCode >= 500) level = "ERROR";
        else if (log.statusCode >= 400) level = "WARN";
        else if (log.executionTime > 3e3) level = "WARN";
        return {
          PutRequest: {
            Item: {
              logId: generateLogId(),
              correlationId: log.correlationId,
              endpoint: log.endpoint,
              method: log.method,
              statusCode: log.statusCode,
              requestBody: maskSensitiveData(log.requestBody),
              responseBody: log.statusCode >= 400 ? maskSensitiveData(log.responseBody) : null,
              // 에러만 응답 저장
              errorMessage: log.errorMessage,
              errorStack: log.errorStack,
              executionTime: log.executionTime,
              timestamp: log.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
              userId: log.userId,
              userAgent: log.userAgent,
              ip: log.ip,
              level,
              ttl,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          }
        };
      });
      batches.push(batch);
    }
    for (const batch of batches) {
      await docClient.send(new import_lib_dynamodb.BatchWriteCommand({
        RequestItems: {
          [API_LOGS_TABLE]: batch
        }
      }));
    }
    return response(200, {
      success: true,
      processed: logs.length
    });
  } catch (error) {
    console.error("API \uB85C\uADF8 \uAE30\uB85D \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "API \uB85C\uADF8 \uAE30\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
