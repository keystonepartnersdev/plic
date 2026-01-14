'use client';

import { Header } from '@/components/common';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="개인정보 처리방침" showBack />
      <div className="p-5 bg-white">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-lg font-bold mb-4">제1조 (개인정보의 수집 항목)</h2>
          <p className="text-gray-700 mb-4">
            회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.<br/><br/>
            <strong>필수항목:</strong> 이름, 이메일, 휴대폰 번호, 은행 계좌정보<br/>
            <strong>선택항목:</strong> 마케팅 수신 동의 여부
          </p>

          <h2 className="text-lg font-bold mb-4">제2조 (개인정보의 수집 및 이용 목적)</h2>
          <p className="text-gray-700 mb-4">
            1. 서비스 제공 및 계약 이행<br/>
            2. 회원 관리 및 본인 확인<br/>
            3. 거래 처리 및 송금 서비스 제공<br/>
            4. 고객 문의 응대 및 불만 처리<br/>
            5. 서비스 개선 및 신규 서비스 개발
          </p>

          <h2 className="text-lg font-bold mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p className="text-gray-700 mb-4">
            1. 회원 탈퇴 시까지 보유 및 이용<br/>
            2. 관련 법령에 따른 보존 기간<br/>
            - 계약 또는 청약철회 등에 관한 기록: 5년<br/>
            - 대금결제 및 재화 등의 공급에 관한 기록: 5년<br/>
            - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
          </p>

          <h2 className="text-lg font-bold mb-4">제4조 (개인정보의 제3자 제공)</h2>
          <p className="text-gray-700 mb-4">
            회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.<br/><br/>
            1. 회원이 사전에 동의한 경우<br/>
            2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
          </p>

          <h2 className="text-lg font-bold mb-4">제5조 (개인정보의 파기)</h2>
          <p className="text-gray-700 mb-4">
            1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br/>
            2. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제6조 (이용자의 권리)</h2>
          <p className="text-gray-700 mb-4">
            1. 회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.<br/>
            2. 회원은 언제든지 개인정보 처리의 정지를 요구할 수 있습니다.<br/>
            3. 회원은 회원 탈퇴를 통해 개인정보 수집 및 이용 동의를 철회할 수 있습니다.
          </p>

          <p className="text-gray-500 text-sm mt-8">
            시행일: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  );
}
