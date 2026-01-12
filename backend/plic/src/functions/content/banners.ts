import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, Tables } from '../../lib/dynamodb';
import { success, serverError } from '../../lib/response';
import { IBanner } from '../../types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // 배너 조회 (pk = 'BANNER')
    const banners = await queryItems<IBanner>(
      Tables.CONTENTS,
      undefined,
      'pk = :pk',
      { ':pk': 'BANNER' }
    );

    // 활성화된 배너만 필터링 & 우선순위 정렬
    const visibleBanners = banners
      .filter(b => b.isVisible)
      .sort((a, b) => a.priority - b.priority);

    return success({
      banners: visibleBanners.map(b => ({
        id: b.sk,
        title: b.title,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
      })),
    });

  } catch (err: any) {
    console.error('GetBanners error:', err);
    return serverError('배너 조회 중 오류가 발생했습니다.');
  }
};
