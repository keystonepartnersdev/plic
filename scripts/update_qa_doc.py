#!/usr/bin/env python3
"""
QA 문서 진행률 자동 업데이트 스크립트
spec 파일에서 TC ID를 추출하여 QA 문서의 🔴→🟢로 업데이트
"""
import re
import os
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QA_DOC = os.path.join(PROJECT_ROOT, 'docs/testing/PLIC_QA_TESTCASE_v1.0.md')

# spec 파일 경로 패턴
SPEC_PATTERNS = [
    'tests/e2e/**/*.spec.ts',
]

def extract_tc_ids_from_specs():
    """모든 spec 파일에서 TC ID 추출"""
    tc_ids = set()
    for pattern in SPEC_PATTERNS:
        full_pattern = os.path.join(PROJECT_ROOT, pattern)
        for filepath in glob.glob(full_pattern, recursive=True):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            # test('TC-X.Y.Z-NNN: ...' 또는 test('TC-X.Y-NNN: ...' 패턴 매칭
            matches = re.findall(r"test\(['\"]+(TC-\d+\.\d+(?:\.\d+)?-\d+)", content)
            for tc_id in matches:
                tc_ids.add(tc_id)
    return tc_ids

def build_id_mapping(spec_ids):
    """
    spec의 TC ID → QA 문서의 TC ID 매핑
    예: TC-4.1.1-001 (spec) → TC-4.1-001 (QA doc) for section 4.x
    """
    mapping = {}
    for sid in spec_ids:
        mapping[sid] = sid  # 기본: 동일
    return mapping

def update_qa_document(spec_ids):
    """QA 문서에서 해당 TC의 🔴→🟢 업데이트"""
    with open(QA_DOC, 'r', encoding='utf-8') as f:
        content = f.read()

    updated_count = 0
    already_green = 0

    for tc_id in spec_ids:
        # QA 문서에서 해당 TC ID가 포함된 행 찾기 (🔴인 경우만)
        pattern = re.compile(
            r'(\| ' + re.escape(tc_id) + r' \|.*?\| )🔴( \|)',
            re.DOTALL
        )
        match = pattern.search(content)
        if match:
            content = pattern.sub(r'\g<1>🟢\g<2>', content)
            updated_count += 1
        else:
            # 이미 🟢인지 확인
            green_pattern = re.compile(r'\| ' + re.escape(tc_id) + r' \|.*?\| 🟢 \|')
            if green_pattern.search(content):
                already_green += 1

    # 4.x 섹션의 ID 매핑 (spec: TC-4.1.1-001 → doc: TC-4.1-001)
    section4_mapping = {
        # 4.1 동시성
        'TC-4.1.1-001': 'TC-4.1-001', 'TC-4.1.2-001': 'TC-4.1-002', 'TC-4.1.3-001': 'TC-4.1-003',
        'TC-4.1.1-002': 'TC-4.1-004', 'TC-4.1.2-002': 'TC-4.1-005', 'TC-4.1.3-002': 'TC-4.1-006',
        'TC-4.1.1-003': 'TC-4.1-007', 'TC-4.1.1-004': 'TC-4.1-008',
        # 4.2 한도제한
        'TC-4.2.1-001': 'TC-4.2-001', 'TC-4.2.1-002': 'TC-4.2-002',
        'TC-4.2.2-001': 'TC-4.2-003', 'TC-4.2.2-002': 'TC-4.2-004',
        'TC-4.2.3-001': 'TC-4.2-005', 'TC-4.2.3-002': 'TC-4.2-006',
        'TC-4.2.1-003': 'TC-4.2-007', 'TC-4.2.1-004': 'TC-4.2-008',
        # 4.3 만료/유효기간
        'TC-4.3.1-001': 'TC-4.3-001', 'TC-4.3.1-002': 'TC-4.3-002', 'TC-4.3.1-003': 'TC-4.3-003',
        'TC-4.3.2-001': 'TC-4.3-004', 'TC-4.3.2-002': 'TC-4.3-005',
        'TC-4.3.3-001': 'TC-4.3-006', 'TC-4.3.3-002': 'TC-4.3-007', 'TC-4.3.3-003': 'TC-4.3-008',
        # 4.4 외부연동실패
        'TC-4.4.1-001': 'TC-4.4-001', 'TC-4.4.1-002': 'TC-4.4-002', 'TC-4.4.1-003': 'TC-4.4-003', 'TC-4.4.1-004': 'TC-4.4-004',
        'TC-4.4.2-001': 'TC-4.4-005', 'TC-4.4.2-002': 'TC-4.4-006', 'TC-4.4.2-003': 'TC-4.4-007', 'TC-4.4.2-004': 'TC-4.4-008',
        'TC-4.4.3-001': 'TC-4.4-009', 'TC-4.4.3-002': 'TC-4.4-010', 'TC-4.4.3-003': 'TC-4.4-011',
        'TC-4.4.4-001': 'TC-4.4-012', 'TC-4.4.4-002': 'TC-4.4-013', 'TC-4.4.4-003': 'TC-4.4-014', 'TC-4.4.4-004': 'TC-4.4-015',
        'TC-4.4.4-005': 'TC-4.4-016', 'TC-4.4.4-006': 'TC-4.4-017',
        'TC-4.4.5-001': 'TC-4.4-018', 'TC-4.4.5-002': 'TC-4.4-019', 'TC-4.4.5-003': 'TC-4.4-020', 'TC-4.4.5-004': 'TC-4.4-021',
        # 4.5 데이터정합성
        'TC-4.5.1-001': 'TC-4.5-001', 'TC-4.5.1-002': 'TC-4.5-002',
        'TC-4.5.2-001': 'TC-4.5-003', 'TC-4.5.2-002': 'TC-4.5-004',
        'TC-4.5.3-001': 'TC-4.5-005', 'TC-4.5.3-002': 'TC-4.5-006', 'TC-4.5.3-003': 'TC-4.5-007',
        'TC-4.5.4-001': 'TC-4.5-008', 'TC-4.5.4-002': 'TC-4.5-009', 'TC-4.5.4-003': 'TC-4.5-010',
    }

    # 4.x 매핑 적용
    for spec_id, doc_id in section4_mapping.items():
        if spec_id in spec_ids:
            pattern = re.compile(
                r'(\| ' + re.escape(doc_id) + r' \|.*?\| )🔴( \|)',
                re.DOTALL
            )
            match = pattern.search(content)
            if match:
                content = pattern.sub(r'\g<1>🟢\g<2>', content)
                updated_count += 1

    return content, updated_count, already_green

