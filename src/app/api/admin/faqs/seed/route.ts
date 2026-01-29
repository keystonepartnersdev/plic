import { NextRequest, NextResponse } from 'next/server';

// FAQ 데이터 (FAQ_CONTENT.md 기반)
const faqData = [
  // 1. 서비스 이용
  {
    category: 'service',
    question: 'PLIC은 어떤 서비스인가요?',
    answer: 'PLIC은 사업자가 사업 관련 비용(인건비, 임대료, 물품대금 등)을 신용카드로 결제하고, 수취인의 계좌로 송금해주는 지급대행 서비스입니다. 현금이 부족할 때 카드 결제일까지 여유를 확보할 수 있습니다.',
    isHomeFeatured: true,
  },
  {
    category: 'service',
    question: '누가 PLIC을 이용할 수 있나요?',
    answer: '사업자등록증을 보유한 개인사업자 또는 법인사업자만 이용할 수 있습니다. 일반 개인(비사업자)은 가입이 불가합니다.',
    isHomeFeatured: true,
  },
  {
    category: 'service',
    question: '어떤 비용을 PLIC으로 결제할 수 있나요?',
    answer: `사업 운영과 관련된 정당한 비용이라면 모두 가능합니다:
• 원재료 및 상품 구매비
• 임차료 (사무실, 매장, 월세 등)
• 인건비 (급여, 일용직 비용 등)
• 용역비 (외주, 프리랜서 비용 등)
• 광고선전비
• 운반비 / 운송비
• 보험료
• 기타 사업 관련 비용`,
    isHomeFeatured: false,
  },
  {
    category: 'service',
    question: '수취인도 PLIC에 가입해야 하나요?',
    answer: '아니요, 수취인은 PLIC 회원이 아니어도 됩니다. 국내 모든 은행 계좌로 송금받을 수 있습니다. 수취인은 별도의 앱 설치나 회원가입 없이 계좌로 돈을 받기만 하면 됩니다.',
    isHomeFeatured: false,
  },
  {
    category: 'service',
    question: '거래 생성 시 어떤 서류를 첨부해야 하나요?',
    answer: `거래의 실질을 증명할 수 있는 서류를 첨부해야 합니다:
• 세금계산서
• 거래명세서
• 계약서
• 견적서
• 급여명세서
• 기타 거래를 입증할 수 있는 서류

거래 유형에 따라 필수 서류가 다르며, 검토 과정에서 추가 증빙이 요청될 수 있습니다.`,
    isHomeFeatured: false,
  },
  {
    category: 'service',
    question: '거래 검토는 어떻게 진행되나요?',
    answer: '결제 완료 후 운영팀이 거래의 적법성과 실재성을 검토합니다. 거래검토는 평일 09:00~18:00에 진행되며, 검토 결과는 앱 푸시알림 또는 문자메시지로 안내됩니다.',
    isHomeFeatured: false,
  },
  {
    category: 'service',
    question: '검토에서 거절될 수도 있나요?',
    answer: '네, 증빙 서류가 불충분하거나 거래의 실재성이 확인되지 않는 경우 거절될 수 있습니다. 이 경우 결제 금액은 전액 취소됩니다.',
    isHomeFeatured: false,
  },
  {
    category: 'service',
    question: '서비스 이용 시간은 어떻게 되나요?',
    answer: '결제는 연중무휴 24시간 가능합니다. 단, 송금은 은행 영업일 기준으로 진행되며, 매일 23:30~00:30에는 은행 점검으로 송금이 제한될 수 있습니다.',
    isHomeFeatured: false,
  },

  // 2. 결제 / 수수료
  {
    category: 'payment',
    question: '수수료는 얼마인가요?',
    answer: '현재 베타 버전 기준 수수료는 5.5%입니다. 예를 들어, 100만원을 송금하려면 100만원 + 수수료 55,000원 = 총 1,055,000원을 결제하시면 됩니다. 수수료율은 추후 거래량 등에 따라 변경될 수 있습니다.',
    isHomeFeatured: true,
  },
  {
    category: 'payment',
    question: '어떤 카드를 사용할 수 있나요?',
    answer: '본인 명의의 국내 신용카드와 체크카드, 법인 명의의 카드를 사용할 수 있습니다. 해외 발급 카드는 현재 지원하지 않습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '할부 결제가 가능한가요?',
    answer: '네, 신용카드의 경우 카드사에서 제공하는 할부 옵션(2~12개월)을 이용할 수 있습니다. 큰 금액의 거래도 부담 없이 나눠서 결제할 수 있어 자금 흐름 관리에 유리합니다. 체크카드는 일시불 결제만 가능합니다.',
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '카드 혜택(포인트, 마일리지 등)도 적용되나요?',
    answer: `네, PLIC 결제 시에도 카드 고유의 혜택을 그대로 적용받을 수 있습니다:
• 카드사 포인트 적립
• 항공 마일리지 적립
• 캐시백 혜택
• 각종 카드 할인

단, 할부 결제 시 포인트/마일리지 적립 제외, 특정 가맹점 제한 등 일부 혜택은 카드사 정책에 따라 적용되지 않을 수 있습니다. 정확한 혜택 적용 여부는 해당 카드사에 문의해 주세요.`,
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '법인카드로도 결제할 수 있나요?',
    answer: '네, 법인 명의의 카드로 결제 가능합니다. 기명/무기명 법인카드 모두 사용 가능하며, 동일한 수수료가 적용됩니다.',
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '무기명 법인카드로 결제하려면 어떻게 해야 하나요?',
    answer: `무기명 법인카드의 경우 사전 등록 절차가 필요합니다:

1. 법인 비밀번호 등록: 카드사 홈페이지에서 법인 비밀번호를 먼저 등록해야 합니다.
2. 결제 방식 선택:
   • 일반 결제: 법인 비밀번호 등록 후 일반 결제 방식으로 결제
   • ISP/안심클릭: 범용 공인인증서를 이용하여 결제

결제 오류 발생 시 해당 카드사에 문의하여 결제 가능 여부 및 방법을 확인해 주세요.`,
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '결제 한도는 어떻게 되나요?',
    answer: '결제 한도는 회원님의 카드 한도에 따릅니다. PLIC 자체의 결제 한도는 별도로 없습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '결제 영수증을 받을 수 있나요?',
    answer: '네, 결제 완료 후 앱 내 거래 상세에서 결제 영수증을 확인하실 수 있습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'payment',
    question: '수수료도 세금계산서 발행이 되나요?',
    answer: '수수료에 대한 세금계산서는 요청 시 발행 가능합니다. 고객센터로 문의해 주세요.',
    isHomeFeatured: false,
  },

  // 3. 계정 / 회원
  {
    category: 'account',
    question: '회원가입에 필요한 서류는 무엇인가요?',
    answer: `회원가입 시 다음 서류가 필요합니다:
• 사업자등록증
• 본인인증 (카카오톡 인증 등)`,
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '개인(비사업자)도 가입할 수 있나요?',
    answer: '아니요, PLIC은 사업자 전용 서비스입니다. 사업자등록증이 없는 개인은 가입할 수 없습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '휴업/폐업 상태인데 가입할 수 있나요?',
    answer: '휴업 또는 폐업 상태의 사업자는 가입이 불가합니다. 사업자 상태가 정상으로 변경된 후 가입해 주세요. 또한, PLIC은 주기적으로 사업자 상태를 확인하며, 기존 회원이라도 휴업/폐업 상태로 확인될 경우 서비스 이용이 정지될 수 있습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '회원 등급 제도가 있나요?',
    answer: '현재 베타 버전에서는 회원 등급 제도가 없습니다. 추후 서비스 정식 출시 시 거래량에 따른 등급 및 혜택이 제공될 예정입니다.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '계정 정보를 변경하고 싶어요.',
    answer: '앱 내 마이페이지에서 일부 정보를 변경할 수 있습니다. 사업자등록번호 등 핵심 정보 변경은 고객센터로 문의해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '앱 내 마이페이지 > 설정에서 회원탈퇴를 신청할 수 있습니다. 단, 진행 중인 거래가 있는 경우 모든 거래를 완료하거나 취소한 후에만 탈퇴가 가능합니다.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '탈퇴 후 재가입이 가능한가요?',
    answer: '서비스 운영정책에 따라 탈퇴 후 일정 기간 동안 동일한 정보로 재가입이 제한될 수 있습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'account',
    question: '계정이 정지되었어요. 왜 그런가요?',
    answer: `다음과 같은 경우 계정이 정지될 수 있습니다:
• 장기간 미로그인
• 약관 또는 운영정책 위반
• 불법 거래 의심
• 타인 명의 도용 의심

자세한 사유는 고객센터로 문의해 주세요.`,
    isHomeFeatured: false,
  },

  // 4. 송금 / 입금
  {
    category: 'transfer',
    question: '송금은 얼마나 걸리나요?',
    answer: '결제가 완료되면 운영팀 검토 후 D+3일(영업일 기준) 이내에 송금됩니다. 은행 점검 시간(23:30~00:30)에는 점검 종료 후 순차적으로 처리됩니다.',
    isHomeFeatured: true,
  },
  {
    category: 'transfer',
    question: '수취인이 받는 금액은 얼마인가요?',
    answer: '수취인은 송금 원금을 100% 그대로 받습니다. 100만원을 송금하면 수취인 계좌에 100만원이 입금됩니다. 수수료는 결제자(회원)가 별도로 부담합니다.',
    isHomeFeatured: true,
  },
  {
    category: 'transfer',
    question: '어떤 은행으로 송금할 수 있나요?',
    answer: '국내 모든 은행 계좌로 송금 가능합니다.',
    isHomeFeatured: false,
  },
  {
    category: 'transfer',
    question: '송금 취소가 가능한가요?',
    answer: '결제 이후, 송금 이전까지는 취소가 가능합니다. 이 경우 결제 금액 전액이 결제 취소됩니다. 송금 이전에 결제 취소를 요청하시려면 고객센터로 문의해 주세요. 단, 송금이 완료된 후에는 취소가 불가능합니다. 송금 전 수취인 정보와 금액을 반드시 확인해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'transfer',
    question: '환불은 얼마나 걸리나요?',
    answer: '환불 처리 시 신용카드와 체크카드 모두 3~7 영업일 내에 카드사를 통해 환불됩니다. 환불 시에는 수수료도 함께 환불됩니다.',
    isHomeFeatured: false,
  },
  {
    category: 'transfer',
    question: '잘못된 계좌로 송금했어요. 어떻게 하나요?',
    answer: '송금 전이라면 거래를 취소하고 올바른 계좌 정보로 다시 거래를 생성해 주세요. 송금이 완료된 경우에는 취소가 불가능하며, 회원이 입력한 계좌정보 오류로 인한 오송금에 대해서는 회사가 책임지지 않습니다. 송금 전 수취인 계좌 정보를 반드시 확인해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'transfer',
    question: '제 명의의 통장으로 송금받고 싶어요.',
    answer: '카드 결제자와 수취인이 동일한 경우는 불법 현금융통(카드깡)인 범죄 행위로 분류됩니다. PLIC은 불법 거래를 근절하기 위해 철저한 거래 검토를 진행하고 있으며, 결제자 본인 계좌로의 송금은 불가합니다.',
    isHomeFeatured: false,
  },
  {
    category: 'transfer',
    question: '송금 상태는 어디서 확인하나요?',
    answer: '앱 내 거래 목록에서 실시간으로 거래 상태를 확인할 수 있습니다. 상태 변경 시 푸시알림으로도 안내해 드립니다.',
    isHomeFeatured: false,
  },

  // 5. 기타
  {
    category: 'other',
    question: '고객센터 운영시간은 어떻게 되나요?',
    answer: '고객센터는 평일 09:00~18:00에 운영됩니다. (주말/공휴일 휴무)',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: '문의는 어떻게 하나요?',
    answer: '카카오톡 고객센터 또는 고객센터 이메일(support@plic.kr)로 문의해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: 'PLIC 이용이 세금에 영향을 주나요?',
    answer: 'PLIC을 통한 결제는 일반 카드 결제와 동일하게 처리됩니다. PLIC은 수수료에 대한 세금계산서만 발행해드리며, 송금액에 대한 지출 증빙(세금계산서, 현금영수증 등)은 수취인에게 직접 요청하셔야 합니다. 매출신고, 매입공제, 비용처리 등은 세법에 맞게 처리해야 하며, 세무 관련 사항은 담당 세무사와 상담하시기 바랍니다. 수수료에 대한 세금계산서 발행을 요청하시는 경우, 카카오톡 고객센터 또는 고객센터 이메일(support@plic.kr)로 문의해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: '개인정보는 안전하게 보호되나요?',
    answer: '네, PLIC은 정보통신망법, 개인정보보호법 등 관련 법령에 따라 회원의 개인정보를 안전하게 보호하고 있습니다. 자세한 내용은 개인정보처리방침을 확인해 주세요.',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: '이용약관은 어디서 확인하나요?',
    answer: '서비스 내 이용안내 > 약관 및 정책에서 확인하실 수 있습니다.',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: '서비스 장애가 발생했어요.',
    answer: '일시적인 장애일 수 있습니다. 잠시 후 다시 시도해 주세요. 장애가 지속되면 고객센터로 문의해 주세요. 천재지변, 시스템 점검 등으로 인한 서비스 중단 시에는 앱 공지사항을 통해 안내해 드립니다.',
    isHomeFeatured: false,
  },
  {
    category: 'other',
    question: '불법 거래로 의심되면 어떻게 되나요?',
    answer: 'PLIC은 모든 거래를 검토하며, 신용카드 현금화(카드깡), 가공거래, 허위거래 등 불법 거래가 확인될 경우 거래가 거절되고 계정이 정지됩니다. 불법 거래 시 민사/형사/세무상의 모든 책임은 회원 본인에게 있습니다. 또한, 거래 증빙 서류를 위변조하여 등록하는 경우, 형법 제231조(사문서위조) 및 제234조(위조사문서행사)에 의거하여 5년 이하의 징역 또는 1천만원 이하의 벌금에 처해질 수 있습니다.',
    isHomeFeatured: false,
  },
];

