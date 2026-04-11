#!/usr/bin/env node
/**
 * DB 보정 스크립트: 모든 사용자의 usedAmount, totalDealCount, totalPaymentAmount를
 * 실제 거래(plic-deals) 데이터에서 재계산하여 plic-users에 업데이트
 *
 * 사용법: AWS_PROFILE=plic node scripts/fix-user-stats.js
 * dry-run: AWS_PROFILE=plic node scripts/fix-user-stats.js --dry-run
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = 'ap-northeast-2';
const USERS_TABLE = 'plic-users';
const DEALS_TABLE = 'plic-deals';
const DRY_RUN = process.argv.includes('--dry-run');

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function scanAll(tableName) {
  const items = [];
  let lastKey = undefined;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function main() {
  console.log(`=== PLIC 사용자 통계 DB 보정 스크립트 ===`);
  console.log(`모드: ${DRY_RUN ? '🔍 DRY-RUN (변경 없음)' : '⚡ 실제 업데이트'}`);
  console.log('');

  // 1. 모든 사용자 조회
  console.log('1. 사용자 목록 조회 중...');
  const users = await scanAll(USERS_TABLE);
  console.log(`   → ${users.length}명`);

  // 2. 모든 거래 조회
  console.log('2. 거래 목록 조회 중...');
  const deals = await scanAll(DEALS_TABLE);
  console.log(`   → ${deals.length}건`);

  // 3. 이번 달 기준
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  console.log(`3. 이번 달 기준: ${thisMonth}`);
  console.log('');

  // 4. 사용자별 통계 재계산
  let updatedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    const uid = user.uid;
    if (!uid) continue;

    const userDeals = deals.filter(d => d.uid === uid);
    const completedDeals = userDeals.filter(d => d.status === 'completed');

    // 정확한 값 계산
    const correctTotalDealCount = completedDeals.length;
    const correctTotalPaymentAmount = completedDeals.reduce((sum, d) => sum + (d.totalAmount || d.finalAmount || 0), 0);
    const correctUsedAmount = completedDeals
      .filter(d => d.createdAt && d.createdAt.startsWith(thisMonth))
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // 현재 DB 값
    const dbTotalDealCount = user.totalDealCount || 0;
    const dbTotalPaymentAmount = user.totalPaymentAmount || 0;
    const dbUsedAmount = user.usedAmount || 0;

    // 차이 확인
    const hasDiff =
      dbTotalDealCount !== correctTotalDealCount ||
      dbTotalPaymentAmount !== correctTotalPaymentAmount ||
      dbUsedAmount !== correctUsedAmount;

    if (!hasDiff) {
      skippedCount++;
      continue;
    }

    console.log(`📋 ${user.name || uid} (${uid})`);
    console.log(`   totalDealCount:      ${dbTotalDealCount} → ${correctTotalDealCount}`);
    console.log(`   totalPaymentAmount:  ${dbTotalPaymentAmount} → ${correctTotalPaymentAmount}`);
    console.log(`   usedAmount:          ${dbUsedAmount} → ${correctUsedAmount}`);

    if (!DRY_RUN) {
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { uid },
        UpdateExpression: 'SET totalDealCount = :tdc, totalPaymentAmount = :tpa, usedAmount = :ua, updatedAt = :now',
        ExpressionAttributeValues: {
          ':tdc': correctTotalDealCount,
          ':tpa': correctTotalPaymentAmount,
          ':ua': correctUsedAmount,
          ':now': now.toISOString(),
        },
      }));
      console.log(`   ✅ 업데이트 완료`);
    } else {
      console.log(`   🔍 (dry-run, 변경 없음)`);
    }

    updatedCount++;
  }

  console.log('');
  console.log(`=== 결과 ===`);
  console.log(`총 사용자: ${users.length}명`);
  console.log(`보정 필요: ${updatedCount}명`);
  console.log(`이상 없음: ${skippedCount}명`);
  if (DRY_RUN && updatedCount > 0) {
    console.log('');
    console.log('💡 실제 업데이트 하려면: AWS_PROFILE=plic node scripts/fix-user-stats.js');
  }
}

main().catch(err => {
  console.error('스크립트 실행 실패:', err);
  process.exit(1);
});
