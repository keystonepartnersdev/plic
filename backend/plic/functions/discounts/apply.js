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

// apply.ts
var apply_exports = {};
__export(apply_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(apply_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || "plic-discounts";
var DEALS_TABLE = process.env.DEALS_TABLE || "plic-deals";
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
    const body = JSON.parse(event.body || "{}");
    const { dealId, discountId } = body;
    if (!dealId || !discountId) {
      return response(400, {
        success: false,
        error: "\uAC70\uB798 ID\uC640 \uD560\uC778 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const discountResult = await docClient.send(new import_lib_dynamodb.GetCommand({
      TableName: DISCOUNTS_TABLE,
      Key: { id: discountId }
    }));
    if (!discountResult.Item) {
      return response(404, {
        success: false,
        error: "\uD560\uC778 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const discount = discountResult.Item;
    if (!discount.isActive) {
      return response(400, {
        success: false,
        error: "\uD604\uC7AC \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uD560\uC778\uC785\uB2C8\uB2E4."
      });
    }
    const dealResult = await docClient.send(new import_lib_dynamodb.GetCommand({
      TableName: DEALS_TABLE,
      Key: { did: dealId }
    }));
    if (!dealResult.Item) {
      return response(404, {
        success: false,
        error: "\uAC70\uB798 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const deal = dealResult.Item;
    let discountAmount = 0;
    if (discount.discountType === "amount") {
      discountAmount = Math.min(discount.discountValue, deal.feeAmount);
    } else if (discount.discountType === "feePercent") {
      discountAmount = Math.floor(deal.feeAmount * (discount.discountValue / 100));
    }
    const newFinalAmount = deal.totalAmount - discountAmount;
    await docClient.send(new import_lib_dynamodb.UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did: dealId },
      UpdateExpression: "SET discountCode = :discountCode, discountAmount = :discountAmount, finalAmount = :finalAmount, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":discountCode": discount.code || discount.name,
        ":discountAmount": discountAmount,
        ":finalAmount": newFinalAmount,
        ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
      }
    }));
    if (!discount.isReusable) {
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: "SET isUsed = :isUsed, usageCount = usageCount + :inc, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":isUsed": true,
          ":inc": 1,
          ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
    } else {
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: "SET usageCount = usageCount + :inc, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
    }
    return response(200, {
      success: true,
      data: {
        discountAmount,
        finalAmount: newFinalAmount,
        message: "\uD560\uC778\uC774 \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      }
    });
  } catch (error) {
    console.error("\uD560\uC778 \uC801\uC6A9 \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uD560\uC778 \uC801\uC6A9 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
