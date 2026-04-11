import { NextRequest, NextResponse } from 'next/server';

// FAQ 질문별 카테고리 매핑
const questionCategoryMap: Record<string, string> = {
  // service
  'PLIC은 어떤 서비스인가요?': 'service',
  '누가 PLIC을 이용할 수 있나요?': 'service',
  '어떤 비용을 PLIC으로 결제할 수 있나요?': 'service',
  '수취인도 PLIC에 가입해야 하나요?': 'service',
  '거래 생성 시 어떤 서류를 첨부해야 하나요?': 'service',
  '거래 검토는 어떻게 진행되나요?': 'service',
  '검토에서 거절될 수도 있나요?': 'service',
  '서비스 이용 시간은 어떻게 되나요?': 'service',

  // payment
  '수수료는 얼마인가요?': 'payment',
  '어떤 카드를 사용할 수 있나요?': 'payment',
  '할부 결제가 가능한가요?': 'payment',
  '카드 혜택(포인트, 마일리지 등)도 적용되나요?': 'payment',
  '법인카드로도 결제할 수 있나요?': 'payment',
  '무기명 법인카드로 결제하려면 어떻게 해야 하나요?': 'payment',
  '결제 한도는 어떻게 되나요?': 'payment',
  '결제 영수증을 받을 수 있나요?': 'payment',
  '수수료도 세금계산서 발행이 되나요?': 'payment',

  // account
  '회원가입에 필요한 서류는 무엇인가요?': 'account',
  '개인(비사업자)도 가입할 수 있나요?': 'account',
  '휴업/폐업 상태인데 가입할 수 있나요?': 'account',
  '회원 등급 제도가 있나요?': 'account',
  '계정 정보를 변경하고 싶어요.': 'account',
  '회원 탈퇴는 어떻게 하나요?': 'account',
  '탈퇴 후 재가입이 가능한가요?': 'account',
  '계정이 정지되었어요. 왜 그런가요?': 'account',

  // transfer
  '송금은 얼마나 걸리나요?': 'transfer',
  '수취인이 받는 금액은 얼마인가요?': 'transfer',
  '어떤 은행으로 송금할 수 있나요?': 'transfer',
  '송금 취소가 가능한가요?': 'transfer',
  '환불은 얼마나 걸리나요?': 'transfer',
  '잘못된 계좌로 송금했어요. 어떻게 하나요?': 'transfer',
  '제 명의의 통장으로 송금받고 싶어요.': 'transfer',
  '송금 상태는 어디서 확인하나요?': 'transfer',

  // other
  '고객센터 운영시간은 어떻게 되나요?': 'other',
  '문의는 어떻게 하나요?': 'other',
  'PLIC 이용이 세금에 영향을 주나요?': 'other',
  '개인정보는 안전하게 보호되나요?': 'other',
  '이용약관은 어디서 확인하나요?': 'other',
  '서비스 장애가 발생했어요.': 'other',
  '불법 거래로 의심되면 어떻게 되나요?': 'other',
};

// 키워드 기반 카테고리 추론
function inferCategory(question: string): string {
  const q = question.toLowerCase();

  // 직접 매핑 먼저 시도
  if (questionCategoryMap[question]) {
    return questionCategoryMap[question];
  }

  // 키워드 기반 추론
  if (q.includes('서비스') || q.includes('이용') || q.includes('plic') || q.includes('플릭')) {
    return 'service';
  }
  if (q.includes('수수료') || q.includes('결제') || q.includes('카드') || q.includes('할부') || q.includes('영수증')) {
    return 'payment';
  }
  if (q.includes('회원') || q.includes('가입') || q.includes('탈퇴') || q.includes('계정') || q.includes('로그인')) {
    return 'account';
  }
  if (q.includes('송금') || q.includes('입금') || q.includes('이체') || q.includes('계좌') || q.includes('은행') || q.includes('환불')) {
    return 'transfer';
  }

  return 'other';
}

export async function POST(request: NextRequest) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.plic.kr';
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 1. 현재 FAQ 목록 가져오기
    const listResponse = await fetch(`${API_BASE_URL}/faqs`, {
      headers: { 'Authorization': authHeader },
    });

    if (!listResponse.ok) {
      throw new Error('FAQ 목록 조회 실패');
    }

    const { faqs } = await listResponse.json();

    const results = {
      updated: [] as string[],
      skipped: [] as string[],
      failed: [] as { question: string; error: string }[],
    };

    // 2. 각 FAQ에 카테고리 업데이트
    for (const faq of faqs) {
      // 이미 카테고리가 있으면 스킵
      if (faq.category && faq.category !== '') {
        results.skipped.push(faq.question);
        continue;
      }

      const category = inferCategory(faq.question);

      try {
        const updateResponse = await fetch(`${API_BASE_URL}/admin/faqs/${faq.faqId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ category }),
        });

        if (updateResponse.ok) {
          results.updated.push(`${faq.question} → ${category}`);
        } else {
          results.failed.push({
            question: faq.question,
            error: `HTTP ${updateResponse.status}`,
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
      message: `카테고리 업데이트 완료`,
      total: faqs.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error: any) {
    console.error('FAQ 카테고리 업데이트 오류:', error);
    return NextResponse.json(
      { error: error.message || '카테고리 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FAQ 카테고리 업데이트 API',
    usage: 'POST 요청으로 실행 (Authorization 헤더 필요)',
    categories: {
      service: '서비스 이용',
      payment: '결제/수수료',
      account: '계정/회원',
      transfer: '송금/입금',
      other: '기타',
    },
  });
}
