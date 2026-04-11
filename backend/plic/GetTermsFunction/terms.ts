// backend/functions/content/terms.ts
// 공개 약관 조회 API (인증 불필요)
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONTENTS_TABLE = process.env.CONTENTS_TABLE || 'plic-contents';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

// 응답 헬퍼
const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// 약관 타입
type TermsType = 'service' | 'privacy' | 'electronic' | 'marketing';

const TERMS_TYPES: Record<TermsType, string> = {
  service: '서비스 이용약관',
  privacy: '개인정보 처리방침',
  electronic: '전자금융거래 이용약관',
  marketing: '마케팅 정보 수신 동의',
};

// 기본 약관 내용 (DB에 없는 경우 사용)
const DEFAULT_TERMS: Record<TermsType, string> = {
  service: `제1조 (목적)
본 약관은 PLIC(이하 "회사")가 제공하는 카드 매입대금 정산대행 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 카드 매입대금 정산대행 서비스를 말합니다.
2. "회원"이란 본 약관에 동의하고 서비스 이용 계약을 체결한 자를 말합니다.
3. "거래"란 회원이 서비스를 통해 신청한 카드 결제 및 송금 건을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.

제4조 (서비스의 제공)
1. 회사는 회원에게 카드 매입대금 정산대행 서비스를 제공합니다.
2. 서비스 이용 시간은 연중무휴, 1일 24시간을 원칙으로 합니다.
3. 회사는 시스템 정기점검, 증설 및 교체 등의 사유로 서비스를 일시 중단할 수 있습니다.

제5조 (수수료)
1. 회원은 서비스 이용에 따른 수수료를 납부해야 합니다.
2. 수수료율은 회원 등급에 따라 차등 적용됩니다.
3. 수수료율 변경 시 회사는 사전에 회원에게 고지합니다.

제6조 (회원의 의무)
1. 회원은 정확한 정보를 제공해야 합니다.
2. 회원은 타인의 정보를 도용하거나 허위 정보를 제공해서는 안 됩니다.
3. 회원은 관련 법령 및 본 약관의 규정을 준수해야 합니다.

시행일: 2024년 1월 1일`,
  privacy: `개인정보처리방침

주식회사 키스톤 파트너스(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.

1. 개인정보의 처리 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다.
- 서비스 제공 및 계약의 이행
- 회원 관리 및 본인 확인
- 민원 처리 및 고충 해결
- 서비스 개선 및 신규 서비스 개발

2. 개인정보의 처리 및 보유 기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

3. 정보주체의 권리·의무 및 행사방법
정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
- 개인정보 열람 요구
- 개인정보 정정·삭제 요구
- 개인정보 처리정지 요구

4. 개인정보의 안전성 확보조치
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
- 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육
- 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 암호화 기술 적용
- 물리적 조치: 전산실, 자료보관실 등의 접근통제

시행일: 2024년 1월 1일`,
  electronic: `전자금융거래 이용약관

제1조 (목적)
이 약관은 주식회사 키스톤 파트너스(이하 "회사")가 제공하는 전자금융거래서비스를 고객이 이용함에 있어 회사와 고객 사이의 전자금융거래에 관한 기본적인 사항을 정함을 목적으로 합니다.

제2조 (정의)
이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
1. "전자금융거래"라 함은 회사가 전자적 장치를 통하여 전자금융업무를 제공하고, 고객이 회사의 종사자와 직접 대면하거나 의사소통을 하지 아니하고 자동화된 방식으로 이를 이용하는 거래를 말합니다.
2. "접근매체"라 함은 전자금융거래에 있어서 거래지시를 하거나 이용자 및 거래내용의 진실성과 정확성을 확보하기 위하여 사용되는 수단 또는 정보를 말합니다.

제3조 (약관의 게시 및 변경)
1. 회사는 고객이 언제든지 이 약관의 내용을 쉽게 확인할 수 있도록 인터넷 홈페이지에 게시합니다.
2. 회사는 필요한 경우 관계법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.

제4조 (전자금융거래 기록의 보존)
회사는 전자금융거래에 관한 기록을 5년간 보존합니다.

시행일: 2024년 1월 1일`,
  marketing: `마케팅 정보 수신 동의

주식회사 키스톤 파트너스(이하 "회사")는 PLIC 서비스와 관련된 다양한 정보 및 혜택을 제공하기 위해 아래와 같이 마케팅 정보 수신에 대한 동의를 요청합니다.

1. 수집 및 이용 목적
회사는 아래의 목적으로 개인정보를 수집하고 이용합니다:
• 신규 서비스 및 이벤트 정보 안내
• 프로모션 및 할인 혜택 제공
• 서비스 이용 관련 유용한 정보 제공
• 맞춤형 서비스 및 상품 추천
• 각종 마케팅 활동 및 광고성 정보 전송

2. 수집하는 개인정보 항목
필수 항목: 이름, 휴대전화번호, 이메일 주소, 사업자등록번호, 상호명, 대표자명, 업종 및 업태

3. 개인정보의 보유 및 이용 기간
동의일로부터 회원 탈퇴 시 또는 마케팅 수신 동의 철회 시까지
다만, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 요구하는 기간 동안 보관합니다.

4. 마케팅 정보 수신 방법
회사는 다음의 방법으로 마케팅 정보를 발송합니다:
• SMS (문자메시지): 신규 서비스 안내, 이벤트 및 프로모션 정보, 중요 공지사항
• 이메일: 서비스 활용 가이드, 월간 뉴스레터, 특별 혜택 안내
• 카카오톡 알림톡: 주요 이벤트 안내, 프로모션 정보, 서비스 업데이트

5. 동의 거부 권리 및 불이익
귀하는 위와 같은 마케팅 정보 수신에 대한 동의를 거부할 권리가 있습니다.
동의를 거부하시는 경우:
• PLIC 서비스 이용에는 영향이 없습니다
• 다만, 각종 이벤트, 프로모션, 할인 혜택 등의 마케팅 정보를 받으실 수 없습니다

6. 마케팅 수신 동의 철회
귀하는 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다.
철회 방법:
• PLIC 앱 내 설정: 마이페이지 > 설정 > 알림 설정 > 마케팅 정보 수신 동의 해제
• 수신 메시지 내 거부 링크 클릭
• 고객센터 문의: support@plic.kr

7. 광고성 정보 전송 시간 제한
회사는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 다음 시간대에는 마케팅 정보를 전송하지 않습니다:
전송 제한 시간: 오후 9시 ~ 다음날 오전 8시

본 동의서는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조에 따른 동의입니다.

시행일: 2026년 1월 2일`,
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // OPTIONS 요청 처리 (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const termsType = event.pathParameters?.type as TermsType | undefined;

    // GET /content/terms - 모든 약관 목록 조회
    if (!termsType) {
      const result = await docClient.send(new QueryCommand({
        TableName: CONTENTS_TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'TERMS' },
      }));

      const dbTerms = result.Items || [];

      // 모든 타입에 대해 DB 값 또는 기본값 반환
      const terms = Object.entries(TERMS_TYPES).map(([type, title]) => {
        const dbItem = dbTerms.find(item => item.sk === type);
        return {
          type,
          title,
          content: dbItem?.content || DEFAULT_TERMS[type as TermsType],
          version: dbItem?.version || '1.0',
          effectiveDate: dbItem?.effectiveDate || '2024-01-01',
        };
      });

      return response(200, {
        success: true,
        data: { terms },
      });
    }

    // GET /content/terms/{type} - 특정 약관 조회
    if (!TERMS_TYPES[termsType]) {
      return response(400, {
        success: false,
        error: '유효하지 않은 약관 타입입니다.',
      });
    }

    const result = await docClient.send(new GetCommand({
      TableName: CONTENTS_TABLE,
      Key: { pk: 'TERMS', sk: termsType },
    }));

    const content = result.Item?.content || DEFAULT_TERMS[termsType];

    return response(200, {
      success: true,
      data: {
        terms: {
          type: termsType,
          title: TERMS_TYPES[termsType],
          content,
          version: result.Item?.version || '1.0',
          effectiveDate: result.Item?.effectiveDate || '2024-01-01',
        },
      },
    });

  } catch (error: any) {
    console.error('약관 조회 오류:', error);

    return response(500, {
      success: false,
      error: error.message || '약관 조회 중 오류가 발생했습니다.',
    });
  }
};
