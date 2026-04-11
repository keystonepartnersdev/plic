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

// refresh.ts
var refresh_exports = {};
__export(refresh_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(refresh_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || process.env.USER_POOL_CLIENT_ID || "";
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
    const body = JSON.parse(event.body || "{}");
    if (!body.refreshToken) {
      return respond(400, {
        success: false,
        error: "refreshToken\uC740 \uD544\uC218\uC785\uB2C8\uB2E4."
      }, origin);
    }
    const result = await cognitoClient.send(new import_client_cognito_identity_provider.InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: body.refreshToken
      }
    }));
    return respond(200, {
      accessToken: result.AuthenticationResult?.AccessToken,
      idToken: result.AuthenticationResult?.IdToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn
    }, origin);
  } catch (err) {
    console.error("[Refresh] Error:", err.name, err.message);
    if (err.name === "NotAuthorizedException") {
      return respond(401, {
        success: false,
        error: "\uD1A0\uD070\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694."
      }, origin);
    }
    if (err.name === "ResourceNotFoundException") {
      console.error("[Refresh] Cognito \uB9AC\uC18C\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. CLIENT_ID:", COGNITO_CLIENT_ID);
      return respond(500, {
        success: false,
        error: "\uC778\uC99D \uC11C\uBE44\uC2A4 \uC124\uC815 \uC624\uB958\uC785\uB2C8\uB2E4."
      }, origin);
    }
    return respond(500, {
      success: false,
      error: "\uD1A0\uD070 \uAC31\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    }, origin);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=refresh.js.map
