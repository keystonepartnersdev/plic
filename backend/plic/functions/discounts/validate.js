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

// validate.ts
var validate_exports = {};
__export(validate_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(validate_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || "plic-discounts";
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
    const { code, amount } = body;
    if (!code) {
      return response(400, {
        valid: false,
        error: "\uD560\uC778\uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
      });
    }
    const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: "#code = :code AND #type = :type",
      ExpressionAttributeNames: {
        "#code": "code",
        "#type": "type"
      },
      ExpressionAttributeValues: {
        ":code": code.toUpperCase(),
        ":type": "code"
      }
    }));
    if (!result.Items || result.Items.length === 0) {
      return response(200, {
        valid: false,
        error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
      });
    }
    const discount = result.Items[0];
    if (!discount.isActive) {
      return response(200, {
        valid: false,
        error: "\uD604\uC7AC \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
      });
    }
    if (discount.expiry) {
      const expiryDate = new Date(discount.expiry);
      if (expiryDate < /* @__PURE__ */ new Date()) {
        return response(200, {
          valid: false,
          error: "\uC720\uD6A8\uAE30\uAC04\uC774 \uB9CC\uB8CC\uB41C \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
        });
      }
    }
    if (discount.startDate) {
      const startDate = new Date(discount.startDate);
      if (startDate > /* @__PURE__ */ new Date()) {
        return response(200, {
          valid: false,
          error: "\uC544\uC9C1 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
        });
      }
    }
    if (amount && discount.minAmount && amount < discount.minAmount) {
      return response(200, {
        valid: false,
        error: `\uCD5C\uC18C \uC8FC\uBB38 \uAE08\uC561 ${discount.minAmount.toLocaleString()}\uC6D0 \uC774\uC0C1\uBD80\uD130 \uC0AC\uC6A9 \uAC00\uB2A5\uD569\uB2C8\uB2E4.`
      });
    }
    if (!discount.isReusable && discount.isUsed) {
      return response(200, {
        valid: false,
        error: "\uC774\uBBF8 \uC0AC\uC6A9\uD55C \uD560\uC778\uCF54\uB4DC\uC785\uB2C8\uB2E4."
      });
    }
    return response(200, {
      valid: true,
      discount: {
        id: discount.id,
        name: discount.name,
        code: discount.code,
        type: discount.type,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minAmount: discount.minAmount || 0,
        startDate: discount.startDate,
        expiry: discount.expiry,
        canStack: discount.canStack ?? true,
        isReusable: discount.isReusable ?? true,
        isActive: discount.isActive,
        isUsed: discount.isUsed || false,
        description: discount.description
      }
    });
  } catch (error) {
    console.error("\uD560\uC778\uCF54\uB4DC \uAC80\uC99D \uC624\uB958:", error);
    return response(500, {
      valid: false,
      error: error.message || "\uD560\uC778\uCF54\uB4DC \uAC80\uC99D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
