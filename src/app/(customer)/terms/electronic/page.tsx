'use client';

import { Header } from '@/components/common';

export default function ElectronicTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="전자금융거래 이용약관" showBack />
      <div className="p-5 bg-white">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-lg font-bold mb-4">제1조 (목적)</h2>
          <p className="text-gray-700 mb-4">
            본 약관은 PLIC(이하 "회사")가 제공하는 전자금융거래 서비스를 이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제2조 (용어의 정의)</h2>
          <p className="text-gray-700 mb-4">
            1. "전자금융거래"라 함은 회사가 전자적 장치를 통하여 제공하는 금융상품 및 서비스를 이용자가 전자적 장치를 통하여 비대면·자동화된 방식으로 직접 이용하는 거래를 말합니다.<br/>
            2. "접근매체"라 함은 전자금융거래에 있어서 거래지시를 하거나 이용자 및 거래내용의 진실성과 정확성을 확보하기 위하여 사용되는 수단을 말합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제3조 (접근매체의 관리)</h2>
          <p className="text-gray-700 mb-4">
            1. 이용자는 접근매체를 제3자에게 대여하거나 사용을 위임하거나 양도 또는 담보 목적으로 제공할 수 없습니다.<br/>
            2. 이용자는 접근매체의 분실이나 도난 등의 사고를 알게 되었을 때에는 즉시 회사에 신고하여야 합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제4조 (거래내용의 확인)</h2>
          <p className="text-gray-700 mb-4">
            1. 회사는 이용자와 미리 약정한 전자적 방법을 통하여 이용자의 거래내용을 확인할 수 있도록 합니다.<br/>
            2. 이용자는 거래내용에 이상이 있음을 안 때에는 즉시 회사에 이의를 제기하여야 합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제5조 (오류의 정정)</h2>
          <p className="text-gray-700 mb-4">
            1. 이용자는 전자금융거래에 오류가 있음을 안 때에는 회사에 그 정정을 요구할 수 있습니다.<br/>
            2. 회사는 이용자의 정정 요구를 받은 때에는 이를 즉시 조사하여 처리한 후 정정요구를 받은 날부터 2주 이내에 그 결과를 이용자에게 알려야 합니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제6조 (회사의 책임)</h2>
          <p className="text-gray-700 mb-4">
            1. 회사는 접근매체의 위조나 변조로 발생한 사고로 인하여 이용자에게 발생한 손해에 대하여 배상책임이 있습니다.<br/>
            2. 회사는 전자금융거래를 위한 전자적 장치 또는 정보통신망에 침입하여 거짓이나 그 밖의 부정한 방법으로 획득한 접근매체의 이용으로 발생한 사고로 인하여 이용자에게 발생한 손해에 대하여 배상책임이 있습니다.
          </p>

          <h2 className="text-lg font-bold mb-4">제7조 (분쟁처리 및 분쟁조정)</h2>
          <p className="text-gray-700 mb-4">
            1. 이용자는 회사의 서비스 이용과 관련하여 이의가 있을 경우 회사의 고객센터에 분쟁처리를 신청할 수 있습니다.<br/>
            2. 이용자는 회사의 분쟁처리 결과에 이의가 있는 경우 금융감독원에 분쟁조정을 신청할 수 있습니다.
          </p>

          <p className="text-gray-500 text-sm mt-8">
            시행일: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  );
}
