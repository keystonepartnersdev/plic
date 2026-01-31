/**
 * 모바일 프레임 레이아웃 규칙 검증 스크립트
 *
 * 실행: npx ts-node scripts/validate-layout.ts
 * 또는: npm run validate:layout
 */

import * as fs from 'fs';
import { glob } from 'glob';

const CUSTOMER_PAGES_DIR = 'src/app/(customer)';

interface ValidationResult {
  file: string;
  line: number;
  issue: string;
  severity: 'error' | 'warning';
  code: string;
}

async function validateLayout(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // (customer) 폴더의 모든 TSX 파일 검색
  const files = await glob(`${CUSTOMER_PAGES_DIR}/**/*.tsx`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 규칙 1: fixed 포지션 금지 (고객용 UI)
      if (/className\s*=\s*["'][^"']*\bfixed\b/.test(line)) {
        results.push({
          file,
          line: lineNum,
          issue: '고객용 UI에서 fixed 포지션 사용 금지. absolute 사용 권장.',
          severity: 'error',
          code: 'LAYOUT-001',
        });
      }

      // 규칙 2: viewport 기준 중앙 배치 금지
      if (/className\s*=\s*["'][^"']*\b(top-1\/2|left-1\/2|-translate-x-1\/2|-translate-y-1\/2)\b/.test(line)) {
        results.push({
          file,
          line: lineNum,
          issue: 'viewport 기준 중앙 배치 감지. 모바일 프레임 기준 배치 권장.',
          severity: 'warning',
          code: 'LAYOUT-002',
        });
      }

      // 규칙 3: z-index 표준화 확인 (비표준 값)
      const zIndexMatch = line.match(/\bz-(\d+)\b/);
      if (zIndexMatch) {
        const zValue = parseInt(zIndexMatch[1], 10);
        const allowedValues = [0, 10, 20, 40, 50, 60];

        if (!allowedValues.includes(zValue)) {
          results.push({
            file,
            line: lineNum,
            issue: `비표준 z-index 값 (z-${zValue}). zIndexClasses 사용 권장.`,
            severity: 'warning',
            code: 'LAYOUT-003',
          });
        }
      }

      // 규칙 4: 하드코딩된 z-index 인라인 스타일
      if (/style\s*=\s*\{[^}]*zIndex\s*:/.test(line)) {
        results.push({
          file,
          line: lineNum,
          issue: '인라인 스타일 zIndex 감지. zIndexClasses 또는 zIndexValues 사용 권장.',
          severity: 'warning',
          code: 'LAYOUT-004',
        });
      }
    });
  }

  return results;
}

// 실행
(async () => {
  console.log('🔍 모바일 프레임 레이아웃 검증 시작...\n');

  try {
    const results = await validateLayout();

    if (results.length === 0) {
      console.log('✅ 모든 레이아웃 규칙 준수\n');
      process.exit(0);
    }

    // 에러와 경고 분리
    const errors = results.filter((r) => r.severity === 'error');
    const warnings = results.filter((r) => r.severity === 'warning');

    console.log(`❌ ${errors.length}개 에러, ⚠️  ${warnings.length}개 경고 발견\n`);

    // 에러 출력
    if (errors.length > 0) {
      console.log('🔴 Errors:\n');
      errors.forEach((r) => {
        console.log(`  [${r.code}] ${r.file}:${r.line}`);
        console.log(`    ${r.issue}\n`);
      });
    }

    // 경고 출력
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      warnings.forEach((r) => {
        console.log(`  [${r.code}] ${r.file}:${r.line}`);
        console.log(`    ${r.issue}\n`);
      });
    }

    // 에러가 있으면 exit 1
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
    process.exit(1);
  }
})();
