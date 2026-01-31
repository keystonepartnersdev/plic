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

// business-analytics.ts
var business_analytics_exports = {};
__export(business_analytics_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(business_analytics_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient);
var USERS_TABLE = process.env.USERS_TABLE || "plic-users";
var DEALS_TABLE = process.env.DEALS_TABLE || "plic-deals";
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
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }
  try {
    const usersResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: USERS_TABLE
    }));
    const users = usersResult.Items || [];
    const dealsResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: DEALS_TABLE
    }));
    const deals = dealsResult.Items || [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
    const eventsResult = await docClient.send(new import_lib_dynamodb.ScanCommand({
      TableName: EVENTS_TABLE,
      FilterExpression: "#ts >= :start",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: { ":start": thirtyDaysAgo }
    }));
    const events = eventsResult.Items || [];
    const userStatusDistribution = {
      total: users.length,
      pending_verification: users.filter((u) => u.status === "pending_verification").length,
      active: users.filter((u) => u.status === "active").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      pending: users.filter((u) => u.status === "pending").length,
      withdrawn: users.filter((u) => u.status === "withdrawn").length
    };
    const userGradeDistribution = {
      basic: users.filter((u) => u.grade === "basic" && u.status === "active").length,
      platinum: users.filter((u) => u.grade === "platinum" && u.status === "active").length,
      b2b: users.filter((u) => u.grade === "b2b" && u.status === "active").length,
      employee: users.filter((u) => u.grade === "employee" && u.status === "active").length
    };
    const activeUsers = users.filter((u) => u.status === "active");
    const usersWithDeals = new Set(deals.map((d) => d.uid));
    const usersWithPaidDeals = new Set(deals.filter((d) => d.isPaid).map((d) => d.uid));
    const usersWithCompletedDeals = new Set(deals.filter((d) => d.status === "completed").map((d) => d.uid));
    const registrationFunnel = {
      totalSignups: users.length,
      pendingVerification: userStatusDistribution.pending_verification,
      verificationCompleted: activeUsers.length,
      firstDealCreated: usersWithDeals.size,
      firstPaymentCompleted: usersWithPaidDeals.size,
      firstDealCompleted: usersWithCompletedDeals.size
    };
    const registrationConversion = {
      signupToVerification: users.length > 0 ? Math.round(activeUsers.length / users.length * 100) : 0,
      verificationToFirstDeal: activeUsers.length > 0 ? Math.round(usersWithDeals.size / activeUsers.length * 100) : 0,
      firstDealToPayment: usersWithDeals.size > 0 ? Math.round(usersWithPaidDeals.size / usersWithDeals.size * 100) : 0,
      paymentToComplete: usersWithPaidDeals.size > 0 ? Math.round(usersWithCompletedDeals.size / usersWithPaidDeals.size * 100) : 0
    };
    const dealStatusDistribution = {
      total: deals.length,
      awaiting_payment: deals.filter((d) => d.status === "awaiting_payment").length,
      pending: deals.filter((d) => d.status === "pending").length,
      reviewing: deals.filter((d) => d.status === "reviewing").length,
      hold: deals.filter((d) => d.status === "hold").length,
      need_revision: deals.filter((d) => d.status === "need_revision").length,
      completed: deals.filter((d) => d.status === "completed").length,
      cancelled: deals.filter((d) => d.status === "cancelled").length
    };
    const paidDeals = deals.filter((d) => d.isPaid);
    const completedDeals = deals.filter((d) => d.status === "completed");
    const dealConversion = {
      creationToPayment: deals.length > 0 ? Math.round(paidDeals.length / deals.length * 100) : 0,
      paymentToComplete: paidDeals.length > 0 ? Math.round(completedDeals.length / paidDeals.length * 100) : 0,
      overallCompletion: deals.length > 0 ? Math.round(completedDeals.length / deals.length * 100) : 0
    };
    const totalTransactionAmount = completedDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalFeeRevenue = completedDeals.reduce((sum, d) => sum + (d.feeAmount || 0), 0);
    const totalPaymentAmount = paidDeals.reduce((sum, d) => sum + (d.finalAmount || d.totalAmount || 0), 0);
    const revenueMetrics = {
      totalTransactionAmount,
      totalFeeRevenue,
      totalPaymentAmount,
      averageTransactionAmount: completedDeals.length > 0 ? Math.round(totalTransactionAmount / completedDeals.length) : 0,
      averageFeeAmount: completedDeals.length > 0 ? Math.round(totalFeeRevenue / completedDeals.length) : 0,
      completedDealCount: completedDeals.length,
      paidDealCount: paidDeals.length
    };
    const dealTypeMap = {};
    completedDeals.forEach((d) => {
      const type = d.dealType || "unknown";
      if (!dealTypeMap[type]) {
        dealTypeMap[type] = { count: 0, amount: 0 };
      }
      dealTypeMap[type].count++;
      dealTypeMap[type].amount += d.amount || 0;
    });
    const dealTypeAnalysis = Object.entries(dealTypeMap).map(([type, data]) => ({ type, ...data })).sort((a, b) => b.count - a.count);
    const funnelEvents = events.filter((e) => e.eventType === "funnel" && e.funnel);
    const funnelSteps = {};
    funnelEvents.forEach((e) => {
      const step = e.funnel.step;
      funnelSteps[step] = (funnelSteps[step] || 0) + 1;
    });
    const transferFunnel = [
      { step: "transfer_start", name: "\uC1A1\uAE08 \uC2DC\uC791", count: funnelSteps["transfer_start"] || 0 },
      { step: "transfer_info", name: "\uC815\uBCF4 \uC785\uB825", count: funnelSteps["transfer_info"] || 0 },
      { step: "transfer_attachment", name: "\uC99D\uBE59 \uC5C5\uB85C\uB4DC", count: funnelSteps["transfer_attachment"] || 0 },
      { step: "transfer_confirm", name: "\uD655\uC778", count: funnelSteps["transfer_confirm"] || 0 },
      { step: "transfer_complete", name: "\uAC70\uB798 \uC0DD\uC131", count: funnelSteps["transfer_complete"] || 0 }
    ];
    const transferFunnelWithConversion = transferFunnel.map((step, index) => ({
      ...step,
      conversionFromPrev: index === 0 ? 100 : transferFunnel[index - 1].count > 0 ? Math.round(step.count / transferFunnel[index - 1].count * 100) : 0,
      conversionFromStart: transferFunnel[0].count > 0 ? Math.round(step.count / transferFunnel[0].count * 100) : 0
    }));
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1e3);
      last30Days.push(date.toISOString().split("T")[0]);
    }
    const dailySignups = last30Days.map((date) => ({
      date,
      count: users.filter((u) => u.createdAt && u.createdAt.startsWith(date)).length
    }));
    const dailyDeals = last30Days.map((date) => ({
      date,
      count: deals.filter((d) => d.createdAt && d.createdAt.startsWith(date)).length
    }));
    const dailyAmount = last30Days.map((date) => ({
      date,
      amount: completedDeals.filter((d) => d.transferredAt && d.transferredAt.startsWith(date)).reduce((sum, d) => sum + (d.amount || 0), 0)
    }));
    const pendingReviewDeals = deals.filter((d) => ["awaiting_payment", "pending", "reviewing"].includes(d.status)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((d) => ({
      did: d.did,
      dealName: d.dealName,
      amount: d.amount,
      status: d.status,
      isPaid: d.isPaid,
      createdAt: d.createdAt,
      userName: users.find((u) => u.uid === d.uid)?.name || "Unknown"
    }));
    const pendingVerificationUsers = users.filter((u) => u.status === "pending_verification").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((u) => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      businessName: u.businessInfo?.businessName,
      createdAt: u.createdAt
    }));
    return response(200, {
      success: true,
      data: {
        summary: {
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          pendingVerification: userStatusDistribution.pending_verification,
          totalDeals: deals.length,
          completedDeals: completedDeals.length,
          totalTransactionAmount,
          totalFeeRevenue
        },
        userStatusDistribution,
        userGradeDistribution,
        registrationFunnel,
        registrationConversion,
        dealStatusDistribution,
        dealConversion,
        revenueMetrics,
        dealTypeAnalysis,
        transferFunnel: transferFunnelWithConversion,
        trends: {
          dailySignups,
          dailyDeals,
          dailyAmount
        },
        pendingReviewDeals,
        pendingVerificationUsers
      }
    });
  } catch (error) {
    console.error("\uBE44\uC988\uB2C8\uC2A4 \uBD84\uC11D \uC870\uD68C \uC624\uB958:", error);
    return response(500, {
      success: false,
      error: error.message || "\uBE44\uC988\uB2C8\uC2A4 \uBD84\uC11D \uB370\uC774\uD130 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
