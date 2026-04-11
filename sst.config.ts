/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "plic",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "ap-northeast-2",
        },
      },
    };
  },
  async run() {
    const isProd = $app.stage === "production";

    const site = new sst.aws.Nextjs("PlicWeb", {
      domain: isProd
        ? {
            name: "plic.kr",
            aliases: ["www.plic.kr"],
            dns: sst.aws.dns({ zone: "Z09068573RFHOTHCYKX20" }),
          }
        : undefined,
      environment: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "",
        NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY: process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || "",
        NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "plic-attachments-804887692492",
        NEXT_PUBLIC_AWS_REGION: "ap-northeast-2",
        AWS_LAMBDA_URL: process.env.AWS_LAMBDA_URL || "https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod",
        COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "",
        KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY || "",
        KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET || "",
        KAKAO_ADMIN_KEY: process.env.KAKAO_ADMIN_KEY || "",
        SOFTPAYMENT_PAY_KEY: process.env.SOFTPAYMENT_PAY_KEY || "",
        SOFTPAYMENT_API_URL: process.env.SOFTPAYMENT_API_URL || "",
        SOFTPAYMENT_TEST_PAY_KEY: process.env.SOFTPAYMENT_TEST_PAY_KEY || "",
        POPBILL_LINK_ID: process.env.POPBILL_LINK_ID || "",
        POPBILL_SECRET_KEY: process.env.POPBILL_SECRET_KEY || "",
        POPBILL_IS_TEST: process.env.POPBILL_IS_TEST || "",
        POPBILL_CORP_NUM: process.env.POPBILL_CORP_NUM || "",
        POPBILL_USER_ID: process.env.POPBILL_USER_ID || "",
        SES_SENDER_EMAIL: process.env.SES_SENDER_EMAIL || "",
        NTS_SERVICE_KEY: process.env.NTS_SERVICE_KEY || "",
        GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION || "",
        NAVER_SITE_VERIFICATION: process.env.NAVER_SITE_VERIFICATION || "",
        CONTENTS_TABLE: process.env.CONTENTS_TABLE || "plic-contents",
        USERS_TABLE: process.env.USERS_TABLE || "plic-users",
        DEALS_TABLE: process.env.DEALS_TABLE || "plic-deals",
      },
    });

    return {
      url: site.url,
    };
  },
});
