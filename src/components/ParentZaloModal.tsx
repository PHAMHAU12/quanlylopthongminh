import React, { useState } from 'react';
import {
  X,
  Phone,
  Send,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Save,
} from 'lucide-react';
import { ClassConfig, Student, ReportType, AbsentType } from '../types';
import {
  generateParentReportMessage,
  cleanPhoneNumber,
  getZaloLink,
} from '../utils/zaloHelper';

interface ParentZaloModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  selectedStudents: Student[];
  reportType: ReportType;
  absentType?: AbsentType;
  violationTags: string[];
  commendationTags: string[];
  customNote: string;
  dateStr: string;
  period: string;
  subject: string;
  onUpdateStudentParentPhone: (studentId: string, newPhone: string) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ParentZaloModal: React.FC<ParentZaloModalProps> = ({
  isOpen,
  onClose,
  config,
  selectedStudents,
  reportType,
  absentType,
  violationTags,
  commendationTags,
  customNote,
  dateStr,
  period,
  subject,
  onUpdateStudentParentPhone,
  onShowToast,
}) => {
  // Track which parents have been sent to in this session
  const [sentStudentIds, setSentStudentIds] = useState<Set<string>>(new Set());
  // Track which student's message preview is open
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  // Local state for editing phone numbers inline
  const [localPhones, setLocalPhones] = useState<Record<string, string>>({});
  // Track copy feedback for individual students
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getEffectivePhone = (student: Student) => {
    if (localPhones[student.id] !== undefined) {
      return localPhones[student.id];
    }
    return student.parentPhone || '';
  };

  const handlePhoneChange = (studentId: string, val: string) => {
    setLocalPhones((prev) => ({
      ...prev,
      [studentId]: val,
    }));
  };

  const handleSavePhone = (student: Student) => {
    const currentPhone = getEffectivePhone(student);
    const cleaned = cleanPhoneNumber(currentPhone);
    onUpdateStudentParentPhone(student.id, cleaned);
    onShowToast(`Đã lưu SĐT phụ huynh em ${student.name}!`, '💾');
  };

  const handleSendZaloToParent = (student: Student) => {
    const rawPhone = getEffectivePhone(student);
    const cleaned = cleanPhoneNumber(rawPhone);

    if (!cleaned) {
      onShowToast(`Vui lòng nhập Số Zalo phụ huynh của em ${student.name}!`, '⚠️');
      return;
    }

    // Save phone if changed
    if (cleaned !== student.parentPhone) {
      onUpdateStudentParentPhone(student.id, cleaned);
    }

    // Generate individual tailored message
    const msg = generateParentReportMessage({
      config,
      student,
      reportType,
      absentType,
      violationTags,
      commendationTags,
      customNote,
      dateStr,
      period,
      subject,
    });

    // 1. Copy to clipboard
    navigator.clipboard.writeText(msg).catch(() => {});

    // 2. Mark as sent
    setSentStudentIds((prev) => new Set(prev).add(student.id));

    // 3. Open Zalo chat
    const link = getZaloLink(cleaned);
    onShowToast(`Đã chép tin nhắn em ${student.name}! Đang mở Zalo phụ huynh...`, '🚀');

    setTimeout(() => {
      window.open(link, '_blank');
    }, 200);
  };

  const handleCopyParentMessage = (student: Student) => {
    const msg = generateParentReportMessage({
      config,
      student,
      reportType,
      absentType,
      violationTags,
      commendationTags,
      customNote,
      dateStr,
      period,
      subject,
    });

    navigator.clipboard.writeText(msg).then(() => {
      setCopiedStudentId(student.id);
      onShowToast(`Đã sao chép tin nhắn cho phụ huynh em ${student.name}!`, '📋');
      setTimeout(() => setCopiedStudentId(null), 2500);
    });
  };

  const handleCopyAllMessages = () => {
    if (selectedStudents.length === 0) return;

    const allMsgs = selectedStudents.map((student, idx) => {
      const msg = generateParentReportMessage({
        config,
        student,
        reportType,
        absentType,
        violationTags,
        commendationTags,
        customNote,
        dateStr,
        period,
        subject,
      });
      return `=== [${idx + 1}] PHỤ HUYNH EM ${student.name.toUpperCase()} (SĐT: ${getEffectivePhone(student) || 'Chưa có'}) ===\n\n${msg}`;
    }).join('\n\n\n');

    navigator.clipboard.writeText(allMsgs).then(() => {
      onShowToast(`Đã sao chép toàn bộ tin nhắn của ${selectedStudents.length} phụ huynh!`, '📋');
    });
  };

  const sentCount = selectedStudents.filter((s) => sentStudentIds.has(s.id)).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              👨‍👩‍👧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  Gửi Báo Cáo Zalo Đến Từng Phụ Huynh
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                  {selectedStudents.length} học sinh
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tự động tạo thông báo cá nhân hóa gửi trực tiếp đến Zalo của từng phụ huynh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress & Quick Actions Bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Tiến độ gửi:</span>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <strong className="text-emerald-700">{sentCount}</strong> / {selectedStudents.length} đã gửi
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyAllMessages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Sao chép tin nhắn tất cả phụ huynh</span>
          </button>
        </div>

        {/* Student Cards List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-100/50">
          {selectedStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa chọn học sinh nào để gửi báo cáo phụ huynh.
            </div>
          ) : (
            selectedStudents.map((student) => {
              const phone = getEffectivePhone(student);
              const cleanedPhone = cleanPhoneNumber(phone);
              const isSent = sentStudentIds.has(student.id);
              const isPreviewing = previewStudentId === student.id;
              const isCopied = copiedStudentId === student.id;

              const parentMsg = generateParentReportMessage({
                config,
                student,
                reportType,
                absentType,
                violationTags,
                commendationTags,
                customNote,
                dateStr,
                period,
                subject,
              });

              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-xl border p-3.5 sm:p-4 transition-all shadow-xs ${
                    isSent
                      ? 'border-emerald-300 ring-1 ring-emerald-400/40 bg-emerald-50/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Student Info & Phone Input */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isSent ? '✓' : `#${student.stt}`}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {student.name}
                          </h4>
                          {isSent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3" /> Đã gửi Zalo
                            </span>
                          )}
                        </div>

                        {/* Parent phone input */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="relative flex items-center">
                            <Phone className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => handlePhoneChange(student.id, e.target.value)}
                              placeholder="Nhập SĐT Zalo phụ huynh..."
                              className={`text-xs pl-6 pr-2 py-1 rounded-lg border font-mono w-44 focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                                !cleanedPhone
                                  ? 'border-amber-300 bg-amber-50/60 text-amber-900'
                                  : 'border-slate-200 bg-slate-50/60 text-slate-800'
                              }`}
                            />
                          </div>

                          {phone !== (student.parentPhone || '') && (
                            <button
                              type="button"
                              onClick={() => handleSavePhone(student)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Lưu số điện thoại này vào danh sách lớp"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!cleanedPhone && (
                            <span className="text-[11px] text-amber-600 italic">
                              (Cần có SĐT)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for this student */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Toggle Preview */}
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewStudentId(isPreviewing ? null : student.id)
                        }
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${
                          isPreviewing
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={isPreviewing ? 'Ẩn xem trước' : 'Xem trước tin nhắn phụ huynh'}
                      >
                        {isPreviewing ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ẩn tin</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Xem tin</span>
                          </>
                        )}
                      </button>

                      {/* Copy message */}
                      <button
                        type="button"
                        onClick={() => handleCopyParentMessage(student)}
                        className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Sao chép nội dung tin nhắn của phụ huynh này"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Sao chép</span>
                          </>
                        )}
                      </button>

                      {/* Main Send Zalo Button */}
                      <button
                        type="button"
                        onClick={() => handleSendZaloToParent(student)}
                        className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer ${
                          isSent
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSent ? 'Gửi lại Zalo' : 'Gửi Zalo'}</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Message Preview for this student */}
                  {isPreviewing && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                      <div className="bg-slate-900 rounded-xl p-3 text-slate-100 font-mono text-[11px] relative">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2 font-sans">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-emerald-400" />
                            Tin nhắn gửi Phụ huynh em: {student.name}
                          </span>
                          <span className="text-emerald-400 font-sans">
                            Zalo: {cleanedPhone ? `zalo.me/${cleanedPhone}` : 'Chưa có SĐT'}
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed select-all">
                          {parentMsg}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Bấm <strong>"Gửi Zalo"</strong> sẽ tự động sao chép tin nhắn riêng và mở hộp thoại Zalo với Phụ huynh.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
