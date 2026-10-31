import React, { useState } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  FileCheck,
  Bot,
  Send,
  HeartHandshake,
} from 'lucide-react';
import { ClassConfig, ReportItem, GeminiModelType } from '../types';
import { callGeminiWithFallback, getStoredApiKey } from '../utils/geminiHelper';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onOpenApiKeyModal: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onOpenApiKeyModal,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [usedModel, setUsedModel] = useState<GeminiModelType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'weekly_summary' | 'parent_advice' | 'pedagogical_plan'>('weekly_summary');

  if (!isOpen) return null;

  const handleRunAnalysis = async (selectedMode = mode) => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      onShowToast('Vui lòng cài đặt Gemini API Key trước!', '🔑');
      onOpenApiKeyModal();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Prepare history summary
    const summaryData = history.slice(0, 30).map((h) => ({
      date: h.dateDisplay || h.date,
      type: h.type,
      absentType: h.absentType,
      students: h.students.map((s) => s.name),
      violations: h.violationTags,
      commendations: h.commendationTags,
      note: h.customNote,
      period: h.period,
    }));

    let prompt = '';
    let systemInstruction = `Bạn là Trợ lý AI Cố vấn Giáo dục Chủ nhiệm chuyên nghiệp cho Giáo viên Chủ nhiệm (Thầy/Cô: ${config.teacherName || 'Phạm Hậu'}) tại trường ${config.schoolName || 'THPT'}, lớp ${config.className || '...'}. Ngôn từ chuẩn mực sư phạm, thấu hiểu tâm lý học sinh trung học, xây dựng và tích cực.`;

    if (selectedMode === 'weekly_summary') {
      prompt = `Hãy phân tích dữ liệu nề nếp và chuyên cần của lớp học sau đây:
Thông tin lớp: Lớp ${config.className}, Trường ${config.schoolName}, Sĩ số: ${config.students.length} học sinh.
Dữ liệu các bản ghi gần đây:
${JSON.stringify(summaryData, null, 2)}

Hãy soạn một bản Báo cáo Tổng kết Tuần bao gồm:
1. Đánh giá chung về tình hình chuyên cần và nề nếp (Tỷ lệ đi học, các mặt tích cực nổi bật).
2. Tuyên dương những học sinh/tổ có thành tích tốt hoặc nhiều tiến bộ.
3. Các vấn đề còn tồn đọng cần khắc phục (học sinh vi phạm, đi muộn, cần nêu tên tế nhị và lý do).
4. Đoạn nhận xét mẫu ngắn gọn, súc tích dành cho Giáo viên Chủ nhiệm nộp Ban Giám Hiệu.
5. Kế hoạch trọng tâm và khẩu hiệu thi đua cho tuần mới.`;
    } else if (selectedMode === 'parent_advice') {
      prompt = `Dựa vào dữ liệu vi phạm của các học sinh sau:
${JSON.stringify(summaryData.filter((d) => d.type === 'VIOLATION' || d.type === 'ABSENT'), null, 2)}

Hãy soạn 2 mẫu tin nhắn Zalo gửi phụ huynh học sinh có vi phạm:
- Mẫu 1: Nhắc nhở học sinh đi muộn hoặc vắng học nhiều buổi (giọng điệu thăm hỏi sức khỏe, lý do gia đình, nhắc nhở phối hợp).
- Mẫu 2: Nhắc nhở học sinh vi phạm quy chế trong giờ học (dùng điện thoại, mất trật tự) với tinh thần đồng hành, không trách móc gay gắt, đề xuất giải pháp cùng kèm cặp.`;
    } else {
      prompt = `Dựa trên dữ liệu nề nếp và chuyên cần lớp ${config.className}:
${JSON.stringify(summaryData, null, 2)}

Hãy đề xuất Kế hoạch Giáo Dục Kỷ Luật Tích Cực nhằm:
1. Giảm thiểu các lỗi vi phạm phổ biến mà học sinh trong lớp hay mắc phải.
2. Phương pháp khuyến khích các tổ thi đua học tốt, rèn luyện tốt.
3. Kịch bản một buổi sinh hoạt lớp 45 phút tương tác vui vẻ, gắn kết học sinh.`;
    }

    try {
      const res = await callGeminiWithFallback({
        prompt,
        systemInstruction,
      });
      setAnalysisResult(res.text);
      setUsedModel(res.usedModel);
      onShowToast('AI đã hoàn thành phân tích!', '✨');
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi gọi API Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    onShowToast('Đã sao chép nội dung vào Clipboard!', '📋');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Trợ Lý AI Chủ Nhiệm Thông Minh</h2>
              <p className="text-xs text-blue-100">
                Phân tích nề nếp, tự động nhận xét tuần & hỗ trợ soạn tin nhắn phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => {
              setMode('weekly_summary');
              handleRunAnalysis('weekly_summary');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'weekly_summary'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Tổng Hợp Báo Cáo Tuần Cho BGH</span>
          </button>

          <button
            onClick={() => {
              setMode('parent_advice');
              handleRunAnalysis('parent_advice');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'parent_advice'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Soạn Tin Nhắn Phụ Huynh Tinh Tế</span>
          </button>

          <button
            onClick={() => {
              setMode('pedagogical_plan');
              handleRunAnalysis('pedagogical_plan');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'pedagogical_plan'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Kỷ Luật Tích Cực & Gắn Kết</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-purple-600 animate-spin" />
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Trí tuệ nhân tạo Gemini đang phân tích...</p>
                <p className="text-xs text-slate-500 mt-1">Đang đọc lịch sử chuyên cần và tổng hợp số liệu</p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Không thể hoàn thành tác vụ AI:</span>
              </div>
              <p className="font-mono bg-white p-3 rounded-xl border border-rose-200 break-words">
                {errorMessage}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Bạn có thể kiểm tra lại API Key hoặc đổi mô hình AI.</span>
                <button
                  onClick={onOpenApiKeyModal}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
                >
                  Cài đặt lại API Key
                </button>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              {usedModel && (
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span>
                    Mô hình đã phản hồi: <strong className="text-purple-700 font-semibold">{usedModel}</strong>
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Hoàn tất thành công
                  </span>
                </div>
              )}

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans selection:bg-purple-200">
                {analysisResult}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
              <div className="max-w-md mx-auto">
                <p className="font-bold text-slate-700">Sẵn sàng phân tích nề nếp với Trí Tuệ Nhân Tạo</p>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn một trong các mục ở trên để hệ thống tự động tổng hợp số liệu của lớp {config.className} và viết bản phân tích chi tiết.
                </p>
              </div>
              <button
                onClick={() => handleRunAnalysis('weekly_summary')}
                className="mt-3 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Bắt đầu phân tích ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {analysisResult && !loading && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => handleRunAnalysis(mode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Phân tích lại</span>
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