// ContentHelper의 카테고리 정의와 일치
const categoryMap: Record<string, string> = {
  'service': 'service',
  'payment': 'payment',
  'account': 'account',
  'transfer': 'transfer',
  'other': 'other',
};

export async function POST(request: NextRequest) {
  try {
    // 백엔드 API URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.plic.kr';

    // 어드민 토큰 가져오기 (헤더에서)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const results = {
      success: [] as string[],
      failed: [] as { question: string; error: string }[],
    };

    // FAQ 하나씩 생성
    for (let i = 0; i < faqData.length; i++) {
      const faq = faqData[i];
      try {
        const response = await fetch(`${API_BASE_URL}/admin/faqs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            isVisible: true,
            isHomeFeatured: faq.isHomeFeatured || false,
            priority: i + 1,
          }),
        });

        if (response.ok) {
          results.success.push(faq.question);
        } else {
          const errorData = await response.json().catch(() => ({}));
          results.failed.push({
            question: faq.question,
            error: errorData.message || `HTTP ${response.status}`,
          });
        }
      } catch (error: any) {
        results.failed.push({
          question: faq.question,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `FAQ 시드 완료: ${results.success.length}개 성공, ${results.failed.length}개 실패`,
      total: faqData.length,
      success: results.success.length,
      failed: results.failed,
    });
  } catch (error: any) {
    console.error('FAQ seed error:', error);
    return NextResponse.json(
      { error: error.message || 'FAQ 시드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET으로 FAQ 데이터 확인
export async function GET() {
  return NextResponse.json({
    message: 'FAQ 시드 데이터',
    count: faqData.length,
    categories: {
      service: faqData.filter(f => f.category === 'service').length,
      payment: faqData.filter(f => f.category === 'payment').length,
      account: faqData.filter(f => f.category === 'account').length,
      transfer: faqData.filter(f => f.category === 'transfer').length,
      other: faqData.filter(f => f.category === 'other').length,
    },
    data: faqData,
  });
}
