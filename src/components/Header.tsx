import React from 'react';
import {
  Settings,
  History,
  Download,
  School,
  UserCheck,
  Sparkles,
  BarChart3,
  Key,
} from 'lucide-react';
import { ClassConfig } from '../types';

interface HeaderProps {
  config: ClassConfig;
  historyCount: number;
  onOpenConfig: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenApiKey: () => void;
  onOpenDashboard: () => void;
  onOpenAi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  historyCount,
  onOpenConfig,
  onOpenHistory,
  onOpenExport,
  onOpenApiKey,
  onOpenDashboard,
  onOpenAi,
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Class Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                QUẢN LÝ LỚP - PHẠM HẬU
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Lớp {config.className || 'Chưa đặt'}
              </span>
            </div>
            <div className="text-xs text-blue-100 flex flex-wrap items-center gap-2 font-medium mt-0.5">
              <span>{config.schoolName || 'Chưa cấu hình trường'}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-blue-300"></span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                GVCN: <strong className="text-white">{config.teacherName || 'Chưa cấu hình'}</strong>
              </span>
              {config.zaloPhone && (
                <>
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-300"></span>
                  <span className="text-blue-200 text-[11px]">Zalo: {config.zaloPhone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Settings API Key with Red Text as required by AI_INSTRUCTIONS.md */}
          <button
            onClick={onOpenApiKey}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 active:scale-95 rounded-lg shadow-sm border border-rose-300 transition cursor-pointer"
            title="Cài đặt Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-slate-800 hidden md:inline">Cài đặt AI:</span>
            <span className="text-rose-600 font-extrabold animate-pulse">Lấy API key để sử dụng app</span>
          </button>

          {/* AI Advisor Button */}
          <button
            onClick={onOpenAi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-500/90 hover:bg-purple-500 active:scale-95 text-white rounded-lg shadow-sm backdrop-blur transition border border-purple-400/40 cursor-pointer"
            title="Trợ lý AI phân tích nề nếp và nhận xét tuần"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trợ lý AI</span>
          </button>

          {/* Dashboard / Emulation Button */}
          <button
            onClick={onOpenDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/90 hover:bg-amber-500 active:scale-95 text-white rounded-lg shadow-sm backdrop-blur transition border border-amber-400/40 cursor-pointer"
            title="Xem biểu đồ nề nếp, điểm thi đua và xuất Word/PPT"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thi đua & Báo cáo</span>
          </button>

          {/* Config Class Button */}
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-lg backdrop-blur transition border border-white/20 cursor-pointer"
            title="Cài đặt thông tin lớp & danh sách học sinh"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cấu hình lớp</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-lg shadow-sm transition cursor-pointer"
            title="Xem nhật ký báo cáo đã gửi"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Lịch sử</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Export Standalone HTML Button */}
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/90 hover:bg-emerald-500 active:scale-95 text-white rounded-lg shadow-sm transition border border-emerald-400/40 cursor-pointer"
            title="Tải về file HTML đơn tệp để mở offline trên máy tính hoặc điện thoại"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">File HTML</span>
          </button>
        </div>
      </div>
    </header>
  );
};

