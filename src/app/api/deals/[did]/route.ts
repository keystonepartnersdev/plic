/**
 * 거래 상세 조회/수정/취소
 * GET /api/deals/[did] - 거래 상세 조회 (Lambda 프록시)
 * PUT /api/deals/[did] - 거래 수정 (DynamoDB 직접)
 * DELETE /api/deals/[did] - 거래 취소 (Lambda 프록시)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
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
    const body = await request.json();

    // 거래 존재 확인
    const dealResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!dealResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = dealResult.Item;

    if (deal.isPaid) {
      return NextResponse.json({ success: false, error: '결제 완료된 거래는 수정할 수 없습니다.' }, { status: 400 });
    }

    // 허용 필드만 업데이트 (보안)
    const allowedFields = [
      'amount', 'feeRate', 'feeAmountBase', 'vatAmount', 'feeAmount',
      'totalAmount', 'finalAmount', 'discountAmount',
      'appliedCouponId', 'appliedDiscountType', 'appliedDiscountValue', 'discountCode',
      'recipient', 'senderName', 'attachments',
      'status', 'isPaid', 'paidAt', 'pgTransactionId', 'pgTrackId', 'pgAuthCd',
      'pgCardNo', 'pgCardIssuer', 'pgGoodsName', 'pgTransactionDate',
      'pgCardIssuerCode', 'pgCardType', 'pgCardAcquirer', 'pgCardAcquirerCode',
      'pgInstallment', 'pgPayMethodTypeCode',
      'history', 'statusHistory', 'revisionType', 'revisionMemo', 'feeSource',
    ];

    const setExpressions: string[] = ['updatedAt = :updatedAt'];
    const removeExpressions: string[] = [];
    const exprValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };
    const exprNames: Record<string, string> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (body[key] === undefined || body[key] === null) {
          removeExpressions.push(`#${key}`);
          exprNames[`#${key}`] = key;
        } else {
          setExpressions.push(`#${key} = :${key}`);
          exprNames[`#${key}`] = key;
          exprValues[`:${key}`] = body[key];
        }
      }
    }

    let updateExpression = `SET ${setExpressions.join(', ')}`;
    if (removeExpressions.length > 0) {
      updateExpression += ` REMOVE ${removeExpressions.join(', ')}`;
    }

    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }));

    // 업데이트된 거래 조회
    const updatedResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));

    return NextResponse.json({
      success: true,
      data: { message: '거래가 수정되었습니다.', deal: updatedResult.Item },
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
