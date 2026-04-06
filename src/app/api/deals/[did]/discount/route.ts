/**
 * 거래 할인코드 적용 API (DynamoDB 직접)
 * POST /api/deals/{did}/discount — 할인코드 입력 → 서버사이드 검증 → DB 업데이트
 *
 * 쿠폰 API (/api/deals/{did}/coupon)와 동일한 계산 로직 사용.
 * 1거래 1할인 원칙: 이미 쿠폰/할인코드 적용 중이면 거부.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const DISCOUNTS_TABLE = process.env.DISCOUNTS_TABLE || 'plic-discounts';

const MIN_FEE_RATE = 1.0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  try {
    const { did } = await params;
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: '할인코드를 입력해주세요.' }, { status: 400 });
    }

    // 거래 조회
    const dealResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!dealResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = dealResult.Item;

    if (deal.isPaid) {
      return NextResponse.json({ success: false, error: '결제 완료된 거래에는 할인을 적용할 수 없습니다.' }, { status: 400 });
    }

    // 1거래 1할인: 이미 쿠폰/할인코드 적용 중이면 거부
    if (deal.appliedCouponId || (deal.discountAmount && deal.discountAmount > 0)) {
      return NextResponse.json({ success: false, error: '이미 할인이 적용된 거래입니다. 기존 할인을 해제한 후 다시 시도해주세요.' }, { status: 400 });
    }

    // 할인코드 검색 (plic-discounts 테이블에서 code 필드로 검색)
    const scanResult = await docClient.send(new ScanCommand({
      TableName: DISCOUNTS_TABLE,
      FilterExpression: 'code = :code AND #type = :type AND isActive = :active',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: {
        ':code': code.trim(),
        ':type': 'code',
        ':active': true,
      },
    }));

    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json({ success: false, error: '유효하지 않은 할인코드입니다.' }, { status: 400 });
    }

    const discount = scanResult.Items[0];
    const now = new Date().toISOString();

    // 유효기간 확인
    if (discount.expiry && discount.expiry < now) {
      return NextResponse.json({ success: false, error: '만료된 할인코드입니다.' }, { status: 400 });
    }
    if (discount.startDate && discount.startDate > now) {
      return NextResponse.json({ success: false, error: '아직 사용할 수 없는 할인코드입니다.' }, { status: 400 });
    }

    // 최소 금액 확인
    if (discount.minAmount && deal.amount < discount.minAmount) {
      return NextResponse.json({ success: false, error: `최소 주문 금액 ${discount.minAmount.toLocaleString()}원 이상부터 사용 가능합니다.` }, { status: 400 });
    }

    // 거래 유형 확인
    const applicableTypes = discount.applicableDealTypes || [];
    if (applicableTypes.length > 0 && !applicableTypes.includes(deal.dealType)) {
      return NextResponse.json({ success: false, error: '이 거래 유형에는 적용할 수 없는 할인코드입니다.' }, { status: 400 });
    }

    // 등급 확인
    // deal.uid로 사용자 조회가 필요하지만, 간단히 allowedGrades가 없으면 전체 허용
    // TODO: 필요 시 사용자 등급 검증 추가

    // 수수료 재계산 — 처음부터 독립 계산 (totalAmount 의존 제거)
    // 공식: feeBase = floor(amount * rate / 100), vat = floor(feeBase * 0.1), fee = feeBase + vat
    const snapshot = {
      name: discount.name,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
    };
    const amount = deal.amount as number;
    const baseFeeRate = deal.feeRate as number;

    // 원본 수수료 (독립 계산)
    const origFeeBase = Math.floor(amount * baseFeeRate / 100);
    const origVat = Math.floor(origFeeBase * 0.1);
    const origFeeTotal = origFeeBase + origVat;
    const origTotal = amount + origFeeTotal;

    let newFeeTotal = origFeeTotal;

    if (snapshot.discountType === 'feeOverride') {
      const newFeeRate = Math.max(snapshot.discountValue, MIN_FEE_RATE);
      const newFeeBase = Math.floor(amount * newFeeRate / 100);
      const newVat = Math.floor(newFeeBase * 0.1);
      newFeeTotal = newFeeBase + newVat;
    } else if (snapshot.discountType === 'feeDiscount') {
      const newFeeRate = Math.max(baseFeeRate - snapshot.discountValue, MIN_FEE_RATE);
      const newFeeBase = Math.floor(amount * newFeeRate / 100);
      const newVat = Math.floor(newFeeBase * 0.1);
      newFeeTotal = newFeeBase + newVat;
    } else if (snapshot.discountType === 'amount') {
      const minFeeBase = Math.floor(amount * MIN_FEE_RATE / 100);
      const minFeeTotal = minFeeBase + Math.floor(minFeeBase * 0.1);
      const maxDiscount = origFeeTotal - minFeeTotal;
      const actualDiscount = Math.min(snapshot.discountValue, Math.max(maxDiscount, 0));
      newFeeTotal = origFeeTotal - actualDiscount;
    } else if (snapshot.discountType === 'feePercent') {
      const minFeeBase = Math.floor(amount * MIN_FEE_RATE / 100);
      const minFeeTotal = minFeeBase + Math.floor(minFeeBase * 0.1);
      const maxDiscount = origFeeTotal - minFeeTotal;
      const actualDiscount = Math.min(
        Math.floor(origFeeTotal * snapshot.discountValue / 100),
        Math.max(maxDiscount, 0)
      );
      newFeeTotal = origFeeTotal - actualDiscount;
    }

    const newFinalAmount = amount + newFeeTotal;
    const discountAmount = origTotal - newFinalAmount;

    // 거래 업데이트 — 할인 적용된 수수료/총액도 함께 갱신
    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: 'SET discountCode = :code, discountAmount = :discountAmt, feeAmount = :fee, totalAmount = :total, finalAmount = :final, appliedCouponId = :discountId, feeSource = :feeSource, appliedDiscountType = :dtype, appliedDiscountValue = :dval, updatedAt = :now',
      ExpressionAttributeValues: {
        ':code': snapshot.name,
        ':discountAmt': discountAmount,
        ':fee': newFeeTotal,
        ':total': newFinalAmount,
        ':final': newFinalAmount,
        ':discountId': `discount:${discount.id}`,
        ':feeSource': 'discount_code',
        ':dtype': snapshot.discountType,
        ':dval': snapshot.discountValue,
        ':now': now,
      },
    }));

    // 할인코드 사용 횟수 증가
    await docClient.send(new UpdateCommand({
      TableName: DISCOUNTS_TABLE,
      Key: { id: discount.id },
      UpdateExpression: 'SET usageCount = if_not_exists(usageCount, :zero) + :one, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
        ':now': now,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        discountAmount,
        finalAmount: newFinalAmount,
        discountName: snapshot.name,
        appliedDiscountType: snapshot.discountType,
      },
    });
  } catch (error) {
    console.error('[Deal Discount Code Apply] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '할인코드 적용 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
