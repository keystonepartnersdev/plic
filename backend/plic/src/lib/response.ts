import { APIGatewayProxyResult } from 'aws-lambda';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function success(data: any, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

export function error(message: string, statusCode = 400): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}

export function notFound(message = 'Not found'): APIGatewayProxyResult {
  return error(message, 404);
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResult {
  return error(message, 403);
}

export function serverError(message = 'Internal server error'): APIGatewayProxyResult {
  return error(message, 500);
}
