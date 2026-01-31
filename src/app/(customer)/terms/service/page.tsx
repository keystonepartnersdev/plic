'use client';

import { Header } from '@/components/common';

export default function ServiceTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서비스 이용약관" showBack />
      <div className="p-5 bg-white">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-lg font-bold mb-4">제1조 (목적)</h2>
          <p className="text-gray-700 mb-4">
            본 약관은 PLIC(이하 "회사")가 제공하는 카드 매입대금 정산대행 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제2조 (용어의 정의)</h2>
          <p className="text-gray-700 mb-4">
            1. "서비스"란 회사가 제공하는 카드 매입대금 정산대행 서비스를 말합니다.<br/>
            2. "회원"이란 본 약관에 동의하고 서비스 이용 계약을 체결한 자를 말합니다.<br/>
            3. "거래"란 회원이 서비스를 통해 신청한 카드 결제 및 송금 건을 말합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제3조 (약관의 효력 및 변경)</h2>
          <p className="text-gray-700 mb-4">
            1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.<br/>
            2. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제4조 (서비스의 제공)</h2>
          <p className="text-gray-700 mb-4">
            1. 회사는 회원에게 카드 매입대금 정산대행 서비스를 제공합니다.<br/>
            2. 서비스 이용 시간은 연중무휴, 1일 24시간을 원칙으로 합니다.<br/>
            3. 회사는 시스템 정기점검, 증설 및 교체 등의 사유로 서비스를 일시 중단할 수 있습니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제5조 (수수료)</h2>
          <p className="text-gray-700 mb-4">
            1. 회원은 서비스 이용에 따른 수수료를 납부해야 합니다.<br/>
            2. 수수료율은 회원 등급에 따라 차등 적용됩니다.<br/>
            3. 수수료율 변경 시 회사는 사전에 회원에게 고지합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제6조 (회원의 의무)</h2>
          <p className="text-gray-700 mb-4">
            1. 회원은 정확한 정보를 제공해야 합니다.<br/>
            2. 회원은 타인의 정보를 도용하거나 허위 정보를 제공해서는 안 됩니다.<br/>
            3. 회원은 관련 법령 및 본 약관의 규정을 준수해야 합니다.
          </p>

          <p className="text-gray-500 text-sm mt-8">
            시행일: 2024년 1월 1일
          </p>

          {/* 사업자 정보 */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">사업자 정보</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>상호명: 주식회사 키스톤파트너스</p>
              <p>대표자: 방성민</p>
              <p>사업자등록번호: 583-88-01313</p>
              <p>주소: 경기도 안양시 동안구 흥안대로 457-27, 1동 지하 1층 비 117호(관양동)</p>
              <p>이메일: support@plic.kr</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
