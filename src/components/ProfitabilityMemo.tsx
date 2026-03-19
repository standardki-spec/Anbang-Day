import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowRightLeft, Loader2 } from 'lucide-react';
import { ProfitabilityData } from '../data/mockData';
import { googleSheetsService } from '../services/googleSheets';

interface MemoItem {
  id: string;
  topic: string;
  accountName?: string;
  descriptions: string[];
  impact: 'positive' | 'negative';
}

interface ProfitabilityMemoProps {
  year: number;
  month: number;
  data: ProfitabilityData;
  onSaveSuccess?: () => void;
}

export const ProfitabilityMemo: React.FC<ProfitabilityMemoProps> = ({ year, month, data, onSaveSuccess }) => {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editMemos, setEditMemos] = useState<MemoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const storageKey = `profitability_memo_${year}_${month}`;

  useEffect(() => {
    // Priority: 1. Google Sheets data (if available) 2. Local Storage
    if (data.savedReason) {
      try {
        const parsed = JSON.parse(data.savedReason);
        if (Array.isArray(parsed)) {
          const currentMemos = parsed.map((item: any) => ({
            ...item,
            descriptions: item.descriptions || (item.description ? [item.description] : [''])
          }));
          setMemos(currentMemos);
          localStorage.setItem(storageKey, JSON.stringify(currentMemos));
          setIsEditing(false);
          return;
        }
      } catch (e) {
        // If not JSON, it might be raw text. We'll handle it as a single memo if needed, 
        // but for now let's fall back to local storage or empty.
        console.log('Saved reason is not JSON, falling back to local storage');
      }
    }

    const stored = localStorage.getItem(storageKey);
    let currentMemos: MemoItem[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        currentMemos = parsed.map((item: any) => ({
          ...item,
          descriptions: item.descriptions || (item.description ? [item.description] : [''])
        }));
        setMemos(currentMemos);
      } catch (e) {
        console.error(e);
      }
    } else {
      setMemos([]);
    }
    
    setIsEditing(false);
  }, [year, month, storageKey, data.savedReason]);

  const handleEdit = () => {
    setEditMemos([...memos]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanedMemos = editMemos.map(memo => ({
        ...memo,
        descriptions: memo.descriptions.filter(d => d.trim() !== '')
      }));
      
      // Save to local storage
      setMemos(cleanedMemos);
      localStorage.setItem(storageKey, JSON.stringify(cleanedMemos));
      
      // Save to Google Sheets via GAS
      // We send the JSON string so we can restore it later
      await googleSheetsService.saveReason(year, month, JSON.stringify(cleanedMemos));
      
      setIsEditing(false);
      // alert('성공적으로 저장되었습니다.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Failed to save to Google Sheets', error);
      // alert('구글 시트 저장에 실패했습니다. 네트워크 상태를 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const addMemo = () => {
    setEditMemos([...editMemos, { id: Date.now().toString(), topic: '', descriptions: [''], impact: 'positive' }]);
  };

  const updateMemo = (id: string, field: keyof MemoItem, value: any) => {
    setEditMemos(editMemos.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleImpact = (id: string) => {
    setEditMemos(editMemos.map(m => {
      if (m.id === id) {
        return { ...m, impact: m.impact === 'positive' ? 'negative' : 'positive' };
      }
      return m;
    }));
  };

  const updateDescription = (memoId: string, index: number, value: string) => {
    setEditMemos(editMemos.map(m => {
      if (m.id === memoId) {
        const newDescs = [...m.descriptions];
        newDescs[index] = value;
        return { ...m, descriptions: newDescs };
      }
      return m;
    }));
  };

  const addDescription = (memoId: string) => {
    setEditMemos(editMemos.map(m => {
      if (m.id === memoId) {
        return { ...m, descriptions: [...m.descriptions, ''] };
      }
      return m;
    }));
  };

  const removeDescription = (memoId: string, index: number) => {
    setEditMemos(editMemos.map(m => {
      if (m.id === memoId) {
        const newDescs = m.descriptions.filter((_, idx) => idx !== index);
        return { ...m, descriptions: newDescs.length > 0 ? newDescs : [''] };
      }
      return m;
    }));
  };

  const removeMemo = (id: string) => {
    setEditMemos(editMemos.filter(m => m.id !== id));
  };

  return (
    <div className="h-full flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">주요 변동 사유</h3>
        <div>
          {!isEditing ? (
            <button onClick={handleEdit} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" title="수정">
              <Edit2 size={18} />
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className={`p-2 rounded-full transition-colors ${isSaving ? 'text-gray-300' : 'text-green-600 hover:bg-green-50'}`} 
                title="저장"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              </button>
              <button onClick={handleCancel} disabled={isSaving} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="취소">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {!isEditing ? (
          memos.length > 0 ? (
            <div className="space-y-6">
              {memos.map(memo => (
                <div key={memo.id} className="flex flex-col gap-2">
                  <div className={`font-bold text-lg ${memo.impact === 'positive' ? 'text-blue-600' : 'text-red-600'}`}>
                    {memo.topic} {memo.impact === 'positive' ? '(+)' : '(-)'}
                  </div>
                  {memo.descriptions && memo.descriptions.length > 0 ? (
                    <ul className="list-disc list-outside ml-5 text-base text-gray-800 space-y-1.5 leading-relaxed">
                      {memo.descriptions.map((desc, idx) => (
                        <li key={idx} className="pl-1 whitespace-pre-wrap">{desc}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-base text-gray-400 italic pl-3 border-l-2 border-gray-200">설명 없음</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-base italic flex h-full items-center justify-center text-center">
              등록된 변동 사유가 없습니다.<br/>우측 상단의 수정 버튼을 눌러 추가해보세요.
            </div>
          )
        ) : (
          <div className="space-y-4">
            {editMemos.map(memo => (
              <div key={memo.id} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                <button 
                  onClick={() => removeMemo(memo.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
                               <div className="flex flex-col gap-3 mb-4 pr-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleImpact(memo.id)}
                      className={`px-3 py-2 text-sm font-bold rounded-md border transition-all duration-200 flex items-center gap-2 min-w-[100px] justify-center ${
                        memo.impact === 'positive' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      }`}
                      title="클릭하여 긍정/부정 전환"
                    >
                      <ArrowRightLeft size={14} className="opacity-70" />
                      {memo.impact === 'positive' ? '긍정 (+)' : '부정 (-)'}
                    </button>
                    
                    <input 
                      type="text"
                      placeholder="주제 입력 (예: 매출원가 감소)"
                      value={memo.topic}
                      onChange={(e) => updateMemo(memo.id, 'topic', e.target.value)}
                      className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {memo.descriptions.map((desc, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-2 text-gray-400 text-xs">●</span>
                      <textarea 
                        placeholder="상세 설명 입력" 
                        value={desc}
                        onChange={(e) => updateDescription(memo.id, idx, e.target.value)}
                        rows={2}
                        className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                      />
                      <button 
                        onClick={() => removeDescription(memo.id, idx)} 
                        className="mt-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="설명 삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addDescription(memo.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-4 mt-2 font-medium"
                  >
                    <Plus size={14} /> 설명 추가
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={addMemo}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              <span className="font-medium">새 항목 추가</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
