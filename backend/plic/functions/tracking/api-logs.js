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

// api-logs.ts
var api_logs_exports = {};
__export(api_logs_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(api_logs_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var API_LOGS_TABLE = process.env.API_LOGS_TABLE || "plic-api-logs";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};
var response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var ENDPOINT_CATEGORIES = {
  "auth": ["/auth/login", "/auth/signup", "/auth/confirm", "/auth/refresh", "/auth/logout"],
  "deal": ["/deals", "/deals/"],
  "user": ["/users/me", "/users/me/grade"],
  "payment": ["/payments", "/softpayment"],
  "content": ["/content/banners", "/content/notices", "/content/faqs"],
  "admin": ["/admin/"]
};
var getEndpointCategory = (endpoint) => {
  for (const [category, patterns] of Object.entries(ENDPOINT_CATEGORIES)) {
    if (patterns.some((p) => endpoint.includes(p) || endpoint.startsWith(p))) {
      return category;
    }
  }
  return "other";
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const queryParams = event.queryStringParameters || {};
    const { logId, correlationId, status, limit = "200" } = queryParams;
    if (logId) {
      const result2 = await docClient.send(new import_lib_dynamodb.GetCommand({
        TableName: API_LOGS_TABLE,
        Key: { logId }
      }));
      if (!result2.Item) {
        return response(404, { success: false, error: "\uB85C\uADF8\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      return response(200, { success: true, data: { log: result2.Item } });
    }
    let filterExpression;
    let expressionValues = {};
    if (status === "error") {
      filterExpression = "statusCode >= :errorCode";
      expressionValues[":errorCode"] = 400;
    } else if (status === "slow") {
      filterExpression = "executionTime > :slowTime";
      expressionValues[":slowTime"] = 3e3;
    }
    if (correlationId) {
      filterExpression = filterExpression ? `${filterExpression} AND correlationId = :cid` : "correlationId = :cid";
      expressionValues[":cid"] = correlationId;
    }
    const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: API_LOGS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: Object.keys(expressionValues).length > 0 ? expressionValues : void 0,
      Limit: parseInt(limit, 10) + 500
      // 통계용으로 더 많이 가져옴
    }));
    const allLogs = result.Items || [];
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const stats = {
      total: allLogs.length,
      success: allLogs.filter((l) => l.statusCode > 0 && l.statusCode < 400).length,
      clientError: allLogs.filter((l) => l.statusCode >= 400 && l.statusCode < 500).length,
      serverError: allLogs.filter((l) => l.statusCode >= 500).length,
      networkError: allLogs.filter((l) => l.statusCode === 0).length,
      avgExecutionTime: allLogs.length > 0 ? Math.round(allLogs.reduce((sum, l) => sum + (l.executionTime || 0), 0) / allLogs.length) : 0,
      successRate: allLogs.length > 0 ? Math.round(allLogs.filter((l) => l.statusCode > 0 && l.statusCode < 400).length / allLogs.length * 100) : 100
    };
    const categoryStats = {};
    for (const category of Object.keys(ENDPOINT_CATEGORIES)) {
      const categoryLogs = allLogs.filter((l) => getEndpointCategory(l.endpoint) === category);
      if (categoryLogs.length > 0) {
        const successCount = categoryLogs.filter((l) => l.statusCode > 0 && l.statusCode < 400).length;
        categoryStats[category] = {
          total: categoryLogs.length,
          success: successCount,
          error: categoryLogs.length - successCount,
          avgTime: Math.round(categoryLogs.reduce((sum, l) => sum + (l.executionTime || 0), 0) / categoryLogs.length),
          successRate: Math.round(successCount / categoryLogs.length * 100)
        };
      }
    }
    const endpointErrors = {};
    allLogs.filter((l) => l.statusCode >= 400 || l.statusCode === 0).forEach((l) => {
      const endpoint = l.endpoint || "unknown";
      if (!endpointErrors[endpoint]) {
        endpointErrors[endpoint] = { count: 0, lastError: "", lastTime: "" };
      }
      endpointErrors[endpoint].count++;
      if (!endpointErrors[endpoint].lastTime || l.timestamp > endpointErrors[endpoint].lastTime) {
        endpointErrors[endpoint].lastError = l.errorMessage || `HTTP ${l.statusCode}`;
        endpointErrors[endpoint].lastTime = l.timestamp;
      }
    });
    const topErrors = Object.entries(endpointErrors).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      lastError: data.lastError,
      lastTime: data.lastTime
    }));
    const slowRequests = allLogs.filter((l) => l.executionTime > 2e3).slice(0, 10).map((l) => ({
      endpoint: l.endpoint,
      method: l.method,
      executionTime: l.executionTime,
      timestamp: l.timestamp,
      userId: l.userId
    }));
    const recentErrors = allLogs.filter((l) => l.statusCode >= 400 || l.statusCode === 0).slice(0, 20).map((l) => ({
      logId: l.logId,
      correlationId: l.correlationId,
      endpoint: l.endpoint,
      method: l.method,
      statusCode: l.statusCode,
      errorMessage: l.errorMessage,
      executionTime: l.executionTime,
      timestamp: l.timestamp,
      userId: l.userId
    }));
    const now = Date.now();
    const hourlyStats = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1e3);
      const hourEnd = new Date(now - (i - 1) * 60 * 60 * 1e3);
      const hourLabel = hourStart.toISOString().slice(0, 13) + ":00";
      const hourLogs = allLogs.filter((l) => {
        const logTime = new Date(l.timestamp).getTime();
        return logTime >= hourStart.getTime() && logTime < hourEnd.getTime();
      });
      hourlyStats.push({
        hour: hourLabel,
        total: hourLogs.length,
        errors: hourLogs.filter((l) => l.statusCode >= 400 || l.statusCode === 0).length
      });
    }
    const userErrors = {};
    allLogs.filter((l) => l.statusCode >= 400 && l.userId && l.userId !== "admin").forEach((l) => {
      userErrors[l.userId] = (userErrors[l.userId] || 0) + 1;
    });
    const usersWithMostErrors = Object.entries(userErrors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([userId, errorCount]) => ({ userId, errorCount }));
    const methodDistribution = {};
    allLogs.forEach((l) => {
      methodDistribution[l.method] = (methodDistribution[l.method] || 0) + 1;
    });
    const endpointCounts = {};
    allLogs.forEach((l) => {
      const baseEndpoint = l.endpoint?.split("?")[0] || "unknown";
      const normalizedEndpoint = baseEndpoint.replace(/\/[a-zA-Z0-9-]{20,}/g, "/{id}");
      endpointCounts[normalizedEndpoint] = (endpointCounts[normalizedEndpoint] || 0) + 1;
    });
    const topEndpoints = Object.entries(endpointCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([endpoint, count]) => ({ endpoint, count }));
    return response(200, {
      success: true,
      data: {
        // 기본 통계
        stats,
        // PLIC 카테고리별 분석
        categoryStats,
        // 에러 분석
        topErrors,
        recentErrors,
        // 성능 분석
        slowRequests,
        // 트렌드
        hourlyStats,
        // 사용자 분석
        usersWithMostErrors,
        // 분포
        methodDistribution,
        topEndpoints,
        // 상세 로그 (최근 것만)
        logs: allLogs.slice(0, parseInt(limit, 10)),
        hasMore: allLogs.length > parseInt(limit, 10)
      }
    });
  } catch (error) {
    console.error("API \uB85C\uADF8 \uC870\uD68C \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "API \uB85C\uADF8 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
