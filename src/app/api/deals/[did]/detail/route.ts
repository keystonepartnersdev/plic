/**
 * 거래 상세 조회 (DynamoDB 직접)
 * GET /api/deals/{did}/detail
 *
 * Lambda 프록시 대신 DynamoDB에서 직접 조회하여 모든 필드를 반환합니다.
 * (finalAmount, discountAmount, appliedCouponId 등 쿠폰 관련 필드 포함)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  try {
    const result = await docClient.send(new GetCommand({
      TableName: DEALS_TABLE,
      Key: { did },
    }));

    if (!result.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { deal: result.Item } });
  } catch (error) {
    console.error(`[Deal Detail] GET /deals/${did}/detail error:`, error);
    return NextResponse.json({ success: false, error: '거래 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
