import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
export const docClient = DynamoDBDocumentClient.from(client);

// 테이블 이름
export const Tables = {
  USERS: 'plic-users',
  DEALS: 'plic-deals',
  ADMINS: 'plic-admins',
  DISCOUNTS: 'plic-discounts',
  CONTENTS: 'plic-contents',
};

// 단일 항목 조회
export async function getItem<T>(tableName: string, key: Record<string, any>): Promise<T | null> {
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: key,
  }));
  return (result.Item as T) || null;
}

// 항목 저장
export async function putItem<T>(tableName: string, item: T): Promise<T> {
  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: item as Record<string, any>,
  }));
  return item;
}

// 항목 업데이트
export async function updateItem(
  tableName: string,
  key: Record<string, any>,
  updates: Record<string, any>
): Promise<any> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([field, value], index) => {
    const attrName = `#field${index}`;
    const attrValue = `:value${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = field;
    expressionAttributeValues[attrValue] = value;
  });

  const result = await docClient.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes;
}

// 항목 삭제
export async function deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: tableName,
    Key: key,
  }));
}

// 쿼리 (인덱스 사용)
export async function queryItems<T>(
  tableName: string,
  indexName: string | undefined,
  keyCondition: string,
  expressionValues: Record<string, any>,
  options?: {
    limit?: number;
    scanIndexForward?: boolean;
    filterExpression?: string;
  }
): Promise<T[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
    Limit: options?.limit,
    ScanIndexForward: options?.scanIndexForward ?? false,
    FilterExpression: options?.filterExpression,
  }));

  return (result.Items as T[]) || [];
}

// 전체 스캔
export async function scanItems<T>(
  tableName: string,
  filterExpression?: string,
  expressionValues?: Record<string, any>
): Promise<T[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionValues,
  }));

  return (result.Items as T[]) || [];
}
