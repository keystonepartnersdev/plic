// PUT /admin/users/{uid}/settings - 개별 사용자 수수료율/월한도 수정
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'plic-users';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
};

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

interface UserSettingsRequest {
  feeRate?: number;
  monthlyLimit?: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const uid = event.pathParameters?.uid;

    if (!uid) {
      return response(400, {
        success: false,
        error: '사용자 ID가 필요합니다.',
      });
    }

    if (!event.body) {
      return response(400, {
        success: false,
        error: '요청 본문이 필요합니다.',
      });
    }

    const body: UserSettingsRequest = JSON.parse(event.body);
    const { feeRate, monthlyLimit } = body;

    // 유효성 검증
    if (feeRate !== undefined) {
      if (typeof feeRate !== 'number' || feeRate < 0 || feeRate > 100) {
        return response(400, {
          success: false,
          error: '수수료율은 0~100 사이의 숫자여야 합니다.',
        });
      }
    }

    if (monthlyLimit !== undefined) {
      if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
        return response(400, {
          success: false,
          error: '월 한도는 0 이상의 숫자여야 합니다.',
        });
      }
    }

    if (feeRate === undefined && monthlyLimit === undefined) {
      return response(400, {
        success: false,
        error: '변경할 값(feeRate 또는 monthlyLimit)이 필요합니다.',
      });
    }

    // 기존 사용자 조회
    const getResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { uid },
    }));

    if (!getResult.Item) {
      return response(404, {
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
    }

    const user = getResult.Item;
    const now = new Date().toISOString();

    // 업데이트 표현식 구성
    const updateExpressions: string[] = ['updatedAt = :now'];
    const expressionAttributeValues: Record<string, any> = { ':now': now };

    // 히스토리 기록용 변경사항
    const historyEntries: any[] = [];
    const historyId = `H${Date.now()}`;

    if (feeRate !== undefined && feeRate !== user.feeRate) {
      updateExpressions.push('feeRate = :feeRate');
      expressionAttributeValues[':feeRate'] = feeRate;
      historyEntries.push({
        id: `${historyId}-fee`,
        field: 'feeRate',
        fieldLabel: '수수료율',
        prevValue: `${user.feeRate}%`,
        newValue: `${feeRate}%`,
        actor: 'admin',
        actorLabel: '운영팀',
        timestamp: now,
        memo: `수수료율 변경: ${user.feeRate}% → ${feeRate}%`,
      });
    }

    if (monthlyLimit !== undefined && monthlyLimit !== user.monthlyLimit) {
      updateExpressions.push('monthlyLimit = :monthlyLimit');
      expressionAttributeValues[':monthlyLimit'] = monthlyLimit;
      historyEntries.push({
        id: `${historyId}-limit`,
        field: 'monthlyLimit',
        fieldLabel: '월 한도',
        prevValue: `${(user.monthlyLimit / 10000).toLocaleString()}만원`,
        newValue: `${(monthlyLimit / 10000).toLocaleString()}만원`,
        actor: 'admin',
        actorLabel: '운영팀',
        timestamp: now,
        memo: `월 한도 변경: ${(user.monthlyLimit / 10000).toLocaleString()}만원 → ${(monthlyLimit / 10000).toLocaleString()}만원`,
      });
    }

    // 히스토리 추가
    if (historyEntries.length > 0) {
      const existingHistory = user.history || [];
      const newHistory = [...historyEntries, ...existingHistory];
      updateExpressions.push('history = :history');
      expressionAttributeValues[':history'] = newHistory;
    }

    if (updateExpressions.length <= 1) {
      // updatedAt만 있으면 변경사항 없음
      return response(200, {
        success: true,
        message: '변경사항이 없습니다.',
        data: { uid },
      });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { uid },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return response(200, {
      success: true,
      message: '사용자 설정이 업데이트되었습니다.',
      data: {
        uid,
        feeRate: feeRate ?? user.feeRate,
        monthlyLimit: monthlyLimit ?? user.monthlyLimit,
      },
    });
  } catch (error: any) {
    console.error('사용자 설정 업데이트 오류:', error);
    return response(500, {
      success: false,
      error: error.message || '사용자 설정 업데이트 중 오류가 발생했습니다.',
    });
  }
};
