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

// functions/admin/system-settings.ts
var system_settings_exports = {};
__export(system_settings_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(system_settings_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var SETTINGS_TABLE = process.env.SETTINGS_TABLE || "plic-settings";
var SETTINGS_KEY = "SYSTEM_SETTINGS";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var defaultSettings = {
  gradeSettings: {
    basic: { feeRate: 4, monthlyLimit: 1e7 },
    platinum: { feeRate: 3.5, monthlyLimit: 3e7 },
    b2b: { feeRate: 3, monthlyLimit: 1e8 },
    employee: { feeRate: 1, monthlyLimit: 1e8 }
  },
  gradeCriteria: {
    platinumThreshold: 1e7,
    basicThreshold: 5e6
  },
  maintenanceMode: false,
  maintenanceMessage: "\uC2DC\uC2A4\uD15C \uC810\uAC80 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC774\uC6A9\uD574\uC8FC\uC138\uC694.",
  autoApprovalEnabled: false,
  autoApprovalThreshold: 1e5,
  emailNotificationEnabled: true,
  smsNotificationEnabled: false,
  slackWebhookUrl: "",
  sessionTimeout: 480,
  maxLoginAttempts: 5,
  passwordExpiryDays: 90
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    if (event.httpMethod === "GET") {
      const result = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: SETTINGS_TABLE,
        Key: { settingId: SETTINGS_KEY }
      }));
      if (!result.Item) {
        return response(200, {
          success: true,
          data: {
            settings: defaultSettings
          }
        });
      }
      const { settingId, ...settings } = result.Item;
      return response(200, {
        success: true,
        data: {
          settings: {
            ...defaultSettings,
            ...settings
          }
        }
      });
    } else if (event.httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");
      const { settings } = body;
      if (!settings) {
        return response(400, { success: false, error: "\uC124\uC815 \uB370\uC774\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingResult = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: SETTINGS_TABLE,
        Key: { settingId: SETTINGS_KEY }
      }));
      const existingSettings = existingResult.Item || {};
      const updatedSettings = {
        settingId: SETTINGS_KEY,
        ...defaultSettings,
        ...existingSettings,
        ...settings,
        // gradeSettings 깊은 병합
        gradeSettings: {
          ...defaultSettings.gradeSettings,
          ...existingSettings.gradeSettings || {},
          ...settings.gradeSettings || {}
        },
        // gradeCriteria 깊은 병합
        gradeCriteria: {
          ...defaultSettings.gradeCriteria,
          ...existingSettings.gradeCriteria || {},
          ...settings.gradeCriteria || {}
        },
        updatedAt: now
      };
      await docClient.send(new import_lib_dynamodb.PutCommand({
        TableName: SETTINGS_TABLE,
        Item: updatedSettings
      }));
      const { settingId, ...returnSettings } = updatedSettings;
      return response(200, {
        success: true,
        message: "\uC2DC\uC2A4\uD15C \uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        data: {
          settings: returnSettings
        }
      });
    }
    return response(405, { success: false, error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uB294 \uBA54\uC11C\uB4DC\uC785\uB2C8\uB2E4." });
  } catch (error) {
    console.error("System settings API error:", error);
    return response(500, {
      success: false,
      error: error.message || "\uC2DC\uC2A4\uD15C \uC124\uC815 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
