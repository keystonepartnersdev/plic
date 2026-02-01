'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Edit, Check, ChevronRight } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Terms {
  type: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<Terms[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerms, setSelectedTerms] = useState<Terms | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await adminAPI.getTerms();
      setTerms(response.terms);
    } catch (error: any) {
      console.error('약관 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTerms = (t: Terms) => {
    setSelectedTerms(t);
    setEditContent(t.content);
    setEditVersion(t.version);
    setEditEffectiveDate(t.effectiveDate);
    setMessage('');
  };

  const handleSave = async () => {
    if (!selectedTerms) return;

    setSaving(true);
    setMessage('');

    try {
      await adminAPI.updateTerms(selectedTerms.type as any, {
        content: editContent,
        version: editVersion,
        effectiveDate: editEffectiveDate,
      });

      setMessage('저장되었습니다.');
      fetchTerms();

      // 선택된 약관 업데이트
      setSelectedTerms(prev => prev ? {
        ...prev,
        content: editContent,
        version: editVersion,
        effectiveDate: editEffectiveDate,
      } : null);
    } catch (error: any) {
      setMessage(`저장 실패: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">약관 관리</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">약관 관리</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 약관 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">약관 목록</h2>
            </div>
            <div className="divide-y">
              {terms.map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleSelectTerms(t)}
                  className={cn(
                    'w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors',
                    selectedTerms?.type === t.type && 'bg-blue-50'
                  )}
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      v{t.version} · {t.effectiveDate}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 약관 편집 */}
        <div className="lg:col-span-2">
          {selectedTerms ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">{selectedTerms.title}</h2>
                <Link
                  href={`/terms/${selectedTerms.type}`}
                  target="_blank"
                  className="text-sm text-blue-500 hover:underline"
                >
                  미리보기
                </Link>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      버전
                    </label>
                    <input
                      type="text"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시행일
                    </label>
                    <input
                      type="date"
                      value={editEffectiveDate}
                      onChange={(e) => setEditEffectiveDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    약관 내용
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                    placeholder="약관 내용을 입력하세요..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    줄바꿈으로 문단을 구분하세요. &quot;제N조&quot; 또는 &quot;숫자.&quot;로 시작하면 제목으로 표시됩니다.
                  </p>
                </div>

                {message && (
                  <div className={cn(
                    'p-3 rounded-lg text-sm',
                    message.includes('실패') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  )}>
                    {message}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>좌측에서 편집할 약관을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
