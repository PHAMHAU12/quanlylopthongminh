import React, { useState, useEffect } from 'react';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, Cpu, AlertCircle, RefreshCw } from 'lucide-react';
import {
  GEMINI_MODELS,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  callGeminiWithFallback,
} from '../utils/geminiHelper';
import { GeminiModelType } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3-flash-preview');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSelectedModel(getStoredModel());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    const currentKey = getStoredApiKey();
    if (!currentKey) {
      onShowToast('Bạn cần cài đặt API Key để sử dụng tính năng Trợ lý AI!', '🔑');
    }
    onClose();
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập API Key trước khi lưu.',
      });
      return;
    }
    setStoredApiKey(trimmed);
    setStoredModel(selectedModel);
    onShowToast('Đã lưu cấu hình Gemini AI thành công!', '🤖');
    onClose();
  };

  const handleTestKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập API Key để kiểm tra kết nối.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Temporarily save to test
    setStoredApiKey(trimmed);
    setStoredModel(selectedModel);

    try {
      const res = await callGeminiWithFallback({
        prompt: 'Xin chào Gemini! Trả lời ngắn gọn 1 câu để xác nhận kết nối thành công với QUẢN LÝ LỚP - PHẠM HẬU.',
      });

      setTestResult({
        success: true,
        message: `Kết nối thành công qua [${res.usedModel}]: "${res.text.trim()}"`,
      });
      onShowToast('API Key hợp lệ và hoạt động tốt!', '✨');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Lỗi kết nối: ${err.message || 'Không thể kết nối đến Gemini API'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cài Đặt Gemini AI & API Key</h2>
              <p className="text-xs text-blue-100">
                Kích hoạt trợ lý AI thông minh cho lớp học
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Guide to obtain key */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-bold flex items-center justify-between">
                <span>Cách lấy Google Gemini API Key hoàn toàn miễn phí:</span>
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 underline bg-white px-2 py-0.5 rounded shadow-xs"
                >
                  Lấy API Key tại đây <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Đăng nhập tài khoản Google của bạn tại Google AI Studio, chọn <strong>Create API Key</strong>, sau đó sao chép chuỗi mã dán vào ô bên dưới. Khóa API được lưu an toàn tại trình duyệt của bạn.
              </p>
            </div>
          </div>

          {/* Step 2: Input API Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gemini API Key của bạn
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                {apiKey ? '🔒 Đã nhập' : 'Chưa nhập'}
              </span>
            </div>
          </div>

          {/* Step 3: Model Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Lựa chọn mô hình AI (Hỗ trợ tự động Fallback chuyển đổi)
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {GEMINI_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.recommended
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * Khi một model gặp lỗi hoặc hết hạn mức (429 Rate Limit), hệ thống sẽ tự động thử lần lượt các model tiếp theo.
            </p>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium leading-relaxed">{testResult.message}</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isTesting || !apiKey}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Kiểm tra kết nối</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm transition cursor-pointer"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
