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

// AdminDealsUpdateFunction/deals-update.ts
var deals_update_exports = {};
__export(deals_update_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(deals_update_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var DEALS_TABLE = process.env.DEALS_TABLE || "plic-deals";
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
    const did = event.pathParameters?.did;
    if (!did) {
      return response(400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "\uAC70\uB798 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }
      });
    }
    if (!event.body) {
      return response(400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }
      });
    }
    const body = JSON.parse(event.body);
    console.log("[AdminDealsUpdate] Request:", { did, body });
    const getResult = await docClient.send(new import_lib_dynamodb.GetCommand({
      TableName: DEALS_TABLE,
      Key: { did }
    }));
    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: { code: "NOT_FOUND", message: "\uAC70\uB798\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }
      });
    }
    const deal = getResult.Item;
    if (deal.isPaid) {
      return response(400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "\uACB0\uC81C \uC644\uB8CC\uB41C \uAC70\uB798\uB294 \uC218\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }
      });
    }
    if (!["draft", "awaiting_payment"].includes(deal.status)) {
      return response(400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "\uD604\uC7AC \uC0C1\uD0DC\uC5D0\uC11C\uB294 \uAC70\uB798\uB97C \uC218\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }
      });
    }
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    if (body.amount !== void 0) {
      const newAmount = body.amount;
      const feeRate = deal.feeRate || 3.3;
      const feeAmountBase = Math.floor(newAmount * feeRate / 100);
      const feeAmount = Math.floor(feeAmountBase * 1.1);
      const totalAmount = newAmount + feeAmount;
      updateExpressions.push("#amount = :amount");
      updateExpressions.push("#feeAmount = :feeAmount");
      updateExpressions.push("#totalAmount = :totalAmount");
      updateExpressions.push("#finalAmount = :finalAmount");
      expressionAttributeNames["#amount"] = "amount";
      expressionAttributeNames["#feeAmount"] = "feeAmount";
      expressionAttributeNames["#totalAmount"] = "totalAmount";
      expressionAttributeNames["#finalAmount"] = "finalAmount";
      expressionAttributeValues[":amount"] = newAmount;
      expressionAttributeValues[":feeAmount"] = feeAmount;
      expressionAttributeValues[":totalAmount"] = totalAmount;
      expressionAttributeValues[":finalAmount"] = totalAmount - (deal.discountAmount || 0);
    }
    if (body.recipient !== void 0) {
      updateExpressions.push("#recipient = :recipient");
      expressionAttributeNames["#recipient"] = "recipient";
      expressionAttributeValues[":recipient"] = body.recipient;
    }
    if (body.attachments !== void 0) {
      updateExpressions.push("#attachments = :attachments");
      expressionAttributeNames["#attachments"] = "attachments";
      expressionAttributeValues[":attachments"] = body.attachments;
    }
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = (/* @__PURE__ */ new Date()).toISOString();
    if (updateExpressions.length === 1) {
      return response(400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "\uC218\uC815\uD560 \uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }
      });
    }
    const updateResult = await docClient.send(new import_lib_dynamodb.UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    }));
    console.log("[AdminDealsUpdate] Updated deal:", updateResult.Attributes);
    return response(200, {
      success: true,
      data: {
        message: "\uAC70\uB798\uAC00 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        deal: updateResult.Attributes
      }
    });
  } catch (error) {
    console.error("[AdminDealsUpdate] Error:", error);
    return response(500, {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "\uAC70\uB798 \uC218\uC815 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
