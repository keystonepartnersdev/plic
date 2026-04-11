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

// change-password.ts
var change_password_exports = {};
__export(change_password_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(change_password_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var ALLOWED_ORIGINS = [
  "https://plic.kr",
  "https://www.plic.kr",
  "https://plic.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
];
function getCorsHeaders(origin) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type,Authorization,Cookie",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
}
var respond = (statusCode, body, origin) => ({
  statusCode,
  headers: getCorsHeaders(origin),
  body: JSON.stringify(body)
});
var handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === "OPTIONS") {
    return respond(200, {}, origin);
  }
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    if (!accessToken) {
      return respond(401, {
        success: false,
        error: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      }, origin);
    }
    const body = JSON.parse(event.body || "{}");
    if (!body.currentPassword || !body.newPassword) {
      return respond(400, {
        success: false,
        error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694."
      }, origin);
    }
    if (body.newPassword.length < 8) {
      return respond(400, {
        success: false,
        error: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."
      }, origin);
    }
    if (body.currentPassword === body.newPassword) {
      return respond(400, {
        success: false,
        error: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uAC19\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    await cognitoClient.send(new import_client_cognito_identity_provider.ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: body.currentPassword,
      ProposedPassword: body.newPassword
    }));
    return respond(200, {
      success: true,
      message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    }, origin);
  } catch (err) {
    console.error("[ChangePassword] Error:", err.name, err.message);
    if (err.name === "NotAuthorizedException") {
      return respond(400, {
        success: false,
        error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, origin);
    }
    if (err.name === "InvalidPasswordException") {
      return respond(400, {
        success: false,
        error: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uBCF4\uC548 \uC694\uAD6C\uC0AC\uD56D\uC744 \uCDA9\uC871\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. (8\uC790 \uC774\uC0C1, \uB300/\uC18C\uBB38\uC790, \uC22B\uC790 \uD3EC\uD568)"
      }, origin);
    }
    if (err.name === "LimitExceededException") {
      return respond(429, {
        success: false,
        error: "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC2DC\uB3C4 \uD69F\uC218\uB97C \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      }, origin);
    }
    if (err.name === "TooManyRequestsException") {
      return respond(429, {
        success: false,
        error: "\uB108\uBB34 \uB9CE\uC740 \uC694\uCCAD\uC774 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      }, origin);
    }
    return respond(500, {
      success: false,
      error: "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, origin);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=change-password.js.map
