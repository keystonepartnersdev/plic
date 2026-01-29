'use client';

import { Header } from '@/components/common';

export default function MarketingTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="마케팅 정보 수신 동의" showBack />
      <div className="p-5 bg-white">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-6">
            주식회사 키스톤 파트너스(이하 "회사")는 PLIC 서비스와 관련된 다양한 정보 및 혜택을 제공하기 위해 아래와 같이 마케팅 정보 수신에 대한 동의를 요청합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">1. 수집 및 이용 목적</h2>
          <p className="text-gray-700 mb-4">
            회사는 아래의 목적으로 개인정보를 수집하고 이용합니다:
          </p>
          <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
            <li>신규 서비스 및 이벤트 정보 안내</li>
            <li>프로모션 및 할인 혜택 제공</li>
            <li>서비스 이용 관련 유용한 정보 제공</li>
            <li>맞춤형 서비스 및 상품 추천</li>
            <li>각종 마케팅 활동 및 광고성 정보 전송</li>
          </ul>

          <h2 className="text-lg font-bold mb-4">2. 수집하는 개인정보 항목</h2>
          <p className="text-gray-700 mb-2 font-medium">필수 항목</p>
          <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
            <li>이름</li>
            <li>휴대전화번호</li>
            <li>이메일 주소</li>
            <li>사업자등록번호</li>
            <li>상호명</li>
            <li>대표자명</li>
            <li>업종 및 업태</li>
          </ul>

          <h2 className="text-lg font-bold mb-4">3. 개인정보의 보유 및 이용 기간</h2>
          <p className="text-gray-700 mb-4">
            <strong>동의일로부터 회원 탈퇴 시 또는 마케팅 수신 동의 철회 시까지</strong>
          </p>
          <p className="text-gray-700 mb-4">
            다만, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 요구하는 기간 동안 보관합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">4. 마케팅 정보 수신 방법</h2>
          <p className="text-gray-700 mb-2">회사는 다음의 방법으로 마케팅 정보를 발송합니다:</p>

          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
            <div>
              <p className="font-medium text-gray-800">SMS (문자메시지)</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>신규 서비스 안내</li>
                <li>이벤트 및 프로모션 정보</li>
                <li>중요 공지사항</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800">이메일 (Email)</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>서비스 활용 가이드</li>
                <li>월간 뉴스레터</li>
                <li>특별 혜택 안내</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800">카카오톡 알림톡</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>주요 이벤트 안내</li>
                <li>프로모션 정보</li>
                <li>서비스 업데이트</li>
              </ul>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">5. 동의 거부 권리 및 불이익</h2>
          <p className="text-gray-700 mb-2">
            귀하는 위와 같은 마케팅 정보 수신에 대한 동의를 거부할 권리가 있습니다.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">동의를 거부하시는 경우:</p>
            <ul className="list-disc pl-5 text-blue-700 text-sm mt-1">
              <li>PLIC 서비스 이용에는 <strong>영향이 없습니다</strong></li>
              <li>다만, 각종 이벤트, 프로모션, 할인 혜택 등의 마케팅 정보를 받으실 수 없습니다</li>
            </ul>
          </div>

          <h2 className="text-lg font-bold mb-4">6. 마케팅 수신 동의 철회</h2>
          <p className="text-gray-700 mb-2">
            귀하는 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
            <div>
              <p className="font-medium text-gray-800">1) PLIC 앱 내 설정</p>
              <p className="text-gray-600 text-sm">마이페이지 &gt; 설정 &gt; 알림 설정 &gt; 마케팅 정보 수신 동의 해제</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">2) 수신 메시지 내 거부 링크</p>
              <p className="text-gray-600 text-sm">각 마케팅 메시지 하단의 "수신거부" 링크 클릭</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">3) 고객센터 문의</p>
              <p className="text-gray-600 text-sm">이메일: support@plic.kr</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">7. 개인정보의 제3자 제공</h2>
          <p className="text-gray-700 mb-4">
            회사는 마케팅 목적으로 고객의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
          </p>
          <p className="text-gray-700 mb-4">
            다만, 다음의 경우 제3자 제공이 발생할 수 있으며, 이 경우 별도 동의를 받습니다:
          </p>
          <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
            <li>제휴사 공동 프로모션 진행 시</li>
            <li>제3자 서비스 연계 혜택 제공 시</li>
          </ul>

          <h2 className="text-lg font-bold mb-4">8. 광고성 정보 전송 시간 제한</h2>
          <p className="text-gray-700 mb-2">
            회사는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 다음 시간대에는 마케팅 정보를 전송하지 않습니다:
          </p>
          <p className="text-gray-900 font-medium mb-4">
            전송 제한 시간: 오후 9시 ~ 다음날 오전 8시
          </p>
          <p className="text-gray-700 mb-2">다만, 다음의 경우는 예외로 합니다:</p>
          <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
            <li>회원이 명시적으로 동의한 경우</li>
            <li>긴급한 서비스 공지 (마케팅 아님)</li>
            <li>운영상 알림 (송금 완료 안내, 거래 보완 요청 안내, 거래 취소 안내)</li>
          </ul>

          <h2 className="text-lg font-bold mb-4">9. 마케팅 정보의 종류</h2>
          <div className="space-y-3 mb-4">
            <div>
              <p className="font-medium text-gray-800">정기 발송</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>월간 뉴스레터 (서비스 활용 팁, 업계 트렌드)</li>
                <li>신규 기능 안내</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800">이벤트/프로모션 (수시)</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>할인 이벤트</li>
                <li>수수료 할인 쿠폰</li>
                <li>제휴 혜택</li>
                <li>경품 이벤트</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800">맞춤형 정보 (개인화)</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm mt-1">
                <li>업종별 추천 정보</li>
                <li>사업 관련 유용한 콘텐츠</li>
                <li>서비스 이용 패턴 기반 추천</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
            <p className="text-yellow-800 text-sm">
              본 동의서는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조에 따른 동의입니다.
            </p>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            시행일: 2026년 1월 2일
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
