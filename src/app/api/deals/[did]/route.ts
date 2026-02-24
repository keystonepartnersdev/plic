/**
 * 거래 상세 조회/수정/취소
 * GET /api/deals/[did] - 거래 상세 조회 (Lambda 프록시)
 * PUT /api/deals/[did] - 거래 수정 (DynamoDB 직접)
 * DELETE /api/deals/[did] - 거래 취소 (Lambda 프록시)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

// AWS 자격증명 확인용 로깅
const hasAWSCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
console.log('[DynamoDB] AWS credentials available:', hasAWSCredentials);

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: hasAWSCredentials ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined,
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

async function proxyToLambda(
  request: NextRequest,
  method: 'GET' | 'DELETE',
  did: string
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('plic_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 }
    );
  }

  const response = await fetch(`${API_BASE_URL}/deals/${did}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    return await proxyToLambda(request, 'GET', did);
  } catch (error) {
    console.error(`[API] GET /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('plic_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`[API] PUT /deals/${did} body:`, JSON.stringify(body));

    // Lambda를 통해 현재 거래 조회 (권한 검증 포함)
    const lambdaResponse = await fetch(`${API_BASE_URL}/deals/${did}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!lambdaResponse.ok) {
      const errorData = await lambdaResponse.json();
      console.log(`[API] PUT /deals/${did} - Lambda GET failed:`, lambdaResponse.status, errorData);
      return NextResponse.json(errorData, { status: lambdaResponse.status });
    }

    const lambdaData = await lambdaResponse.json();
    if (!lambdaData.success || !lambdaData.data?.deal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '거래를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const deal = lambdaData.data.deal;
    console.log(`[API] PUT /deals/${did} - Deal found via Lambda:`, deal.status, 'isPaid:', deal.isPaid);

    // 수정 가능 조건 체크: 결제 전 & draft/awaiting_payment 상태만
    if (deal.isPaid) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '결제 완료된 거래는 수정할 수 없습니다.' } },
        { status: 400 }
      );
    }

    if (!['draft', 'awaiting_payment'].includes(deal.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '현재 상태에서는 거래를 수정할 수 없습니다.' } },
        { status: 400 }
      );
    }

    // 업데이트할 필드 준비
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    // 금액 수정
    if (body.amount !== undefined) {
      const newAmount = body.amount;
      const feeRate = deal.feeRate || 5;
      const feeAmount = Math.ceil(newAmount * feeRate / 100);
      const totalAmount = newAmount + feeAmount;

      updateExpressions.push('#amount = :amount');
      updateExpressions.push('#feeAmount = :feeAmount');
      updateExpressions.push('#totalAmount = :totalAmount');
      updateExpressions.push('#finalAmount = :finalAmount');

      expressionAttributeNames['#amount'] = 'amount';
      expressionAttributeNames['#feeAmount'] = 'feeAmount';
      expressionAttributeNames['#totalAmount'] = 'totalAmount';
      expressionAttributeNames['#finalAmount'] = 'finalAmount';

      expressionAttributeValues[':amount'] = newAmount;
      expressionAttributeValues[':feeAmount'] = feeAmount;
      expressionAttributeValues[':totalAmount'] = totalAmount;
      expressionAttributeValues[':finalAmount'] = totalAmount - (deal.discountAmount || 0);
    }

    // 수취인 정보 수정
    if (body.recipient !== undefined) {
      updateExpressions.push('#recipient = :recipient');
      expressionAttributeNames['#recipient'] = 'recipient';
      expressionAttributeValues[':recipient'] = body.recipient;
    }

    // 첨부파일 수정
    if (body.attachments !== undefined) {
      updateExpressions.push('#attachments = :attachments');
      expressionAttributeNames['#attachments'] = 'attachments';
      expressionAttributeValues[':attachments'] = body.attachments;
    }

    // 업데이트 시간
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // updatedAt만 있으면 변경할 내용 없음
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '수정할 내용이 없습니다.' } },
        { status: 400 }
      );
    }

    // DynamoDB 업데이트
    console.log(`[API] PUT /deals/${did} - Updating in DynamoDB table: ${DEALS_TABLE}, AWS creds: ${hasAWSCredentials}`);
    console.log(`[API] PUT /deals/${did} - UpdateExpression:`, updateExpressions.join(', '));
    try {
      const updateResult = await docClient.send(new UpdateCommand({
        TableName: DEALS_TABLE,
        Key: { did },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }));
      console.log(`[API] PUT /deals/${did} - DynamoDB update result:`, JSON.stringify(updateResult.Attributes));
    } catch (updateError) {
      console.error(`[API] PUT /deals/${did} DynamoDB update error:`, updateError);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'DynamoDB 업데이트 실패', details: String(updateError) } },
        { status: 500 }
      );
    }

    // Lambda를 통해 업데이트된 거래 다시 조회
    const updatedResponse = await fetch(`${API_BASE_URL}/deals/${did}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let updatedDeal = deal;
    if (updatedResponse.ok) {
      const updatedData = await updatedResponse.json();
      if (updatedData.success && updatedData.data?.deal) {
        updatedDeal = updatedData.data.deal;
      }
    }

    console.log(`[API] PUT /deals/${did} success`);

    return NextResponse.json({
      success: true,
      data: {
        message: '거래가 수정되었습니다.',
        deal: updatedDeal,
      },
    });
  } catch (error) {
    console.error(`[API] PUT /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    return await proxyToLambda(request, 'DELETE', did);
  } catch (error) {
    console.error(`[API] DELETE /deals/${did} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
