import { Student, ClassConfig, ReportItem } from '../types';

/**
 * Export student list to CSV with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportStudentsToCsv(students: Student[], className: string): void {
  // UTF-8 BOM: \uFEFF
  let csvContent = '\uFEFF';
  csvContent += 'STT,Họ và tên,Tổ,Số điện thoại Phụ huynh,Tên Phụ huynh\n';

  students.forEach((s, idx) => {
    const stt = s.stt || idx + 1;
    const name = `"${(s.name || '').replace(/"/g, '""')}"`;
    const group = `"${(s.group || '').replace(/"/g, '""')}"`;
    const phone = `"${(s.parentPhone || '').replace(/"/g, '""')}"`;
    const parentName = `"${(s.parentName || '').replace(/"/g, '""')}"`;
    csvContent += `${stt},${name},${group},${phone},${parentName}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DanhSachHocSinh_Lop_${className || 'Lop'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV text into Student list
 */
export function parseStudentsCsv(text: string): Student[] {
  // Normalize lines
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const students: Student[] = [];
  let startIndex = 0;

  // Check if first line is header
  const firstLineLower = lines[0].toLowerCase();
  if (
    firstLineLower.includes('tên') ||
    firstLineLower.includes('name') ||
    firstLineLower.includes('stt') ||
    firstLineLower.includes('họ')
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma or semicolon or tab, handling quotes
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());

    if (cells.length > 0) {
      // Analyze columns: might be [STT, Name, ...] or [Name, Phone, ...]
      let stt = i;
      let name = '';
      let group = '';
      let parentPhone = '';
      let parentName = '';

      if (cells.length >= 2 && !isNaN(Number(cells[0]))) {
        stt = Number(cells[0]);
        name = cells[1].replace(/^"|"$/g, '').trim();
        if (cells.length >= 3) group = cells[2].replace(/^"|"$/g, '').trim();
        if (cells.length >= 4) parentPhone = cells[3].replace(/^"|"$/g, '').trim();
        if (cells.length >= 5) parentName = cells[4].replace(/^"|"$/g, '').trim();
      } else {
        name = cells[0].replace(/^"|"$/g, '').trim();
        if (cells.length >= 2) parentPhone = cells[1].replace(/^"|"$/g, '').trim();
      }

      if (name) {
        students.push({
          id: `stu_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          stt,
          name,
          group: group || 'Tổ 1',
          parentPhone,
          parentName,
        });
      }
    }
  }

  return students;
}

/**
 * Export full system state (Config + History) to a JSON file
 */
export function exportSystemBackup(config: ClassConfig, history: ReportItem[]): void {
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    appName: 'QUẢN LÝ LỚP - PHẠM HẬU',
    config,
    history,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `SaoLuu_QuanLyLop_${config.className || 'Data'}_${d}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read and restore backup from a JSON file
 */
export function readSystemBackup(
  file: File,
  onSuccess: (data: { config: ClassConfig; history: ReportItem[] }) => void,
  onError: (err: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (!parsed || !parsed.config || !Array.isArray(parsed.config.students)) {
        throw new Error('Định dạng file sao lưu không hợp lệ.');
      }
      onSuccess({
        config: parsed.config,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      });
    } catch (err: any) {
      onError(err?.message || 'Không thể đọc file sao lưu.');
    }
  };
  reader.readAsText(file);
}
