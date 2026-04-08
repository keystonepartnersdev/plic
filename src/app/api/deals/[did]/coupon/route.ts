/**
 * 거래 쿠폰 적용/해제 API
 * POST /api/deals/{did}/coupon — 쿠폰 적용
 * DELETE /api/deals/{did}/coupon — 쿠폰 해제 (복원)
 *
 * feeOverride: 수수료율 자체를 대체 → 부가세 계산
 * feeDiscount: 수수료율에서 차감 (최소 1%) → 부가세 계산
 * amount: 수수료 금액에서 정액 차감
 * feePercent: 수수료 금액의 N% 차감
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const DEALS_TABLE = process.env.DEALS_TABLE || 'plic-deals';
const USER_COUPONS_TABLE = 'plic-user-coupons';

const MIN_FEE_RATE = 1.0; // 최소 수수료율 하한선

// POST: 쿠폰 적용
export async function POST(request: NextRequest, { params }: { params: Promise<{ did: string }> }) {
  try {
    const { did } = await params;
    const body = await request.json();
    const { userCouponId } = body;

    if (!userCouponId) {
      return NextResponse.json({ success: false, error: '쿠폰 ID가 필요합니다.' }, { status: 400 });
    }

    // 거래 조회
    const dealResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!dealResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = dealResult.Item;

    if (deal.isPaid) {
      return NextResponse.json({ success: false, error: '결제 완료된 거래에는 쿠폰을 적용할 수 없습니다.' }, { status: 400 });
    }

    // 사용자 쿠폰 조회
    const couponResult = await docClient.send(new GetCommand({ TableName: USER_COUPONS_TABLE, Key: { id: userCouponId } }));
    if (!couponResult.Item) {
      return NextResponse.json({ success: false, error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 });
    }
    const userCoupon = couponResult.Item;

    // 쿠폰 유효성 검증
    if (userCoupon.uid !== deal.uid) {
      return NextResponse.json({ success: false, error: '본인의 쿠폰만 사용할 수 있습니다.' }, { status: 403 });
    }
    if (userCoupon.isUsed || userCoupon.usedCount >= userCoupon.maxUsage) {
      return NextResponse.json({ success: false, error: '이미 사용된 쿠폰입니다.' }, { status: 400 });
    }
    const now = new Date().toISOString();
    if (userCoupon.expiresAt && userCoupon.expiresAt < now) {
      return NextResponse.json({ success: false, error: '만료된 쿠폰입니다.' }, { status: 400 });
    }
    const snapStartDate = userCoupon.discountSnapshot?.startDate;
    if (snapStartDate && snapStartDate > now) {
      return NextResponse.json({ success: false, error: '아직 사용할 수 없는 쿠폰입니다.' }, { status: 400 });
    }

    // 1회 쿠폰 어뷰징 방지: 미결제 거래에 이미 적용 중인지 확인
    if (userCoupon.maxUsage === 1 && userCoupon.usedDealId && userCoupon.usedDealId !== did) {
      // 참조된 거래가 존재하고 활성 상태인지 확인 (삭제/취소된 거래면 쿠폰 재사용 허용)
      const refDealResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did: userCoupon.usedDealId } }));
      const refDeal = refDealResult.Item;
      if (refDeal && refDeal.status !== 'cancelled' && refDeal.appliedCouponId === userCoupon.id) {
        return NextResponse.json({ success: false, error: '이 쿠폰은 다른 거래에 적용 중입니다.' }, { status: 400 });
      }
      // 참조된 거래가 없거나 취소됨 → 쿠폰 usedDealId 정리
      await docClient.send(new UpdateCommand({
        TableName: USER_COUPONS_TABLE,
        Key: { id: userCoupon.id },
        UpdateExpression: 'REMOVE usedDealId, usedAt SET updatedAt = :now',
        ExpressionAttributeValues: { ':now': now },
      }));
    }

    // 거래 유형 적용 가능 여부 확인
    const applicableTypes = userCoupon.discountSnapshot?.applicableDealTypes || [];
    if (applicableTypes.length > 0 && !applicableTypes.includes(deal.dealType)) {
      return NextResponse.json({ success: false, error: '이 거래 유형에는 적용할 수 없는 쿠폰입니다.' }, { status: 400 });
    }

    // 수수료 재계산 — 처음부터 독립 계산 (totalAmount 의존 제거)
    // 공식: feeBase = floor(amount * rate / 100), vat = floor(feeBase * 0.1), fee = feeBase + vat
    const snapshot = userCoupon.discountSnapshot;
    const amount = deal.amount as number;
    const baseFeeRate = deal.feeRate as number;

    // 원본 수수료 (독립 계산)
    const origFeeBase = Math.floor(amount * baseFeeRate / 100);
    const origVat = Math.floor(origFeeBase * 0.1);
    const origFeeTotal = origFeeBase + origVat;
    const origTotal = amount + origFeeTotal;

    let newFeeRate = baseFeeRate;
    let newFeeBase = origFeeBase;
    let newVat = origVat;
    let newFeeTotal = origFeeTotal;

    if (snapshot.discountType === 'feeOverride') {
      // 수수료율 대체
      newFeeRate = Math.max(snapshot.discountValue, MIN_FEE_RATE);
      newFeeBase = Math.floor(amount * newFeeRate / 100);
      newVat = Math.floor(newFeeBase * 0.1);
      newFeeTotal = newFeeBase + newVat;
    } else if (snapshot.discountType === 'feeDiscount') {
      // 수수료율 차감 → 최소 1%
      newFeeRate = Math.max(baseFeeRate - snapshot.discountValue, MIN_FEE_RATE);
      newFeeBase = Math.floor(amount * newFeeRate / 100);
      newVat = Math.floor(newFeeBase * 0.1);
      newFeeTotal = newFeeBase + newVat;
    } else if (snapshot.discountType === 'amount') {
      // 정액 차감 (최소 1% 수수료 보장)
      const minFeeBase = Math.floor(amount * MIN_FEE_RATE / 100);
      const minFeeTotal = minFeeBase + Math.floor(minFeeBase * 0.1);
      const maxDiscount = origFeeTotal - minFeeTotal;
      const actualDiscount = Math.min(snapshot.discountValue, Math.max(maxDiscount, 0));
      newFeeBase = origFeeBase - actualDiscount;  // 수수료 기본에서 차감
      newVat = Math.floor(Math.max(newFeeBase, 0) * 0.1);
      newFeeTotal = Math.max(newFeeBase, 0) + newVat;
    } else if (snapshot.discountType === 'feePercent') {
      // 수수료의 N% 차감 (최소 1% 수수료 보장)
      const minFeeBase = Math.floor(amount * MIN_FEE_RATE / 100);
      const minFeeTotal = minFeeBase + Math.floor(minFeeBase * 0.1);
      const maxDiscount = origFeeTotal - minFeeTotal;
      const actualDiscount = Math.min(
        Math.floor(origFeeTotal * snapshot.discountValue / 100),
        Math.max(maxDiscount, 0)
      );
      newFeeBase = origFeeBase - actualDiscount;
      newVat = Math.floor(Math.max(newFeeBase, 0) * 0.1);
      newFeeTotal = Math.max(newFeeBase, 0) + newVat;
    }

    const newFinalAmount = amount + newFeeTotal;
    const discountAmount = origTotal - newFinalAmount;

    // 거래 업데이트 — 수수료 분해 값(feeAmountBase, vatAmount) 포함
    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: 'SET discountCode = :code, discountAmount = :discountAmt, feeAmountBase = :feeBase, vatAmount = :vat, feeAmount = :fee, finalAmount = :final, appliedCouponId = :couponId, feeSource = :feeSource, appliedDiscountType = :dtype, appliedDiscountValue = :dval, updatedAt = :now',
      ExpressionAttributeValues: {
        ':code': snapshot.name,
        ':discountAmt': discountAmount,
        ':feeBase': newFeeBase,
        ':vat': newVat,
        ':fee': newFeeTotal,
        ':final': newFinalAmount,
        ':couponId': userCouponId,
        ':feeSource': 'coupon',
        ':dtype': snapshot.discountType,
        ':dval': snapshot.discountValue,
        ':now': now,
      },
    }));

    // 쿠폰 사용 표시 (usedDealId 기록)
    await docClient.send(new UpdateCommand({
      TableName: USER_COUPONS_TABLE,
      Key: { id: userCouponId },
      UpdateExpression: 'SET usedDealId = :did, usedAt = :now, updatedAt = :now',
      ExpressionAttributeValues: {
        ':did': did,
        ':now': now,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        discountAmount,
        finalAmount: newFinalAmount,
        couponName: snapshot.name,
        appliedFeeRate: snapshot.discountType === 'feeOverride' ? newFeeRate : undefined,
      },
    });
  } catch (error) {
    console.error('[Deal Coupon Apply] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 적용 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}

// DELETE: 쿠폰 해제 (복원)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ did: string }> }) {
  try {
    const { did } = await params;

    // 거래 조회
    const dealResult = await docClient.send(new GetCommand({ TableName: DEALS_TABLE, Key: { did } }));
    if (!dealResult.Item) {
      return NextResponse.json({ success: false, error: '거래를 찾을 수 없습니다.' }, { status: 404 });
    }
    const deal = dealResult.Item;

    if (deal.isPaid) {
      return NextResponse.json({ success: false, error: '결제 완료된 거래의 쿠폰은 해제할 수 없습니다.' }, { status: 400 });
    }

    const appliedCouponId = deal.appliedCouponId as string;
    if (!appliedCouponId) {
      return NextResponse.json({ success: false, error: '적용된 쿠폰이 없습니다.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 원본 수수료 재계산 (독립 계산)
    const amount = deal.amount as number;
    const baseFeeRate = deal.feeRate as number;
    const origFeeBase = Math.floor(amount * baseFeeRate / 100);
    const origVat = Math.floor(origFeeBase * 0.1);
    const origFeeTotal = origFeeBase + origVat;
    const origTotal = amount + origFeeTotal;

    // 거래에서 할인 제거 — 원본 수수료 복원 (totalAmount는 변경 안 함 — 원래 고정값)
    await docClient.send(new UpdateCommand({
      TableName: DEALS_TABLE,
      Key: { did },
      UpdateExpression: 'SET discountCode = :empty, discountAmount = :zero, feeAmountBase = :feeBase, vatAmount = :vat, feeAmount = :fee, finalAmount = :origTotal, feeSource = :src, updatedAt = :now REMOVE appliedCouponId, appliedDiscountType, appliedDiscountValue',
      ExpressionAttributeValues: {
        ':empty': '',
        ':zero': 0,
        ':feeBase': origFeeBase,
        ':vat': origVat,
        ':fee': origFeeTotal,
        ':origTotal': origTotal,
        ':src': deal.feeSource === 'coupon' ? 'default' : (deal.feeSource || 'default'),
        ':now': now,
      },
    }));

    // 쿠폰 복원
    await docClient.send(new UpdateCommand({
      TableName: USER_COUPONS_TABLE,
      Key: { id: appliedCouponId },
      UpdateExpression: 'REMOVE usedDealId, usedAt SET updatedAt = :now',
      ExpressionAttributeValues: { ':now': now },
    }));

    return NextResponse.json({
      success: true,
      data: { message: '쿠폰이 해제되었습니다.', finalAmount: deal.totalAmount },
    });
  } catch (error) {
    console.error('[Deal Coupon Remove] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 해제 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}
