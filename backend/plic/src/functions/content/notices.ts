import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, serverError } from '../../lib/response';
import { INotice } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    // 공지사항 조회 (pk = 'NOTICE')
    const notices = await queryItems<INotice>(
      Tables.CONTENTS,
      undefined,
      'pk = :pk',
      { ':pk': 'NOTICE' }
    );

    // 활성화된 공지만 필터링
    let visibleNotices = notices.filter(n => n.isVisible);

    // 고정 공지 먼저, 그 다음 최신순 정렬
    visibleNotices.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 개수 제한
    visibleNotices = visibleNotices.slice(0, limit);

    return success({
      notices: visibleNotices.map(n => ({
        id: n.sk,
        title: n.title,
        isPinned: n.isPinned,
        viewCount: n.viewCount,
        createdAt: n.createdAt,
      })),
      total: visibleNotices.length,
    });

  } catch (err: any) {
    console.error('GetNotices error:', err);
    return serverError('공지사항 조회 중 오류가 발생했습니다.');
  }
};
