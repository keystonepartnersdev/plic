var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// KakaoLoginFunction/kakao-login.ts
var kakao_login_exports = {};
__export(kakao_login_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(kakao_login_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var crypto = __toESM(require("crypto"));
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
var USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || "";
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var KAKAO_SECRET = process.env.KAKAO_AUTH_SECRET || "plic-kakao-secret-key-2024";
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
function generateKakaoPassword(kakaoId) {
  const hash = crypto.createHmac("sha256", KAKAO_SECRET).update(String(kakaoId)).digest("hex");
  return `Kk${hash.substring(0, 20)}!1`;
}
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    if (!event.body) {
      return response(400, {
        success: false,
        error: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const body = JSON.parse(event.body);
    const { email, kakaoId } = body;
    if (!email || !kakaoId) {
      return response(400, {
        success: false,
        error: "\uC774\uBA54\uC77C\uACFC \uCE74\uCE74\uC624 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const queryResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email }
    }));
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(200, {
        success: true,
        exists: false,
        message: "\uB4F1\uB85D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4."
      });
    }
    const user = queryResult.Items[0];
    const isFullyRegistered = user.isVerified === true && user.agreements?.service === true && user.agreements?.privacy === true && user.agreements?.thirdParty === true && user.status !== "withdrawn";
    if (!isFullyRegistered) {
      return response(200, {
        success: true,
        exists: false,
        // 완전히 가입되지 않았으므로 새 가입 취급
        incomplete: true,
        message: "\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC740 \uACC4\uC815\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uAC00\uC785\uD574\uC8FC\uC138\uC694."
      });
    }
    if (user.kakaoId && String(user.kakaoId) !== String(kakaoId)) {
      return response(401, {
        success: false,
        error: "\uCE74\uCE74\uC624 \uACC4\uC815\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      });
    }
    if (!user.kakaoId) {
      await docClient.send(new import_lib_dynamodb.UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid: user.uid },
        UpdateExpression: "SET kakaoId = :kakaoId, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":kakaoId": kakaoId,
          ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
    }
    const kakaoPassword = generateKakaoPassword(kakaoId);
    try {
      await cognitoClient.send(new import_client_cognito_identity_provider.AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: kakaoPassword,
        Permanent: true
      }));
    } catch (pwError) {
      console.error("\uBE44\uBC00\uBC88\uD638 \uC124\uC815 \uC2E4\uD328:", pwError);
    }
    try {
      const authResult = await cognitoClient.send(new import_client_cognito_identity_provider.AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: kakaoPassword
        }
      }));
      if (!authResult.AuthenticationResult) {
        return response(401, {
          success: false,
          error: "\uC778\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        });
      }
      return response(200, {
        success: true,
        exists: true,
        autoLogin: true,
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            name: user.name,
            phone: user.phone,
            userType: user.userType,
            status: user.status,
            grade: user.grade,
            feeRate: user.feeRate,
            businessInfo: user.businessInfo,
            agreements: user.agreements
          },
          tokens: {
            accessToken: authResult.AuthenticationResult.AccessToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
            idToken: authResult.AuthenticationResult.IdToken,
            expiresIn: authResult.AuthenticationResult.ExpiresIn
          }
        }
      });
    } catch (authError) {
      console.error("Cognito \uC778\uC99D \uC2E4\uD328:", authError);
      if (authError.name === "UserNotConfirmedException") {
        return response(200, {
          success: true,
          exists: false,
          incomplete: true,
          message: "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
        });
      }
      return response(401, {
        success: false,
        error: "\uCE74\uCE74\uC624 \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  } catch (error) {
    console.error("\uCE74\uCE74\uC624 \uB85C\uADF8\uC778 \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=kakao-login.js.map
