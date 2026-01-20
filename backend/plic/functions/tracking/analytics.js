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

// analytics.ts
var analytics_exports = {};
__export(analytics_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(analytics_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var EVENTS_TABLE = process.env.EVENTS_TABLE || "plic-events";
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
var getDateRange = (range) => {
  const now = /* @__PURE__ */ new Date();
  const end = now.toISOString();
  let start;
  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
      break;
    case "month":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
  }
  return { start: start.toISOString(), end };
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const queryParams = event.queryStringParameters || {};
    const range = queryParams.range || "week";
    const { start, end } = getDateRange(range);
    const result = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: EVENTS_TABLE,
      FilterExpression: "#ts BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: { ":start": start, ":end": end }
    }));
    const events = result.Items || [];
    const stats = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map((e) => e.sessionId)).size,
      uniqueUsers: new Set(events.filter((e) => e.userId).map((e) => e.userId)).size,
      uniqueAnonymous: new Set(events.map((e) => e.anonymousId)).size
    };
    const eventTypeCounts = {};
    events.forEach((e) => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });
    const pageViews = {};
    events.filter((e) => e.eventType === "pageview" && e.page?.path).forEach((e) => {
      pageViews[e.page.path] = (pageViews[e.page.path] || 0) + 1;
    });
    const topPages = Object.entries(pageViews).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));
    const funnelEvents = events.filter((e) => e.eventType === "funnel" && e.funnel);
    const funnelSteps = {};
    funnelEvents.forEach((e) => {
      const step = e.funnel.step;
      funnelSteps[step] = (funnelSteps[step] || 0) + 1;
    });
    const transferFunnel = [
      { step: "start", name: "\uC1A1\uAE08 \uC2DC\uC791", count: funnelSteps["transfer_start"] || 0 },
      { step: "info", name: "\uC815\uBCF4 \uC785\uB825", count: funnelSteps["transfer_info"] || 0 },
      { step: "attachment", name: "\uC99D\uBE59 \uC5C5\uB85C\uB4DC", count: funnelSteps["transfer_attachment"] || 0 },
      { step: "confirm", name: "\uD655\uC778", count: funnelSteps["transfer_confirm"] || 0 },
      { step: "complete", name: "\uC644\uB8CC", count: funnelSteps["transfer_complete"] || 0 }
    ];
    const errors = events.filter((e) => e.eventType === "error");
    const errorSummary = errors.slice(0, 20).map((e) => ({
      message: e.error?.message,
      page: e.page?.path,
      timestamp: e.timestamp,
      count: 1
    }));
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    events.filter((e) => e.device).forEach((e) => {
      const ua = e.device.userAgent?.toLowerCase() || "";
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        if (ua.includes("tablet") || ua.includes("ipad")) {
          devices.tablet++;
        } else {
          devices.mobile++;
        }
      } else {
        devices.desktop++;
      }
    });
    const dailyEvents = {};
    events.forEach((e) => {
      const date = e.timestamp.split("T")[0];
      dailyEvents[date] = (dailyEvents[date] || 0) + 1;
    });
    const dailyTrend = Object.entries(dailyEvents).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
    const dailySessions = {};
    events.forEach((e) => {
      const date = e.timestamp.split("T")[0];
      if (!dailySessions[date]) dailySessions[date] = /* @__PURE__ */ new Set();
      dailySessions[date].add(e.sessionId);
    });
    const sessionTrend = Object.entries(dailySessions).sort((a, b) => a[0].localeCompare(b[0])).map(([date, sessions]) => ({ date, count: sessions.size }));
    const perfEvents = events.filter((e) => e.eventType === "performance" && e.performance);
    const avgPerformance = perfEvents.length > 0 ? {
      avgLoadTime: Math.round(perfEvents.reduce((sum, e) => sum + (e.performance.loadTime || 0), 0) / perfEvents.length),
      avgDomReady: Math.round(perfEvents.reduce((sum, e) => sum + (e.performance.domReady || 0), 0) / perfEvents.length)
    } : null;
    const recentEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map((e) => ({
      eventId: e.eventId,
      eventType: e.eventType,
      eventName: e.eventName,
      sessionId: e.sessionId,
      anonymousId: e.anonymousId,
      userId: e.userId,
      timestamp: e.timestamp,
      page: e.page,
      funnel: e.funnel,
      click: e.click,
      device: e.device ? {
        userAgent: e.device.userAgent?.substring(0, 100),
        screenWidth: e.device.screenWidth,
        screenHeight: e.device.screenHeight
      } : null,
      custom: e.custom
    }));
    return response(200, {
      success: true,
      data: {
        range,
        period: { start, end },
        stats,
        eventTypeCounts,
        topPages,
        transferFunnel,
        errors: errorSummary,
        devices,
        dailyTrend,
        sessionTrend,
        performance: avgPerformance,
        recentEvents
      }
    });
  } catch (error) {
    console.error("\uBD84\uC11D \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uBD84\uC11D \uB370\uC774\uD130 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
