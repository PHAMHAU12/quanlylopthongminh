import React, { useState, useMemo } from 'react';
import {
  X,
  BarChart3,
  Trophy,
  Dices,
  FileText,
  Presentation,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
  Download,
} from 'lucide-react';
import { ClassConfig, ReportItem, Student } from '../types';
import {
  exportMeetingMinutesWord,
  exportClassSlidePresentation,
} from '../utils/documentExportHelper';

interface ClassDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
}

export const ClassDashboardModal: React.FC<ClassDashboardModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'emulation' | 'wheel'>('stats');
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Wheel state
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Calculations
  const stats = useMemo(() => {
    let excusedCount = 0;
    let unexcusedCount = 0;
    let lateCount = 0;
    let truantCount = 0;
    let violationCount = 0;
    let commendationCount = 0;

    const violationCategories: Record<string, number> = {};

    history.forEach((h) => {
      if (h.type === 'ABSENT') {
        const count = h.students.length || 1;
        if (h.absentType === 'EXCUSED') excusedCount += count;
        else if (h.absentType === 'UNEXCUSED') unexcusedCount += count;
        else if (h.absentType === 'LATE') lateCount += count;
        else if (h.absentType === 'TRUANT') truantCount += count;
      } else if (h.type === 'VIOLATION') {
        const count = h.students.length || 1;
        violationCount += count;
        h.violationTags.forEach((tag) => {
          violationCategories[tag] = (violationCategories[tag] || 0) + count;
        });
      } else if (h.type === 'COMMENDATION') {
        commendationCount += h.students.length || 1;
      }
    });

    return {
      excusedCount,
      unexcusedCount,
      lateCount,
      truantCount,
      violationCount,
      commendationCount,
      violationCategories,
    };
  }, [history]);

  // Emulation points per group (Tổ 1, Tổ 2, Tổ 3, Tổ 4)
  const groupScores = useMemo(() => {
    const groups: Record<string, { plus: number; minus: number; total: number; members: number }> = {
      'Tổ 1': { plus: 0, minus: 0, total: 100, members: 0 },
      'Tổ 2': { plus: 0, minus: 0, total: 100, members: 0 },
      'Tổ 3': { plus: 0, minus: 0, total: 100, members: 0 },
      'Tổ 4': { plus: 0, minus: 0, total: 100, members: 0 },
    };

    // Count members
    config.students.forEach((s) => {
      const g = s.group || 'Tổ 1';
      if (groups[g]) groups[g].members += 1;
    });

    // Score from history
    history.forEach((h) => {
      h.students.forEach((stu) => {
        // Find student group
        const matched = config.students.find((s) => s.name === stu.name);
        const groupName = matched?.group || stu.group || 'Tổ 1';

        if (groups[groupName]) {
          if (h.type === 'COMMENDATION') {
            groups[groupName].plus += 2;
          } else if (h.type === 'VIOLATION') {
            groups[groupName].minus += 2;
          } else if (h.type === 'ABSENT' && h.absentType !== 'EXCUSED') {
            groups[groupName].minus += 1;
          }
        }
      });
    });

    // Calculate total
    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        plus: data.plus,
        minus: data.minus,
        total: Math.max(0, 100 + data.plus - data.minus),
        members: data.members,
      }))
      .sort((a, b) => b.total - a.total);
  }, [config.students, history]);

  // Roll lucky student
  const handleRollStudent = () => {
    if (config.students.length === 0) {
      onShowToast('Chưa có học sinh nào trong danh sách lớp!', '⚠️');
      return;
    }
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * config.students.length);
      setPickedStudent(config.students[randomIdx]);
      count++;
      if (count >= 20) {
        clearInterval(interval);
        setIsRolling(false);
        onShowToast(`Đã chọn học sinh may mắn! 🎉`, '🎯');
      }
    }, 80);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              <BarChart3 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Thống Kê, Thi Đua & Báo Cáo Tuần</h2>
              <p className="text-xs text-blue-100">
                Lớp {config.className || '...'} • GVCN: {config.teacherName || 'Phạm Hậu'}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống Kê Chuyên Cần & Vi Phạm</span>
          </button>

          <button
            onClick={() => setActiveTab('emulation')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'emulation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Bảng Điểm Thi Đua Các Tổ</span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'wheel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Dices className="w-4 h-4 text-purple-500" />
            <span>Bốc Thăm Học Sinh May Mắn</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-800">Vắng có phép</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">{stats.excusedCount}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Lượt xin phép</div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-xs font-semibold text-amber-800">Không phép / Muộn</div>
                  <div className="text-2xl font-bold text-amber-900 mt-1">
                    {stats.unexcusedCount + stats.lateCount}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Cần nhắc nhở</div>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="text-xs font-semibold text-rose-800">Lượt vi phạm</div>
                  <div className="text-2xl font-bold text-rose-900 mt-1">{stats.violationCount}</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">Nội quy kỷ luật</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="text-xs font-semibold text-blue-800">Khen thưởng</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">{stats.commendationCount}</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">Hoa điểm tốt</div>
                </div>
              </div>

              {/* Violation Breakdown chart / list */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Phân bổ các lỗi vi phạm nội quy phổ biến</span>
                </h3>
                {Object.keys(stats.violationCategories).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Chưa ghi nhận vi phạm nề nếp nào trong lịch sử.</p>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(stats.violationCategories)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tag, count]) => {
                        const percent = Math.min(
                          100,
                          Math.round((count / (stats.violationCount || 1)) * 100)
                        );
                        return (
                          <div key={tag} className="text-xs">
                            <div className="flex justify-between font-semibold mb-1">
                              <span className="text-slate-700">{tag}</span>
                              <span className="text-slate-900">
                                {count} lượt ({percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Export Suite: Word & PPT */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <span>📑</span> Bộ tài liệu Sinh hoạt lớp tự động (Word & Slide)
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Xuất biên bản sinh hoạt tuần và slide trình chiếu hoàn chỉnh dựa trên dữ liệu lớp.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300">
                    <span>Tuần số:</span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={weekNumber}
                      onChange={(e) => setWeekNumber(Number(e.target.value) || 1)}
                      className="w-12 text-center font-bold text-blue-700 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      exportMeetingMinutesWord(config, history, weekNumber);
                      onShowToast('Đã tải xuống Biên bản sinh hoạt lớp dạng Word (.doc)!', '📥');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Xuất Word (.doc)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportClassSlidePresentation(config, history, weekNumber);
                      onShowToast('Đã tải xuống Slide trình chiếu sinh hoạt lớp (.html)!', '📥');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Presentation className="w-4 h-4" />
                    <span>Xuất Slide (.html)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emulation' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bảng Xếp Hạng Thi Đua Giữa 4 Tổ</h3>
                  <p className="text-xs text-slate-500">
                    Điểm gốc: 100 điểm • Cộng điểm khi có tuyên dương • Trừ điểm khi có vi phạm/vắng không phép
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupScores.map((g, idx) => {
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  let trophyColor = 'text-slate-400';
                  if (idx === 0) {
                    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
                    trophyColor = 'text-amber-500';
                  } else if (idx === 1) {
                    badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                    trophyColor = 'text-slate-400';
                  } else if (idx === 2) {
                    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                    trophyColor = 'text-amber-700';
                  }

                  return (
                    <div
                      key={g.name}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl font-bold">
                          <Trophy className={`w-6 h-6 ${trophyColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-slate-900">{g.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              Hạng {idx + 1}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span>{g.members} học sinh</span>
                            <span className="text-emerald-600 font-semibold">+{g.plus} điểm</span>
                            <span className="text-rose-600 font-semibold">-{g.minus} điểm</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-blue-600">{g.total}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Điểm tổng</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'wheel' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                  <span>🎯</span> Vòng Quay May Mắn / Bốc Thăm Học Sinh
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Công cụ hỗ trợ giáo viên chủ nhiệm & cán sự lớp chọn ngẫu nhiên học sinh kiểm tra bài, trực nhật hoặc vinh danh.
                </p>
              </div>

              {/* Display Result Card */}
              <div className="w-72 h-44 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex flex-col items-center justify-center p-6 shadow-xl border-4 border-white/20">
                {pickedStudent ? (
                  <div className="animate-in zoom-in-75 duration-200 space-y-1">
                    <div className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">
                      {pickedStudent.group || 'Học sinh được chọn'}
                    </div>
                    <div className="text-2xl font-black tracking-tight mt-1 text-amber-300">
                      {pickedStudent.name}
                    </div>
                    <div className="text-xs text-white/80">
                      STT: {pickedStudent.stt}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-indigo-200 text-sm">
                    <Dices className="w-12 h-12 mx-auto mb-2 opacity-60" />
                    Bấm nút bên dưới để quay ngẫu nhiên
                  </div>
                )}
              </div>

              <button
                onClick={handleRollStudent}
                disabled={isRolling}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? 'Đang quay...' : 'Bốc thăm ngẫu nhiên'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
