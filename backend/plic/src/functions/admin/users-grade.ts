import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAdminFromToken } from '../../lib/admin-auth';
import { getItem, updateItem, Tables } from '../../lib/dynamodb';
import { success, error, unauthorized, notFound, serverError } from '../../lib/response';
import { now, GRADE_CONFIG } from '../../lib/utils';
import { IUser, TUserGrade } from '../../types';

interface UpdateGradeBody {
  grade: TUserGrade;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const admin = await getAdminFromToken(event.headers.Authorization || event.headers.authorization);

    if (!admin) {
      return unauthorized('관리자 인증이 필요합니다.');
    }

    const uid = event.pathParameters?.uid;

    if (!uid) {
      return error('사용자 ID가 필요합니다.');
    }

    const body: UpdateGradeBody = JSON.parse(event.body || '{}');

    if (!body.grade) {
      return error('등급은 필수입니다.');
    }

    const validGrades: TUserGrade[] = ['basic', 'platinum', 'b2b', 'employee'];
    if (!validGrades.includes(body.grade)) {
      return error('유효하지 않은 등급입니다.');
    }

    // 사용자 조회
    const user = await getItem<IUser>(Tables.USERS, { uid });

    if (!user) {
      return notFound('사용자를 찾을 수 없습니다.');
    }

    // 등급 설정 가져오기
    const gradeConfig = GRADE_CONFIG[body.grade];

    // 등급 업데이트
    await updateItem(Tables.USERS, { uid }, {
      grade: body.grade,
      feeRate: gradeConfig.feeRate,
      monthlyLimit: gradeConfig.monthlyLimit,
      isGradeManual: true,
      updatedAt: now(),
    });

    return success({
      message: '회원 등급이 변경되었습니다.',
      uid,
      grade: body.grade,
      feeRate: gradeConfig.feeRate,
      monthlyLimit: gradeConfig.monthlyLimit,
    });

  } catch (err: any) {
    console.error('AdminUsersGrade error:', err);
    return serverError('회원 등급 변경 중 오류가 발생했습니다.');
  }
};
