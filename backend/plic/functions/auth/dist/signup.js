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

// signup.ts
var signup_exports = {};
__export(signup_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(signup_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist-node/rng.js
var import_node_crypto = require("node:crypto");
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    (0, import_node_crypto.randomFillSync)(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist-node/native.js
var import_node_crypto2 = require("node:crypto");
var native_default = { randomUUID: import_node_crypto2.randomUUID };

// node_modules/uuid/dist-node/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
var v4_default = v4;

// signup.ts
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
var USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || "";
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
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
    if (!event.body) {
      return response(400, {
        success: false,
        error: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
      });
    }
    const body = JSON.parse(event.body);
    const { email, password, name, phone, userType, businessInfo, agreements, kakaoVerified, kakaoId } = body;
    if (!email || !password || !name || !phone) {
      return response(400, {
        success: false,
        error: "\uD544\uC218 \uD544\uB4DC\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4: email, password, name, phone"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response(400, {
        success: false,
        error: "\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4."
      });
    }
    if (password.length < 8) {
      return response(400, {
        success: false,
        error: "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4."
      });
    }
    if (!agreements?.service || !agreements?.privacy || !agreements?.thirdParty) {
      return response(400, {
        success: false,
        error: "\uD544\uC218 \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD574\uC8FC\uC138\uC694."
      });
    }
    if (userType === "business") {
      if (!businessInfo?.businessName || !businessInfo?.businessNumber || !businessInfo?.representativeName) {
        return response(400, {
          success: false,
          error: "\uC0AC\uC5C5\uC790 \uC815\uBCF4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4: businessName, businessNumber, representativeName"
        });
      }
      const cleanBusinessNumber = businessInfo.businessNumber.replace(/-/g, "");
      if (!/^\d{10}$/.test(cleanBusinessNumber)) {
        return response(400, {
          success: false,
          error: "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638\uB294 10\uC790\uB9AC \uC22B\uC790\uC5EC\uC57C \uD569\uB2C8\uB2E4."
        });
      }
    }
    const uid = v4_default();
    try {
      const signUpCommand = new import_client_cognito_identity_provider.SignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
          { Name: "phone_number", Value: `+82${phone.slice(1)}` },
          // 국제 형식으로 변환
          { Name: "custom:uid", Value: uid },
          { Name: "custom:userType", Value: userType || "personal" }
        ]
      });
      await cognitoClient.send(signUpCommand);
    } catch (cognitoError) {
      if (cognitoError.name === "UsernameExistsException") {
        try {
          const getUserResult = await cognitoClient.send(new import_client_cognito_identity_provider.AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email
          }));
          if (getUserResult.UserStatus === "UNCONFIRMED") {
            console.log(`[Signup] \uBBF8\uC644\uB8CC \uACC4\uC815 \uC0AD\uC81C: ${email}`);
            await cognitoClient.send(new import_client_cognito_identity_provider.AdminDeleteUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: email
            }));
            try {
              const queryResult = await docClient.send(new import_lib_dynamodb.QueryCommand({
                TableName: USERS_TABLE,
                IndexName: "email-index",
                KeyConditionExpression: "email = :email",
                ExpressionAttributeValues: { ":email": email }
              }));
              if (queryResult.Items && queryResult.Items.length > 0) {
                await docClient.send(new import_lib_dynamodb.DeleteCommand({
                  TableName: USERS_TABLE,
                  Key: { uid: queryResult.Items[0].uid }
                }));
              }
            } catch (dbError) {
              console.error("[Signup] DynamoDB \uC0AD\uC81C \uC2E4\uD328 (\uBB34\uC2DC):", dbError);
            }
            const retrySignUpCommand = new import_client_cognito_identity_provider.SignUpCommand({
              ClientId: USER_POOL_CLIENT_ID,
              Username: email,
              Password: password,
              UserAttributes: [
                { Name: "email", Value: email },
                { Name: "name", Value: name },
                { Name: "phone_number", Value: `+82${phone.slice(1)}` },
                { Name: "custom:uid", Value: uid },
                { Name: "custom:userType", Value: userType || "personal" }
              ]
            });
            await cognitoClient.send(retrySignUpCommand);
          } else {
            return response(409, {
              success: false,
              error: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4."
            });
          }
        } catch (adminError) {
          console.error("[Signup] \uBBF8\uC644\uB8CC \uACC4\uC815 \uCC98\uB9AC \uC2E4\uD328:", adminError);
          return response(409, {
            success: false,
            error: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4."
          });
        }
      } else if (cognitoError.name === "InvalidPasswordException") {
        return response(400, {
          success: false,
          error: "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uBA70, \uB300\uBB38\uC790, \uC18C\uBB38\uC790, \uC22B\uC790, \uD2B9\uC218\uBB38\uC790\uB97C \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4."
        });
      } else if (cognitoError.name === "InvalidParameterException") {
        return response(400, {
          success: false,
          error: cognitoError.message || "\uC785\uB825\uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
        });
      } else {
        throw cognitoError;
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userItem = {
      uid,
      email,
      name,
      phone,
      userType: userType || "personal",
      authType: kakaoVerified ? "kakao" : "direct",
      socialProvider: kakaoVerified ? "kakao" : "none",
      kakaoId: kakaoId || null,
      isVerified: false,
      status: "pending",
      grade: "basic",
      feeRate: 2.5,
      isGradeManual: false,
      monthlyLimit: 5e6,
      usedAmount: 0,
      agreements: {
        service: agreements.service,
        privacy: agreements.privacy,
        thirdParty: agreements.thirdParty,
        marketing: agreements.marketing || false
      },
      totalPaymentAmount: 0,
      totalDealCount: 0,
      lastMonthPaymentAmount: 0,
      history: [],
      createdAt: now,
      updatedAt: now
    };
    if (userType === "business" && businessInfo) {
      userItem.businessInfo = {
        businessName: businessInfo.businessName,
        businessNumber: businessInfo.businessNumber.replace(/-/g, ""),
        representativeName: businessInfo.representativeName,
        businessLicenseKey: businessInfo.businessLicenseKey || null,
        verificationStatus: "pending",
        verificationMemo: null,
        verifiedAt: null
      };
    }
    if (kakaoVerified && kakaoId) {
      try {
        await cognitoClient.send(new import_client_cognito_identity_provider.AdminConfirmSignUpCommand({
          UserPoolId: USER_POOL_ID,
          Username: email
        }));
        console.log(`[Signup] \uCE74\uCE74\uC624 \uC0AC\uC6A9\uC790 \uC790\uB3D9 \uD655\uC778 \uC644\uB8CC: ${email}`);
        userItem.isVerified = true;
        userItem.status = "active";
      } catch (confirmError) {
        console.error("[Signup] \uCE74\uCE74\uC624 \uC0AC\uC6A9\uC790 \uC790\uB3D9 \uD655\uC778 \uC2E4\uD328:", confirmError);
      }
    }
    await docClient.send(new import_lib_dynamodb.PutCommand({
      TableName: USERS_TABLE,
      Item: userItem
    }));
    const successMessage = kakaoVerified ? "\uD68C\uC6D0\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB85C \uB85C\uADF8\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." : "\uD68C\uC6D0\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uBA54\uC77C\uB85C \uC804\uC1A1\uB41C \uC778\uC99D\uCF54\uB4DC\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.";
    return response(200, {
      success: true,
      data: {
        message: successMessage,
        uid,
        autoConfirmed: kakaoVerified || false
      }
    });
  } catch (error) {
    console.error("\uD68C\uC6D0\uAC00\uC785 \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uD68C\uC6D0\uAC00\uC785 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
