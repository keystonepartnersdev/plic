// backend/functions/admin/admins-manage.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ADMINS_TABLE = process.env.ADMINS_TABLE || 'plic-admins';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// ID 생성
const generateAdminId = () => `ADM${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const adminId = event.pathParameters?.adminId;
  const method = event.httpMethod;

  try {
    // GET /admin/admins - 목록 조회
    if (method === 'GET' && !adminId) {
      const result = await docClient.send(new ScanCommand({
        TableName: ADMINS_TABLE,
      }));

      const admins = (result.Items || []).map(admin => {
        const { password, passwordHash, ...safeAdmin } = admin;
        return safeAdmin;
      });

      return response(200, {
        success: true,
        data: {
          admins,
          count: admins.length,
        },
      });
    }

    // GET /admin/admins/{adminId} - 상세 조회
    if (method === 'GET' && adminId) {
      const result = await docClient.send(new GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
      }));

      if (!result.Item) {
        return response(404, {
          success: false,
          error: '관리자를 찾을 수 없습니다.',
        });
      }

      const { password, ...safeAdmin } = result.Item;

      return response(200, {
        success: true,
        data: { admin: safeAdmin },
      });
    }

    // POST /admin/admins - 생성
    if (method === 'POST' && !adminId) {
      const body = JSON.parse(event.body || '{}');
      const { email, name, phone, role, password } = body;

      if (!email || !name || !role || !password) {
        return response(400, {
          success: false,
          error: '필수 항목이 누락되었습니다.',
        });
      }

      // 이메일 중복 체크
      const existingResult = await docClient.send(new ScanCommand({
        TableName: ADMINS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
      }));

      if (existingResult.Items && existingResult.Items.length > 0) {
        return response(400, {
          success: false,
          error: '이미 존재하는 이메일입니다.',
        });
      }

      const now = new Date().toISOString();
      const newAdmin = {
        adminId: generateAdminId(),
        email,
        name,
        phone: phone || '',
        role,
        password,
        status: 'active',
        isMaster: false,
        loginFailCount: 0,
        isLocked: false,
        createdAt: now,
        createdBy: 'admin',
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: ADMINS_TABLE,
        Item: newAdmin,
      }));

      const { password: _, ...safeAdmin } = newAdmin;

      return response(201, {
        success: true,
        data: {
          message: '관리자가 생성되었습니다.',
          admin: safeAdmin,
        },
      });
    }

    // PUT /admin/admins/{adminId} - 수정
    if (method === 'PUT' && adminId) {
      const body = JSON.parse(event.body || '{}');
      const { name, phone, role, status, password, isLocked } = body;

      // 기존 관리자 확인
      const existingResult = await docClient.send(new GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
      }));

      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: '관리자를 찾을 수 없습니다.',
        });
      }

      // 마스터 계정 권한 변경 방지
      if (existingResult.Item.isMaster && role && role !== 'super') {
        return response(400, {
          success: false,
          error: '마스터 계정의 역할은 변경할 수 없습니다.',
        });
      }

      const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
      const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
      const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

      if (name !== undefined) {
        updateExpressions.push('#name = :name');
        expressionNames['#name'] = 'name';
        expressionValues[':name'] = name;
      }
      if (phone !== undefined) {
        updateExpressions.push('phone = :phone');
        expressionValues[':phone'] = phone;
      }
      if (role !== undefined) {
        updateExpressions.push('#role = :role');
        expressionNames['#role'] = 'role';
        expressionValues[':role'] = role;
      }
      if (status !== undefined) {
        updateExpressions.push('#status = :status');
        expressionNames['#status'] = 'status';
        expressionValues[':status'] = status;
      }
      if (password !== undefined) {
        updateExpressions.push('#password = :password');
        expressionNames['#password'] = 'password';
        expressionValues[':password'] = password;
      }
      if (isLocked !== undefined) {
        updateExpressions.push('isLocked = :isLocked');
        expressionValues[':isLocked'] = isLocked;
      }

      const result = await docClient.send(new UpdateCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      }));

      const { password: _, ...safeAdmin } = result.Attributes || {};

      return response(200, {
        success: true,
        data: {
          message: '관리자 정보가 수정되었습니다.',
          admin: safeAdmin,
        },
      });
    }

    // DELETE /admin/admins/{adminId} - 삭제
    if (method === 'DELETE' && adminId) {
      // 기존 관리자 확인
      const existingResult = await docClient.send(new GetCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
      }));

      if (!existingResult.Item) {
        return response(404, {
          success: false,
          error: '관리자를 찾을 수 없습니다.',
        });
      }

      // 마스터 계정 삭제 방지
      if (existingResult.Item.isMaster) {
        return response(400, {
          success: false,
          error: '마스터 계정은 삭제할 수 없습니다.',
        });
      }

      await docClient.send(new DeleteCommand({
        TableName: ADMINS_TABLE,
        Key: { adminId },
      }));

      return response(200, {
        success: true,
        data: {
          message: '관리자가 삭제되었습니다.',
        },
      });
    }

    return response(405, {
      success: false,
      error: '지원하지 않는 메서드입니다.',
    });

  } catch (error: any) {
    console.error('관리자 관리 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '관리자 관리 중 오류가 발생했습니다.',
    });
  }
};
