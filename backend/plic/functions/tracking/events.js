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

// events.ts
var events_exports = {};
__export(events_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(events_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var EVENTS_TABLE = process.env.EVENTS_TABLE || "plic-events";
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
var generateEventId = () => `EVT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const events = Array.isArray(body.events) ? body.events : [body];
    if (events.length === 0) {
      return response(400, { success: false, error: "\uC774\uBCA4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
    }
    const ttl = Math.floor(Date.now() / 1e3) + TTL_DAYS * 24 * 60 * 60;
    const batches = [];
    for (let i = 0; i < events.length; i += 25) {
      const batch = events.slice(i, i + 25).map((evt) => ({
        PutRequest: {
          Item: {
            eventId: generateEventId(),
            eventType: evt.eventType,
            eventName: evt.eventName || evt.eventType,
            sessionId: evt.sessionId,
            anonymousId: evt.anonymousId,
            userId: evt.userId || null,
            timestamp: evt.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
            page: evt.page || null,
            device: evt.device || null,
            utm: evt.utm || null,
            funnel: evt.funnel || null,
            click: evt.click || null,
            error: evt.error || null,
            performance: evt.performance || null,
            custom: evt.custom || null,
            ttl,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        }
      }));
      batches.push(batch);
    }
    for (const batch of batches) {
      await docClient.send(new import_lib_dynamodb.BatchWriteCommand({
        RequestItems: {
          [EVENTS_TABLE]: batch
        }
      }));
    }
    return response(200, {
      success: true,
      processed: events.length
    });
  } catch (error) {
    console.error("\uC774\uBCA4\uD2B8 \uC218\uC9D1 \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uC774\uBCA4\uD2B8 \uC218\uC9D1 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
