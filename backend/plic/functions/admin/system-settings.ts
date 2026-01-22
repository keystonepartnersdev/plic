// backend/plic/functions/admin/system-settings.ts
// GET/PUT /admin/settings - 시스템 설정 관리 (어드민용)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SETTINGS_TABLE = process.env.SETTINGS_TABLE || 'plic-settings';
const SETTINGS_KEY = 'SYSTEM_SETTINGS';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// 기본 시스템 설정
const defaultSettings = {
  gradeSettings: {
    basic: { feeRate: 4.0, monthlyLimit: 10000000 },
    platinum: { feeRate: 3.5, monthlyLimit: 30000000 },
    b2b: { feeRate: 3.0, monthlyLimit: 100000000 },
    employee: { feeRate: 1.0, monthlyLimit: 100000000 },
  },
  gradeCriteria: {
    platinumThreshold: 10000000,
    basicThreshold: 5000000,
  },
  maintenanceMode: false,
  maintenanceMessage: '시스템 점검 중입니다. 잠시 후 다시 이용해주세요.',
  autoApprovalEnabled: false,
  autoApprovalThreshold: 100000,
  emailNotificationEnabled: true,
  smsNotificationEnabled: false,
  slackWebhookUrl: '',
  sessionTimeout: 480,
  maxLoginAttempts: 5,
  passwordExpiryDays: 90,
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // TODO: 어드민 권한 체크 (현재는 API Gateway에서 인증 처리 가정)
  // 실제 운영 환경에서는 Authorization 헤더를 검증해야 함

  try {
    if (event.httpMethod === 'GET') {
      // 시스템 설정 조회
      const result = await docClient.send(new GetCommand({
        TableName: SETTINGS_TABLE,
        Key: { settingId: SETTINGS_KEY },
      }));

      if (!result.Item) {
        // 설정이 없으면 기본값 반환
        return response(200, {
          success: true,
          data: {
            settings: defaultSettings,
          },
        });
      }

      const { settingId, ...settings } = result.Item;

      return response(200, {
        success: true,
        data: {
          settings: {
            ...defaultSettings,
            ...settings,
          },
        },
      });

    } else if (event.httpMethod === 'PUT') {
      // 시스템 설정 업데이트
      const body = JSON.parse(event.body || '{}');
      const { settings } = body;

      if (!settings) {
        return response(400, { success: false, error: '설정 데이터가 필요합니다.' });
      }

      const now = new Date().toISOString();

      // 기존 설정과 병합
      const existingResult = await docClient.send(new GetCommand({
        TableName: SETTINGS_TABLE,
        Key: { settingId: SETTINGS_KEY },
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
          ...(existingSettings.gradeSettings || {}),
          ...(settings.gradeSettings || {}),
        },
        // gradeCriteria 깊은 병합
        gradeCriteria: {
          ...defaultSettings.gradeCriteria,
          ...(existingSettings.gradeCriteria || {}),
          ...(settings.gradeCriteria || {}),
        },
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: SETTINGS_TABLE,
        Item: updatedSettings,
      }));

      const { settingId, ...returnSettings } = updatedSettings;

      return response(200, {
        success: true,
        message: '시스템 설정이 저장되었습니다.',
        data: {
          settings: returnSettings,
        },
      });
    }

    return response(405, { success: false, error: '허용되지 않는 메서드입니다.' });

  } catch (error: any) {
    console.error('System settings API error:', error);
    return response(500, {
      success: false,
      error: error.message || '시스템 설정 처리 중 오류가 발생했습니다.',
    });
  }
};
