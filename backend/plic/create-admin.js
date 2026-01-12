const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const admin = {
  adminId: 'ADM001',
  email: 'admin@plic.kr',
  passwordHash: hashPassword('admin1234'),
  name: '관리자',
  role: 'super',
  status: 'active',
  isLocked: false,
  loginFailCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function createAdmin() {
  try {
    await docClient.send(new PutCommand({
      TableName: 'plic-admins',
      Item: admin,
    }));
    console.log('✅ 관리자 계정 생성 완료');
    console.log('Email:', admin.email);
    console.log('Password: admin1234');
  } catch (err) {
    console.error('❌ 에러:', err);
  }
}

createAdmin();
