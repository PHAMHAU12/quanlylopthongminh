import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReportForm } from './components/ReportForm';
import { PreviewCard } from './components/PreviewCard';
import { ConfigModal } from './components/ConfigModal';
import { HistoryModal } from './components/HistoryModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { ParentZaloModal } from './components/ParentZaloModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ClassDashboardModal } from './components/ClassDashboardModal';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import {
  ClassConfig,
  ReportType,
  AbsentType,
  Student,
  ReportItem,
} from './types';
import { DEFAULT_CONFIG, POPULAR_SCHOOLS } from './data/defaultData';
import {
  generateReportMessage,
  cleanPhoneNumber,
  getZaloLink,
  formatVietnameseDate,
} from './utils/zaloHelper';
import { getStoredApiKey } from './utils/geminiHelper';

const STORAGE_KEY_CONFIG = 'app_class_zalo_config';
const STORAGE_KEY_HISTORY = 'app_class_zalo_history';

export default function App() {
  // Class configuration loaded from LocalStorage
  const [config, setConfig] = useState<ClassConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading config from LocalStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  // History records loaded from LocalStorage
  const [history, setHistory] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading history from LocalStorage', e);
    }
    return [];
  });

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isParentZaloOpen, setIsParentZaloOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState(false);

  // Form State
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [period, setPeriod] = useState<string>('Tiết 1');
  const [subject, setSubject] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('ABSENT');
  const [absentType, setAbsentType] = useState<AbsentType>('EXCUSED');
  const [violationTags, setViolationTags] = useState<string[]>([]);
  const [commendationTags, setCommendationTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Auto-open API Key Modal if user hasn't configured it yet (Required by AI_INSTRUCTIONS.md)
  useEffect(() => {
    const key = getStoredApiKey();
    if (!key) {
      setIsApiKeyOpen(true);
    }
  }, []);

  // Toast feedback state
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon: string }>({
    visible: false,
    message: '',
    icon: '✅',
  });

  const showToast = (message: string, icon = '✅') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Persist config whenever it changes
  const handleSaveConfig = (newConfig: ClassConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      showToast('Đã lưu cấu hình lớp thành công!', '✅');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  // Persist history
  const saveHistory = (items: ReportItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  // Realtime calculated message
  const messageText = useMemo(() => {
    return generateReportMessage({
      config,
      reportType,
      absentType,
      selectedStudents,
      violationTags,
      commendationTags,
      customNote,
      dateStr,
      period,
      subject,
    });
  }, [
    config,
    reportType,
    absentType,
    selectedStudents,
    violationTags,
    commendationTags,
    customNote,
    dateStr,
    period,
    subject,
  ]);

  // Validation
  const validateForm = (): boolean => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh trong danh sách!', '⚠️');
      return false;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc nhập ghi chú!', '⚠️');
      return false;
    }
    if (
      reportType === 'COMMENDATION' &&
      commendationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 mục tuyên dương hoặc ghi chú!', '⚠️');
      return false;
    }
    if (!config.zaloPhone.trim()) {
      showToast('Vui lòng nhập Số Zalo của GVCN trong phần Cấu hình!', '⚠️');
      setIsConfigOpen(true);
      return false;
    }
    return true;
  };

  const createHistoryItem = (customMsg?: string): ReportItem => {
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      date: dateStr,
      dateDisplay: formatVietnameseDate(dateStr),
      period,
      subject,
      type: reportType,
      absentType: reportType === 'ABSENT' ? absentType : undefined,
      violationTags: reportType === 'VIOLATION' ? violationTags : [],
      commendationTags: reportType === 'COMMENDATION' ? commendationTags : [],
      customNote,
      students: selectedStudents,
      reporter: config.reporterName || 'Ban cán sự',
      teacherName: config.teacherName,
      className: config.className,
      schoolName: config.schoolName,
      formattedMessage: customMsg || messageText,
    };
  };

  // Handle Send to Zalo
  const handleSendToZalo = (customMsg?: string) => {
    if (!validateForm()) return;
    const msgToSend = customMsg || messageText;

    // 1. Copy message automatically to clipboard
    navigator.clipboard.writeText(msgToSend).catch(() => {});

    // 2. Save to history
    const newItem = createHistoryItem(msgToSend);
    saveHistory([newItem, ...history]);

    // 3. Open Zalo chat
    const zaloUrl = getZaloLink(config.zaloPhone);
    showToast('Đã chép nội dung! Đang mở cửa sổ Zalo với GVCN...', '🚀');

    setTimeout(() => {
      window.open(zaloUrl, '_blank');
    }, 250);
  };

  // Handle Copy message
  const handleCopyText = (textToCopy?: string) => {
    navigator.clipboard
      .writeText(textToCopy || messageText)
      .then(() => {
        showToast('Đã sao chép nội dung báo cáo vào Clipboard!', '📋');
      })
      .catch(() => {
        showToast('Lỗi khi sao chép. Vui lòng thử lại!', '❌');
      });
  };

  // Handle Save to history without opening Zalo
  const handleSaveToHistory = (customMsg?: string) => {
    if (!validateForm()) return;
    const newItem = createHistoryItem(customMsg || messageText);
    saveHistory([newItem, ...history]);
    showToast('Đã lưu lượt báo cáo vào Nhật ký!', '💾');
  };

  // Handle Reset form
  const handleResetForm = () => {
    setSelectedStudents([]);
    setViolationTags([]);
    setCommendationTags([]);
    setCustomNote('');
    setSubject('');
    showToast('Đã làm mới biểu mẫu để nhập báo cáo tiếp theo!', '🔄');
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
  };

  // Update student parent phone inline and persist to config
  const handleUpdateStudentParentPhone = (studentId: string, newPhone: string) => {
    const updatedStudents = config.students.map((s) =>
      s.id === studentId ? { ...s, parentPhone: newPhone } : s
    );
    const newConfig = { ...config, students: updatedStudents };
    handleSaveConfig(newConfig);

    // Also update selectedStudents if present
    setSelectedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, parentPhone: newPhone } : s))
    );
  };

  const handleOpenParentZaloModal = () => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh để gửi báo cáo phụ huynh!', '⚠️');
      return;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc ghi chú trước khi gửi!', '⚠️');
      return;
    }
    setIsParentZaloOpen(true);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử báo cáo?')) {
      saveHistory([]);
      showToast('Đã xóa toàn bộ lịch sử.', '🗑️');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col pb-16">
      {/* Header Bar */}
      <Header
        config={config}
        historyCount={history.length}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenAi={() => setIsAiAnalysisOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 w-full flex-1">
        {/* Welcome / Quick status banner */}
        <div className="mb-5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              📢
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Báo cáo nề nếp học sinh - Gửi Zalo GVCN
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận nhanh vắng học, vi phạm nội quy và tạo tin nhắn chuẩn mực gửi thẳng đến Zalo Giáo viên chủ nhiệm.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* School Dropdown: Teacher self-loaded schools */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/90 rounded-xl border border-blue-200/80 text-xs shadow-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1 shrink-0">
                <span>🏫</span> Trường THPT:
              </span>
              <select
                value={config.schoolName}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsConfigOpen(true);
                  } else {
                    handleSaveConfig({ ...config, schoolName: e.target.value });
                    showToast(`Đã chọn trường: ${e.target.value}`, '🏫');
                  }
                }}
                className="bg-transparent font-bold text-blue-700 outline-none cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
                title="Nhấn vào để chọn trường THPT đã nạp hoặc tự nạp trường mới"
              >
                {/* Dynamically list teacher's loaded schools */}
                <option value={config.schoolName} className="text-slate-800 font-bold">
                  {config.schoolName}
                </option>
                {(() => {
                  try {
                    const stored = localStorage.getItem('app_saved_high_schools');
                    if (stored) {
                      const list = JSON.parse(stored);
                      if (Array.isArray(list)) {
                        return list
                          .filter((s) => s !== config.schoolName)
                          .map((s) => (
                            <option key={s} value={s} className="text-slate-800">
                              {s}
                            </option>
                          ));
                      }
                    }
                  } catch (e) {}
                  return null;
                })()}
                <option value="__NEW__" className="text-blue-700 font-bold">
                  ✏️ Tự nạp / Đổi trường THPT khác...
                </option>
              </select>
            </div>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-xs text-slate-700 hover:text-blue-700 font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer border border-slate-200 shadow-xs"
              title="Cài đặt tên lớp hoặc danh sách học sinh"
            >
              Lớp: <strong className="text-blue-700">{config.className || 'Chưa đặt'}</strong> ({config.students.length} bạn)
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Student selector */}
          <div className="lg:col-span-7">
            <ReportForm
              config={config}
              dateStr={dateStr}
              setDateStr={setDateStr}
              period={period}
              setPeriod={setPeriod}
              subject={subject}
              setSubject={setSubject}
              reportType={reportType}
              setReportType={setReportType}
              absentType={absentType}
              setAbsentType={setAbsentType}
              violationTags={violationTags}
              setViolationTags={setViolationTags}
              commendationTags={commendationTags}
              setCommendationTags={setCommendationTags}
              customNote={customNote}
              setCustomNote={setCustomNote}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Right Column: Real-time Zalo Preview & Direct Action */}
          <div className="lg:col-span-5">
            <PreviewCard
              config={config}
              messageText={messageText}
              hasStudentsSelected={selectedStudents.length > 0}
              selectedStudentsCount={selectedStudents.length}
              onSendToZalo={handleSendToZalo}
              onOpenParentZaloModal={handleOpenParentZaloModal}
              onCopyText={handleCopyText}
              onSaveToHistory={handleSaveToHistory}
              onResetForm={handleResetForm}
              onOpenConfig={() => setIsConfigOpen(true)}
              onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ParentZaloModal
        isOpen={isParentZaloOpen}
        onClose={() => setIsParentZaloOpen(false)}
        config={config}
        selectedStudents={selectedStudents}
        reportType={reportType}
        absentType={absentType}
        violationTags={violationTags}
        commendationTags={commendationTags}
        customNote={customNote}
        dateStr={dateStr}
        period={period}
        subject={subject}
        onUpdateStudentParentPhone={handleUpdateStudentParentPhone}
        onShowToast={showToast}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        config={config}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onShowToast={showToast}
      />

      <StandaloneExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onShowToast={showToast}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onShowToast={showToast}
      />

      <ClassDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
      />

      <AiAnalysisModal
        isOpen={isAiAnalysisOpen}
        onClose={() => setIsAiAnalysisOpen(false)}
        config={config}
        history={history}
        onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
        onShowToast={showToast}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none max-w-sm ${
          toast.visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80">
          <span className="text-base">{toast.icon}</span>
          <span className="font-medium text-slate-100">{toast.message}</span>
        </div>
      </div>
    </div>
  );
}
