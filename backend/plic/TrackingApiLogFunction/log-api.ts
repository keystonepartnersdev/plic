// backend/functions/tracking/log-api.ts
// POST /tracking/api-log - API 호출 로그 기록 (프론트엔드 또는 백엔드에서 호출)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const API_LOGS_TABLE = process.env.API_LOGS_TABLE || 'plic-api-logs';
const TTL_DAYS = 30;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Correlation-ID',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

const generateLogId = () => `LOG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// 민감 정보 마스킹
const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'idToken', 'secret', 'apiKey', 'Authorization'];

const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  if (typeof data === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
};

interface ApiLogEntry {
  correlationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string;
  errorStack?: string;
  executionTime: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  level: 'INFO' | 'WARN' | 'ERROR';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const logs: ApiLogEntry[] = Array.isArray(body.logs) ? body.logs : [body];

    if (logs.length === 0) {
      return response(400, { success: false, error: '로그가 없습니다.' });
    }

    const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

    // 배치 처리
    const batches: any[][] = [];
    for (let i = 0; i < logs.length; i += 25) {
      const batch = logs.slice(i, i + 25).map((log) => {
        // 로그 레벨 자동 결정
        let level: 'INFO' | 'WARN' | 'ERROR' = log.level || 'INFO';
        if (log.statusCode >= 500) level = 'ERROR';
        else if (log.statusCode >= 400) level = 'WARN';
        else if (log.executionTime > 3000) level = 'WARN';

        return {
          PutRequest: {
            Item: {
              logId: generateLogId(),
              correlationId: log.correlationId,
              endpoint: log.endpoint,
              method: log.method,
              statusCode: log.statusCode,
              requestBody: maskSensitiveData(log.requestBody),
              responseBody: log.statusCode >= 400 ? maskSensitiveData(log.responseBody) : null, // 에러만 응답 저장
              errorMessage: log.errorMessage,
              errorStack: log.errorStack,
              executionTime: log.executionTime,
              timestamp: log.timestamp || new Date().toISOString(),
              userId: log.userId,
              userAgent: log.userAgent,
              ip: log.ip,
              level,
              ttl,
              createdAt: new Date().toISOString(),
            },
          },
        };
      });
      batches.push(batch);
    }

    // 모든 배치 실행
    for (const batch of batches) {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [API_LOGS_TABLE]: batch,
        },
      }));
    }

    return response(200, {
      success: true,
      processed: logs.length,
    });

  } catch (error: any) {
    console.error('API 로그 기록 오류:', error);
    return response(500, {
      success: false,
      error: error.message || 'API 로그 기록 중 오류가 발생했습니다.',
    });
  }
};