def update_progress_table(content, spec_ids):
    """진행률 요약 테이블 업데이트"""
    # 각 섹션별 TC 수 계산
    section_counts = {}
    all_tc_ids_in_doc = re.findall(r'\| (TC-\d+\.\d+(?:\.\d+)?-\d+) \|', content)

    for tc_id in all_tc_ids_in_doc:
        # 섹션 추출: TC-1.4.1-001 → 1.4.1
        match = re.match(r'TC-(\d+\.\d+(?:\.\d+)?)-', tc_id)
        if match:
            section = match.group(1)
            if section not in section_counts:
                section_counts[section] = {'total': 0, 'done': 0}
            section_counts[section]['total'] += 1
            # 🟢인지 확인
            green_check = re.search(
                r'\| ' + re.escape(tc_id) + r' \|.*?\| 🟢 \|',
                content
            )
            if green_check:
                section_counts[section]['done'] += 1

    # 전체 합계 계산
    total_all = sum(s['total'] for s in section_counts.values())
    done_all = sum(s['done'] for s in section_counts.values())

    # 헤더 업데이트
    content = re.sub(
        r'> \*\*E2E 자동화\*\*: Playwright \(\d+/[\d,]+ = \d+%\)',
        f'> **E2E 자동화**: Playwright ({done_all}/{total_all:,} = {done_all*100//total_all}%)',
        content
    )

    # 합계 행 업데이트
    content = re.sub(
        r'\| \*\*합계\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+%\*\* \|',
        f'| **합계** | **{total_all}** | **{done_all}** | **{done_all*100//total_all}%** |',
        content
    )

    # 각 섹션별 진행률 행 업데이트
    section_name_map = {
        '1.1.1': '1.1.1 회원가입', '1.1.2': '1.1.2 로그인', '1.1.3': '1.1.3 로그아웃',
        '1.1.4': '1.1.4 토큰관리', '1.2.1': '1.2.1 거래생성', '1.2.2': '1.2.2 임시저장',
        '1.2.3': '1.2.3 거래목록', '1.2.4': '1.2.4 거래상세', '1.2.5': '1.2.5 거래수정',
        '1.2.6': '1.2.6 거래취소', '1.3.1': '1.3.1 결제페이지', '1.3.2': '1.3.2 카드결제',
        '1.3.3': '1.3.3 결제결과', '1.3.4': '1.3.4 결제취소',
        '1.4.1': '1.4.1 메인', '1.4.2': '1.4.2 정보수정', '1.4.3': '1.4.3 계좌관리',
        '1.4.4': '1.4.4 카드관리', '1.4.5': '1.4.5 등급안내', '1.4.6': '1.4.6 알림설정',
        '1.4.7': '1.4.7 설정', '1.4.8': '1.4.8 사업자정보',
        '1.5.1': '1.5.1 홈', '1.5.2': '1.5.2 가이드FAQ', '1.5.3': '1.5.3 공지사항', '1.5.4': '1.5.4 약관',
        '1.6.1': '1.6.1 할인코드적용', '1.6.2': '1.6.2 쿠폰',
    }

    for section, data in section_counts.items():
        name = section_name_map.get(section)
        if name:
            pct = data['done'] * 100 // data['total'] if data['total'] > 0 else 0
            old_pattern = re.compile(
                r'\| ' + re.escape(name) + r' \| \d+ \| \d+ \| \d+% \|'
            )
            new_row = f"| {name} | {data['total']} | {data['done']} | {pct}% |"
            content = old_pattern.sub(new_row, content)

    return content

def main():
    print("=== QA 문서 업데이트 스크립트 ===")

    # 1. spec에서 TC ID 추출
    spec_ids = extract_tc_ids_from_specs()
    print(f"spec 파일에서 {len(spec_ids)}개 TC ID 추출")

    # 2. QA 문서 업데이트
    content, updated, already = update_qa_document(spec_ids)
    print(f"🔴→🟢 업데이트: {updated}개")
    print(f"이미 🟢: {already}개")

    # 3. 진행률 테이블 업데이트
    content = update_progress_table(content, spec_ids)

    # 4. 저장
    with open(QA_DOC, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ QA 문서 업데이트 완료: {QA_DOC}")

if __name__ == '__main__':
    main()
