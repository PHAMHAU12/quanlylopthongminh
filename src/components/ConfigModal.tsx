import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  School,
  UserCheck,
  Phone,
  User,
  Users,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FileText,
  List,
  Sparkles,
  BookOpen,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { ClassConfig, Student } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG, POPULAR_SCHOOLS } from '../data/defaultData';
import { cleanPhoneNumber } from '../utils/zaloHelper';
import {
  exportStudentsToCsv,
  parseStudentsCsv,
  exportSystemBackup,
  readSystemBackup,
} from '../utils/excelHelper';

const STORAGE_KEY_SAVED_SCHOOLS = 'app_saved_high_schools';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSaveConfig: (newConfig: ClassConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [className, setClassName] = useState(config.className);
  const [teacherName, setTeacherName] = useState(config.teacherName);
  const [zaloPhone, setZaloPhone] = useState(config.zaloPhone);
  const [reporterName, setReporterName] = useState(config.reporterName);
  const [reporterRole, setReporterRole] = useState(config.reporterRole);

  const [activeRosterTab, setActiveRosterTab] = useState<'bulk' | 'list'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [editableStudents, setEditableStudents] = useState<Student[]>(config.students);

  // Teacher-loaded schools list
  const [savedSchools, setSavedSchools] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_SCHOOLS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      config.schoolName || 'THPT Chu Văn An',
      'THPT Lê Quý Đôn',
      'THPT Nguyễn Trãi',
      'THPT Nguyễn Huệ',
      'THPT Trần Phú',
    ];
  });

  const [showBulkSchoolsInput, setShowBulkSchoolsInput] = useState(false);
  const [bulkSchoolsText, setBulkSchoolsText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSchoolName(config.schoolName);
      setClassName(config.className);
      setTeacherName(config.teacherName);
      setZaloPhone(config.zaloPhone);
      setReporterName(config.reporterName);
      setReporterRole(config.reporterRole);
      setEditableStudents(config.students);
      setBulkText(
        config.students
          .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
          .join('\n')
      );

      // Ensure current school is in saved list
      if (config.schoolName && !savedSchools.includes(config.schoolName)) {
        setSavedSchools((prev) => [config.schoolName, ...prev]);
      }
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  // Add / Load custom school into teacher's saved list
  const handleAddSchoolToSaved = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (!savedSchools.includes(trimmed)) {
      const updated = [trimmed, ...savedSchools];
      setSavedSchools(updated);
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_SCHOOLS, JSON.stringify(updated));
      } catch (e) {}
    }
    setSchoolName(trimmed);
  };

  const handleDeleteSavedSchool = (e: React.MouseEvent, schoolToDelete: string) => {
    e.stopPropagation();
    const updated = savedSchools.filter((s) => s !== schoolToDelete);
    setSavedSchools(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SCHOOLS, JSON.stringify(updated));
    } catch (e) {}
    if (schoolName === schoolToDelete && updated.length > 0) {
      setSchoolName(updated[0]);
    }
  };

  const handleImportBulkSchools = () => {
    const lines = bulkSchoolsText.split('\n');
    const newItems: string[] = [];
    lines.forEach((l) => {
      let cleaned = l.trim();
      cleaned = cleaned.replace(/^\d+[\.\-\/\:\)\s]+\s*/, '').trim();
      if (cleaned && !savedSchools.includes(cleaned) && !newItems.includes(cleaned)) {
        newItems.push(cleaned);
      }
    });

    if (newItems.length > 0) {
      const combined = [...newItems, ...savedSchools];
      setSavedSchools(combined);
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_SCHOOLS, JSON.stringify(combined));
      } catch (e) {}
      setSchoolName(newItems[0]);
      setShowBulkSchoolsInput(false);
      setBulkSchoolsText('');
    }
  };

  const handleParseBulkText = () => {
    const lines = bulkText.split('\n');
    const parsed: Student[] = [];
    lines.forEach((line) => {
      let clean = line.trim();
      if (!clean) return;
      clean = clean.replace(/^\d+[\.\-\/\:\)\s]+\s*/, '').trim();
      if (clean) {
        let name = clean;
        let phone = '';
        const match = clean.match(/^(.*?)(?:[\-–—,\t;|]\s*|\s{2,})([0-9+() .\-]{8,15})$/);
        if (match) {
          name = match[1].trim();
          phone = cleanPhoneNumber(match[2].trim());
        }
        parsed.push({
          id: `std-${parsed.length + 1}-${Date.now()}`,
          stt: parsed.length + 1,
          name,
          parentPhone: phone || undefined,
        });
      }
    });
    return parsed;
  };

  const handleLoadSampleRoster = () => {
    setBulkText(
      INITIAL_STUDENTS.map(
        (s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`
      ).join('\n')
    );
    setEditableStudents(INITIAL_STUDENTS);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;
    const phone = cleanPhoneNumber(newStudentPhone.trim());
    const nextStt = editableStudents.length + 1;
    const updated = [
      ...editableStudents,
      {
        id: `std-${nextStt}-${Date.now()}`,
        stt: nextStt,
        name,
        parentPhone: phone || undefined,
      },
    ];
    setEditableStudents(updated);
    setBulkText(
      updated
        .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
        .join('\n')
    );
    setNewStudentName('');
    setNewStudentPhone('');
  };

  const handleUpdateStudentPhone = (index: number, val: string) => {
    const updated = [...editableStudents];
    updated[index] = { ...updated[index], parentPhone: val };
    setEditableStudents(updated);
  };

  const handleDeleteStudent = (index: number) => {
    const updated = editableStudents
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, stt: idx + 1 }));
    setEditableStudents(updated);
    setBulkText(
      updated
        .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
        .join('\n')
    );
  };

  const handleSave = () => {
    let finalStudents = editableStudents;
    if (activeRosterTab === 'bulk') {
      const parsed = handleParseBulkText();
      if (parsed.length > 0) {
        finalStudents = parsed;
      }
    }

    const finalSchoolName = schoolName.trim() || 'THPT Chu Văn An';

    // Auto-save school to savedSchools list if not present
    if (finalSchoolName && !savedSchools.includes(finalSchoolName)) {
      const updatedSchools = [finalSchoolName, ...savedSchools];
      setSavedSchools(updatedSchools);
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_SCHOOLS, JSON.stringify(updatedSchools));
      } catch (e) {}
    }

    const newConfig: ClassConfig = {
      schoolName: finalSchoolName,
      className: className.trim(),
      teacherName: teacherName.trim(),
      zaloPhone: cleanPhoneNumber(zaloPhone.trim()),
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      students: finalStudents,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base">Cấu hình Lớp học & Trường THPT</h3>
              <p className="text-xs text-blue-200">
                Giáo viên tự do nạp tên trường, số Zalo và danh sách học sinh
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Section: TÊN TRƯỜNG THPT (GIÁO VIÊN TỰ NẠP VÀO) */}
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Tên trường THPT * (Giáo viên tự nạp vào)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowBulkSchoolsInput(!showBulkSchoolsInput)}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                {showBulkSchoolsInput ? 'Ẩn ô dán danh sách' : '📋 Nạp nhiều trường cùng lúc'}
              </button>
            </div>

            {/* Direct Input for Teacher */}
            <div className="flex gap-2">
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Nhập tên trường THPT của Thầy/Cô (VD: THPT Nguyễn Hữu Huân, THPT Lê Quý Đôn...)"
                className="flex-1 text-sm px-3.5 py-2.5 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800 shadow-xs"
              />

              <button
                type="button"
                onClick={() => handleAddSchoolToSaved(schoolName)}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Lưu trường này vào danh sách để chọn nhanh lần sau"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lưu trường</span>
              </button>
            </div>

            {/* Quick prefix helpers */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-500 font-semibold">Chèn nhanh tiền tố:</span>
              {[
                { prefix: 'THPT ', label: '+ THPT' },
                { prefix: 'THCS & THPT ', label: '+ THCS & THPT' },
                { prefix: 'THPT Chuyên ', label: '+ Chuyên' },
                { prefix: 'Trung tâm GDNN - GDTX ', label: '+ TT GDTX' },
              ].map((item) => (
                <button
                  key={item.prefix}
                  type="button"
                  onClick={() => {
                    if (!schoolName.startsWith(item.prefix)) {
                      setSchoolName(item.prefix + schoolName.replace(/^(THPT|THCS & THPT|Trung tâm GDNN - GDTX)\s*/, ''));
                    }
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-blue-200 bg-white text-blue-800 hover:bg-blue-100/70 font-medium transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Optional Bulk Input for Schools */}
            {showBulkSchoolsInput && (
              <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-2 mt-2">
                <p className="text-[11px] text-slate-600 font-medium">
                  Dán danh sách các trường THPT bạn muốn nạp (mỗi trường 1 dòng):
                </p>
                <textarea
                  rows={3}
                  value={bulkSchoolsText}
                  onChange={(e) => setBulkSchoolsText(e.target.value)}
                  placeholder="THPT Nguyễn Du&#10;THPT Lê Quý Đôn&#10;THPT Chuyên Trần Hưng Đạo..."
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkSchoolsInput(false)}
                    className="text-xs text-slate-500 hover:underline px-2 py-1"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleImportBulkSchools}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Nạp vào danh sách
                  </button>
                </div>
              </div>
            )}

            {/* Teacher's Saved Schools Chips */}
            {savedSchools.length > 0 && (
              <div className="pt-1.5 border-t border-blue-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-blue-900 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Các trường THPT Thầy/Cô đã nạp ({savedSchools.length}):
                  </span>
                  <span className="text-[10px] text-slate-400 italic">Nhấn để chọn ngay</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {savedSchools.map((sch) => {
                    const isSelected = schoolName === sch;
                    return (
                      <div
                        key={sch}
                        onClick={() => setSchoolName(sch)}
                        className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        <span>🏫 {sch}</span>
                        {savedSchools.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedSchool(e, sch)}
                            className={`ml-1 text-[11px] rounded p-0.5 hover:text-red-500 transition ${
                              isSelected ? 'text-blue-200 hover:text-white' : 'text-slate-400'
                            }`}
                            title="Xóa trường này khỏi danh sách đã nạp"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section: Thông tin lớp & GVCN */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Thông tin Lớp & Giáo viên chủ nhiệm
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 11A1, 10C2, 12 Tin..."
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên GVCN *
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ví dụ: Cô Lê Hoàng Yến"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Số điện thoại Zalo nhận tin của GVCN *
                </label>
                <input
                  type="text"
                  value={zaloPhone}
                  onChange={(e) => setZaloPhone(e.target.value)}
                  placeholder="Ví dụ: 0988123456"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dùng để mở trực tiếp chat qua link <em>zalo.me/số_điện_thoại</em>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên người báo cáo
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ / Vai trò người báo cáo
                </label>
                <input
                  type="text"
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value)}
                  placeholder="Ví dụ: Lớp trưởng, Lớp phó học tập, Cờ đỏ..."
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section: Danh sách học sinh */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Danh sách học sinh của lớp
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleRoster}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Khôi phục 35 học sinh mẫu
                </button>
              </div>
            </div>

            {/* Sub-tabs: Nhập dạng text vs Xem danh sách vs Excel Import/Export */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 mb-3 text-xs gap-2">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRosterTab('bulk');
                    setBulkText(
                      editableStudents
                        .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
                        .join('\n')
                    );
                  }}
                  className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeRosterTab === 'bulk'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Dán nhanh
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const parsed = handleParseBulkText();
                    if (parsed.length > 0) setEditableStudents(parsed);
                    setActiveRosterTab('list');
                  }}
                  className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeRosterTab === 'list'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Xem & sửa chi tiết ({editableStudents.length})
                </button>
              </div>

              {/* Excel / CSV Actions */}
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => exportStudentsToCsv(editableStudents, className)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                  title="Tải danh sách học sinh ra file CSV (mở bằng Microsoft Excel)"
                >
                  <Download className="w-3 h-3" />
                  <span>Xuất Excel (.csv)</span>
                </button>

                <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Nhập Excel (.csv)</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          const imported = parseStudentsCsv(text);
                          if (imported.length > 0) {
                            setEditableStudents(imported);
                            setActiveRosterTab('list');
                            alert(`Đã nạp thành công ${imported.length} học sinh từ file!`);
                          } else {
                            alert('Không tìm thấy danh sách học sinh hợp lệ trong file.');
                          }
                        };
                        reader.readAsText(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {activeRosterTab === 'bulk' ? (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Dán trực tiếp từ Excel hoặc Word. Hỗ trợ kèm SĐT Phụ huynh dạng: <strong>Họ tên - SĐT</strong> (Ví dụ: <em>Nguyễn An Bình - 0912345601</em>).
                </p>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="1. Nguyễn An Bình - 0912345601&#10;2. Trần Gia Bảo - 0912345602&#10;3. Lê Phương Chi - 0912345603..."
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Add new student inline */}
                <form onSubmit={handleAddSingleStudent} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Họ và tên học sinh..."
                    className="flex-1 min-w-[150px] text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="SĐT Phụ huynh..."
                    className="w-36 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </form>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {editableStudents.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Chưa có học sinh nào trong danh sách.
                    </div>
                  ) : (
                    editableStudents.map((s, index) => (
                      <div
                        key={s.id || index}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-6 text-center font-mono text-slate-400 font-semibold shrink-0">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-slate-800 truncate min-w-[120px]">
                            {s.name}
                          </span>
                        </div>

                        {/* Editable Parent Phone */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={s.parentPhone || ''}
                            onChange={(e) => handleUpdateStudentPhone(index, e.target.value)}
                            placeholder="SĐT Phụ huynh"
                            className="w-28 text-[11px] px-2 py-0.5 border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer shrink-0"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">
              {editableStudents.length > 0
                ? `Tổng số: ${editableStudents.length} học sinh`
                : 'Chưa có học sinh'}
            </span>
            <span className="text-slate-300">|</span>
            {/* Backup JSON */}
            <button
              type="button"
              onClick={() => {
                exportSystemBackup(
                  {
                    schoolName,
                    className,
                    teacherName,
                    zaloPhone,
                    reporterName,
                    reporterRole,
                    students: editableStudents,
                  },
                  []
                );
              }}
              className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 underline cursor-pointer"
              title="Tải toàn bộ cấu hình lớp ra file .json để lưu trữ an toàn"
            >
              Sao lưu cấu hình (.json)
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
