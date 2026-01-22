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

// functions/admin/discounts-manage.ts
var discounts_manage_exports = {};
__export(discounts_manage_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(discounts_manage_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || "plic-discounts";
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
var generateDiscountId = () => `DSC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  const discountId = event.pathParameters?.discountId;
  const method = event.httpMethod;
  try {
    if (method === "GET" && !discountId) {
      const queryParams = event.queryStringParameters || {};
      const { type } = queryParams;
      let filterExpression;
      let expressionValues;
      if (type) {
        filterExpression = "#type = :type";
        expressionValues = { ":type": type };
      }
      const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
        TableName: DISCOUNTS_TABLE,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: filterExpression ? { "#type": "type" } : void 0,
        ExpressionAttributeValues: expressionValues
      }));
      const discounts = result.Items || [];
      return response(200, {
        success: true,
        data: {
          discounts,
          count: discounts.length
        }
      });
    }
    if (method === "GET" && discountId) {
      const result = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId }
      }));
      if (!result.Item) {
        return response(404, {
          success: false,
          error: "\uD560\uC778 \uD56D\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      return response(200, {
        success: true,
        data: { discount: result.Item }
      });
    }
    if (method === "POST" && !discountId) {
      const body = JSON.parse(event.body || "{}");
      const {
        name,
        code,
        type,
        discountType,
        discountValue,
        minAmount,
        startDate,
        expiry,
        canStack,
        isReusable,
        description,
        allowedGrades,
        targetGrades,
        targetUserIds
      } = body;
      if (!name || !type || !discountType || discountValue === void 0) {
        return response(400, {
          success: false,
          error: "\uD544\uC218 \uD56D\uBAA9\uC774 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        });
      }
      if (type === "code" && code) {
        const existingResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
          TableName: DISCOUNTS_TABLE,
          FilterExpression: "code = :code",
          ExpressionAttributeValues: { ":code": code }
        }));
        if (existingResult.Items && existingResult.Items.length > 0) {
          return response(400, {
            success: false,
            error: "\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
          });
        }
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newDiscount = {
        id: generateDiscountId(),
        name,
        code: code || "",
        type,
        discountType,
        discountValue,
        minAmount: minAmount || 0,
        startDate: startDate || now.split("T")[0],
        expiry: expiry || "",
        canStack: canStack ?? true,
        isReusable: isReusable ?? true,
        isActive: true,
        isUsed: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        description: description || "",
        allowedGrades: allowedGrades || [],
        targetGrades: targetGrades || [],
        targetUserIds: targetUserIds || []
      };
      await docClient.send(new import_lib_dynamodb.PutCommand({
        TableName: DISCOUNTS_TABLE,
        Item: newDiscount
      }));
      return response(201, {
        success: true,
        data: {
          message: "\uD560\uC778 \uD56D\uBAA9\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          discount: newDiscount
        }
      });
    }
    if (method === "PUT" && discountId) {
      const body = JSON.parse(event.body || "{}");
      const existingResult = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId }
      }));
      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: "\uD560\uC778 \uD56D\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      const allowedFields = [
        "name",
        "code",
        "discountType",
        "discountValue",
        "minAmount",
        "startDate",
        "expiry",
        "canStack",
        "isReusable",
        "isActive",
        "description",
        "allowedGrades",
        "targetGrades",
        "targetUserIds"
      ];
      const updateExpressions = ["#updatedAt = :updatedAt"];
      const expressionNames = { "#updatedAt": "updatedAt" };
      const expressionValues = { ":updatedAt": (/* @__PURE__ */ new Date()).toISOString() };
      for (const field of allowedFields) {
        if (body[field] !== void 0) {
          const attrName = `#${field}`;
          const attrValue = `:${field}`;
          if (["name", "code", "type"].includes(field)) {
            expressionNames[attrName] = field;
            updateExpressions.push(`${attrName} = ${attrValue}`);
          } else {
            updateExpressions.push(`${field} = ${attrValue}`);
          }
          expressionValues[attrValue] = body[field];
        }
      }
      const result = await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 1 ? expressionNames : void 0,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "ALL_NEW"
      }));
      return response(200, {
        success: true,
        data: {
          message: "\uD560\uC778 \uD56D\uBAA9\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          discount: result.Attributes
        }
      });
    }
    if (method === "DELETE" && discountId) {
      const existingResult = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId }
      }));
      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: "\uD560\uC778 \uD56D\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
        });
      }
      await docClient.send(new import_lib_dynamodb.DeleteCommand({
        TableName: DISCOUNTS_TABLE,
        Key: { id: discountId }
      }));
      return response(200, {
        success: true,
        data: {
          message: "\uD560\uC778 \uD56D\uBAA9\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        }
      });
    }
    return response(405, {
      success: false,
      error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBA54\uC11C\uB4DC\uC785\uB2C8\uB2E4."
    });
  } catch (error) {
    console.error("\uD560\uC778 \uAD00\uB9AC \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uD560\uC778 \uAD00\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
