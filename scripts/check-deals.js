const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const doc = DynamoDBDocumentClient.from(client);

async function main() {
  const deals = await doc.send(new ScanCommand({ TableName: 'plic-deals' }));
  console.log('=== 전체 거래 ===');
  console.log('총 건수:', deals.Items.length);
  console.log('');

  const byUser = {};
  for (const d of deals.Items) {
    if (!byUser[d.uid]) byUser[d.uid] = [];
    byUser[d.uid].push({ did: d.did, status: d.status, isPaid: d.isPaid, amount: d.amount, dealName: d.dealName });
  }

  for (const [uid, userDeals] of Object.entries(byUser)) {
    console.log('UID:', uid, '- 거래 수:', userDeals.length);
    for (const d of userDeals) {
      console.log('  ', d.did, d.status, d.isPaid ? '(결제완료)' : '', d.amount, d.dealName);
    }
    console.log('');
  }

  const users = await doc.send(new ScanCommand({
    TableName: 'plic-users',
    ProjectionExpression: 'uid, #n',
    ExpressionAttributeNames: { '#n': 'name' },
  }));
  console.log('=== 사용자별 거래 수 ===');
  for (const u of users.Items) {
    const count = byUser[u.uid] ? byUser[u.uid].length : 0;
    console.log(u.name, '(' + u.uid + '):', count, '건');
  }
}

main().catch(console.error);
