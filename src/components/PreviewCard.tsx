import React, { useState } from 'react';
import {
  Send,
  Copy,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  PhoneCall,
  ExternalLink,
  MessageCircle,
  Users,
} from 'lucide-react';
import { ClassConfig } from '../types';
import { cleanPhoneNumber, getZaloLink } from '../utils/zaloHelper';

interface PreviewCardProps {
  config: ClassConfig;
  messageText: string;
  hasStudentsSelected: boolean;
  selectedStudentsCount: number;
  onSendToZalo: (customMsg?: string) => void;
  onOpenParentZaloModal: () => void;
  onCopyText: (textToCopy?: string) => void;
  onSaveToHistory: (customMsg?: string) => void;
  onResetForm: () => void;
  onOpenConfig: () => void;
  onOpenApiKeyModal: () => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  config,
  messageText,
  hasStudentsSelected,
  selectedStudentsCount,
  onSendToZalo,
  onOpenParentZaloModal,
  onCopyText,
  onSaveToHistory,
  onResetForm,
  onOpenConfig,
  onOpenApiKeyModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [aiPolishedText, setAiPolishedText] = useState<string | null>(null);
  const cleanedPhone = cleanPhoneNumber(config.zaloPhone);
  const zaloUrl = getZaloLink(config.zaloPhone);

  const activeMessage = aiPolishedText || messageText;

  const handleCopy = () => {
    onCopyText(activeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAiPolish = async () => {
    const { getStoredApiKey, callGeminiWithFallback } = await import('../utils/geminiHelper');
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    setIsPolishing(true);
    try {
      const res = await callGeminiWithFallback({
        prompt: `Hãy hiệu đính và trau chuốt tin nhắn báo cáo nề nếp sau gửi cho Giáo viên chủ nhiệm (${config.teacherName || 'Phạm Hậu'}).
Yêu cầu: Giữ nguyên các thông tin thực tế (tên học sinh, tiết học, ngày, lỗi vi phạm/khen thưởng), trình bày thật rõ ràng, chuẩn mực sư phạm, lịch sự, dễ đọc trên Zalo điện thoại:
${messageText}`,
      });
      setAiPolishedText(res.text.trim());
    } catch (err: any) {
      alert(`Lỗi AI: ${err.message || 'Không thể trau chuốt tin nhắn'}`);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-sm font-bold text-slate-800">
            Xem trước tin nhắn gửi GVCN
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
          Tự động đồng bộ
        </span>
      </div>

      {/* Target Teacher & Phone display */}
      <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            Z
          </div>
          <div>
            <div className="font-bold text-blue-950">
              {config.teacherName || 'Chưa đặt tên GVCN'}
            </div>
            <div className="text-[11px] text-blue-700 font-mono">
              {cleanedPhone ? `SĐT Zalo: ${cleanedPhone}` : '⚠️ Chưa cấu hình SĐT Zalo'}
            </div>
          </div>
        </div>
        {!cleanedPhone && (
          <button
            onClick={onOpenConfig}
            className="text-[11px] text-rose-600 hover:underline font-bold"
          >
            Nhập SĐT ngay
          </button>
        )}
      </div>

      {/* Message Bubble Container */}
      <div className="bg-slate-900 rounded-xl p-3.5 shadow-inner text-slate-100 font-mono text-xs relative group">
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2 font-sans">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
            {aiPolishedText ? 'Bản trau chuốt bởi AI' : 'Nội dung báo cáo chuẩn hóa'}
          </span>
          <div className="flex items-center gap-2">
            {aiPolishedText ? (
              <button
                type="button"
                onClick={() => setAiPolishedText(null)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Về bản gốc
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={isPolishing}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded cursor-pointer transition disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${isPolishing ? 'animate-spin' : ''}`} />
                <span>{isPolishing ? 'Đang trau chuốt...' : 'AI trau chuốt'}</span>
              </button>
            )}
            <span className="text-[10px] text-slate-500">
              {activeMessage.length} ký tự
            </span>
          </div>
        </div>

        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-[380px] overflow-y-auto select-all pr-1">
          {activeMessage}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2.5">
        {/* Main Send Zalo Button to GVCN */}
        <button
          type="button"
          onClick={() => onSendToZalo(activeMessage)}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
          <span>Gửi báo cáo qua Zalo GVCN</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </button>

        {/* Send Zalo to Individual Parents Button */}
        <button
          type="button"
          onClick={onOpenParentZaloModal}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Users className="w-4 h-4 text-white" />
          <span>Gửi Zalo từng Phụ huynh ({selectedStudentsCount} học sinh)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </button>

        {/* Secondary Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-200 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Sao chép nội dung</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSaveToHistory(activeMessage)}
            className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-emerald-200 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lưu vào Nhật ký</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onResetForm}
          className="w-full py-2 px-3 text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Làm mới biểu mẫu (nhập báo cáo tiếp theo)</span>
        </button>
      </div>

      {/* Instructions / Helpful notice */}
      <div className="mt-3.5 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex gap-2">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Cách hoạt động:</strong> Khi bấm <em>"Gửi báo cáo qua Zalo"</em>, hệ thống sẽ tự động sao chép nội dung vào Clipboard và mở cửa sổ Zalo GVCN (<span className="font-mono text-amber-800">zalo.me/{cleanedPhone || '...'}</span>). Bạn chỉ cần dán (Ctrl+V hoặc Chạm Giữ & Dán) và gửi!
        </div>
      </div>
    </div>
  );
};
