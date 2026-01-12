import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, updateItem, Tables } from '../../lib/dynamodb';
import { success, notFound, serverError } from '../../lib/response';
import { INotice } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return notFound('공지사항 ID가 필요합니다.');
    }

    // 공지사항 조회
    const notice = await getItem<INotice>(Tables.CONTENTS, { pk: 'NOTICE', sk: id });

    if (!notice || !notice.isVisible) {
      return notFound('공지사항을 찾을 수 없습니다.');
    }

    // 조회수 증가
    await updateItem(Tables.CONTENTS, { pk: 'NOTICE', sk: id }, {
      viewCount: (notice.viewCount || 0) + 1,
    });

    return success({
      notice: {
        id: notice.sk,
        title: notice.title,
        content: notice.content,
        isPinned: notice.isPinned,
        viewCount: notice.viewCount + 1,
        createdAt: notice.createdAt,
      },
    });

  } catch (err: any) {
    console.error('GetNoticeDetail error:', err);
    return serverError('공지사항 조회 중 오류가 발생했습니다.');
  }
};
