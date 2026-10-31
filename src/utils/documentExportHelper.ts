import { ClassConfig, ReportItem } from '../types';

/**
 * Generate and download a formatted Word Document for Class Weekly Meeting Minutes (Biên Bản Sinh Hoạt Lớp)
 */
export function exportMeetingMinutesWord(
  config: ClassConfig,
  history: ReportItem[],
  weekNumber: number = 1
): void {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  
  // Calculate stats from history
  const absentRecords = history.filter((h) => h.type === 'ABSENT');
  const violationRecords = history.filter((h) => h.type === 'VIOLATION');
  const commendationRecords = history.filter((h) => h.type === 'COMMENDATION');

  const absentStudents = absentRecords.flatMap((h) =>
    h.students.map((s) => ({
      name: s.name,
      date: h.dateDisplay || h.date,
      type: h.absentType === 'EXCUSED' ? 'Có phép' : 'Không phép / Đi muộn',
      note: h.customNote,
    }))
  );

  const violationList = violationRecords.flatMap((h) =>
    h.students.map((s) => ({
      name: s.name,
      date: h.dateDisplay || h.date,
      violations: h.violationTags.join(', ') || 'Vi phạm nội quy',
      note: h.customNote,
    }))
  );

  const commendList = commendationRecords.flatMap((h) =>
    h.students.map((s) => ({
      name: s.name,
      date: h.dateDisplay || h.date,
      commendations: h.commendationTags.join(', ') || 'Điểm tốt / Tích cực',
      note: h.customNote,
    }))
  );

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Biên Bản Sinh Hoạt Lớp</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; margin: 20mm; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .header-table td { vertical-align: top; text-align: center; font-size: 12pt; }
        .title { text-align: center; font-size: 16pt; font-weight: bold; margin-top: 20px; margin-bottom: 15px; text-transform: uppercase; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 6px; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; }
        table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 8px; font-size: 12pt; }
        table.data-table th { background-color: #f2f2f2; text-align: center; }
        .signature-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
        .signature-table td { text-align: center; vertical-align: top; font-size: 12pt; width: 50%; }
        .sub-text { font-style: italic; font-size: 11pt; }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 45%;">
            <strong>${config.schoolName ? config.schoolName.toUpperCase() : 'TRƯỜNG THPT'}</strong><br/>
            <strong>LỚP: ${config.className ? config.className.toUpperCase() : '...'}</strong><br/>
            ----------------
          </td>
          <td style="width: 55%;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
            ----------------
          </td>
        </tr>
      </table>

      <div class="title">
        BIÊN BẢN SINH HOẠT LỚP - TUẦN ${weekNumber}
      </div>

      <p style="text-align: center; font-style: italic;">
        Thời gian: Ngày ${currentDate} | Địa điểm: Phòng học lớp ${config.className || '...'}
      </p>

      <div class="section-title">I. THÀNH PHẦN THAM DỰ</div>
      <p>- Giáo viên chủ nhiệm: <strong>${config.teacherName || 'Chưa cấu hình'}</strong></p>
      <p>- Ban cán sự lớp: ${config.reporterName || 'Lớp trưởng'} (${config.reporterRole || 'Chủ tọa'})</p>
      <p>- Tập thể học sinh: Tổng số ${config.students.length} học sinh có mặt đầy đủ.</p>

      <div class="section-title">II. ĐÁNH GIÁ TÌNH HÌNH CHUYÊN CẦN TRONG TUẦN</div>
      ${
        absentStudents.length === 0
          ? '<p>- <em>Lớp duy trì chuyên cần xuất sắc, không có học sinh vắng học hoặc đi muộn.</em></p>'
          : `<table class="data-table">
              <thead>
                <tr>
                  <th style="width: 8%;">STT</th>
                  <th style="width: 35%;">Họ và tên học sinh</th>
                  <th style="width: 22%;">Ngày ghi nhận</th>
                  <th style="width: 35%;">Hình thức / Lý do</th>
                </tr>
              </thead>
              <tbody>
                ${absentStudents
                  .map(
                    (s, i) => `<tr>
                      <td style="text-align: center;">${i + 1}</td>
                      <td>${s.name}</td>
                      <td style="text-align: center;">${s.date}</td>
                      <td>${s.type} ${s.note ? `(${s.note})` : ''}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
      }

      <div class="section-title">III. ĐÁNH GIÁ NỀ NẾP & KỶ LUẬT</div>
      ${
        violationList.length === 0
          ? '<p>- <em>Tập thể chấp hành nghiêm túc nội quy trường lớp, không có hiện tượng vi phạm nề nếp.</em></p>'
          : `<table class="data-table">
              <thead>
                <tr>
                  <th style="width: 8%;">STT</th>
                  <th style="width: 32%;">Họ và tên học sinh</th>
                  <th style="width: 35%;">Nội dung vi phạm</th>
                  <th style="width: 25%;">Thời gian / Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                ${violationList
                  .map(
                    (s, i) => `<tr>
                      <td style="text-align: center;">${i + 1}</td>
                      <td>${s.name}</td>
                      <td>${s.violations}</td>
                      <td style="text-align: center;">${s.date} ${s.note ? `- ${s.note}` : ''}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
      }

      <div class="section-title">IV. TUYÊN DƯƠNG & KHEN THƯỞNG</div>
      ${
        commendList.length === 0
          ? '<p>- <em>Lớp duy trì phong trào học tập và nề nếp tốt.</em></p>'
          : `<table class="data-table">
              <thead>
                <tr>
                  <th style="width: 8%;">STT</th>
                  <th style="width: 35%;">Họ và tên học sinh</th>
                  <th style="width: 57%;">Thành tích / Điểm cộng khen thưởng</th>
                </tr>
              </thead>
              <tbody>
                ${commendList
                  .map(
                    (s, i) => `<tr>
                      <td style="text-align: center;">${i + 1}</td>
                      <td>${s.name}</td>
                      <td>${s.commendations} ${s.note ? `(${s.note})` : ''}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
      }

      <div class="section-title">V. Ý KIẾN CHỈ ĐẠO CỦA GIÁO VIÊN CHỦ NHIỆM & KẾ HOẠCH TUẦN TỚI</div>
      <p>1. Phát huy các điểm mạnh đã đạt được về học tập và rèn luyện.</p>
      <p>2. Nghiêm túc chấn chỉnh các trường hợp vi phạm nề nếp và chuyên cần.</p>
      <p>3. Chuẩn bị tốt các nội dung kiểm tra định kỳ và hoạt động ngoại khóa trong tuần tới.</p>

      <table class="signature-table">
        <tr>
          <td>
            <strong>NGƯỜI LẬP BIÊN BẢN</strong><br/>
            <span class="sub-text">(Ký và ghi rõ họ tên)</span><br/><br/><br/><br/>
            <strong>${config.reporterName || 'Ban Cán Sự Lớp'}</strong>
          </td>
          <td>
            <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
            <span class="sub-text">(Duyệt và ký tên)</span><br/><br/><br/><br/>
            <strong>${config.teacherName || 'Phạm Hậu'}</strong>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BienBan_SinhHoatLop_${config.className || 'Lop'}_Tuan${weekNumber}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download an interactive Presentation slide file (.html presentation) for the weekly class meeting
 */
export function exportClassSlidePresentation(
  config: ClassConfig,
  history: ReportItem[],
  weekNumber: number = 1
): void {
  const absentRecords = history.filter((h) => h.type === 'ABSENT');
  const violationRecords = history.filter((h) => h.type === 'VIOLATION');
  const commendationRecords = history.filter((h) => h.type === 'COMMENDATION');

  const absentNames = Array.from(new Set(absentRecords.flatMap((h) => h.students.map((s) => s.name))));
  const violationSummary = violationRecords.flatMap((h) =>
    h.students.map((s) => `${s.name}: ${h.violationTags.join(', ')}`)
  );
  const commendSummary = commendationRecords.flatMap((h) =>
    h.students.map((s) => `${s.name}: ${h.commendationTags.join(', ')}`)
  );

  const slideHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Slide Sinh Hoạt Lớp ${config.className} - Tuần ${weekNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .slide { display: none; min-height: 100vh; padding: 3rem; }
    .slide.active { display: flex; flex-direction: column; justify-content: center; }
  </style>
</head>
<body class="bg-slate-900 text-white font-sans overflow-hidden">
  
  <!-- Slide 1: Bìa -->
  <section class="slide active bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-center items-center">
    <div class="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold mb-4 border border-blue-400/30">
      ${config.schoolName || 'TRƯỜNG THPT'}
    </div>
    <h1 class="text-5xl font-extrabold tracking-tight mb-4 text-white">
      TIẾT SINH HOẠT LỚP - TUẦN ${weekNumber}
    </h1>
    <h2 class="text-3xl font-bold text-amber-400 mb-8">
      LỚP ${config.className || '...'}
    </h2>
    <div class="text-lg text-slate-300 space-y-1">
      <p>👨‍🏫 GVCN: <strong class="text-white">${config.teacherName || 'Phạm Hậu'}</strong></p>
      <p>📝 Người trình bày: ${config.reporterName || 'Ban cán sự lớp'}</p>
    </div>
  </section>

  <!-- Slide 2: Chuyên cần -->
  <section class="slide bg-slate-900">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-blue-400 font-bold uppercase tracking-wider text-sm mb-2">Mục I</div>
      <h2 class="text-4xl font-extrabold mb-8 text-white flex items-center gap-3">
        <span>⏰</span> Tình Hình Chuyên Cần Trong Tuần
      </h2>
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <div class="text-3xl font-bold text-emerald-400">${config.students.length - absentNames.length} / ${config.students.length}</div>
          <div class="text-slate-400 mt-1">Học sinh đi học đầy đủ</div>
        </div>
        <div class="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <div class="text-3xl font-bold text-amber-400">${absentNames.length}</div>
          <div class="text-slate-400 mt-1">Lượt vắng học / đi muộn</div>
        </div>
      </div>
      <div class="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
        <h3 class="font-bold text-lg mb-3 text-slate-200">Danh sách cần lưu ý chuyên cần:</h3>
        ${
          absentNames.length === 0
            ? '<p class="text-emerald-400 font-semibold">🎉 Xuất sắc! Cả lớp không ai vắng học hay đi muộn trong tuần!</p>'
            : `<ul class="list-disc list-inside space-y-2 text-slate-300">
                ${absentNames.map((n) => `<li><strong class="text-white">${n}</strong></li>`).join('')}
              </ul>`
        }
      </div>
    </div>
  </section>

  <!-- Slide 3: Tuyên dương -->
  <section class="slide bg-slate-900">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-2">Mục II</div>
      <h2 class="text-4xl font-extrabold mb-8 text-white flex items-center gap-3">
        <span>⭐</span> Tuyên Dương & Biểu Dương Khen Thưởng
      </h2>
      <div class="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 p-8 rounded-3xl border border-emerald-500/30">
        ${
          commendSummary.length === 0
            ? '<p class="text-slate-300 text-lg">Cả lớp duy trì nề nếp học tập nghiêm túc và đồng đều.</p>'
            : `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${commendSummary
                  .map(
                    (item) => `
                  <div class="bg-slate-800/90 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                    <span class="text-2xl">🌟</span>
                    <div>
                      <div class="font-bold text-emerald-300">${item.split(':')[0]}</div>
                      <div class="text-sm text-slate-300">${item.split(':')[1] || ''}</div>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>`
        }
      </div>
    </div>
  </section>

  <!-- Slide 4: Vi phạm nề nếp -->
  <section class="slide bg-slate-900">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-rose-400 font-bold uppercase tracking-wider text-sm mb-2">Mục III</div>
      <h2 class="text-4xl font-extrabold mb-8 text-white flex items-center gap-3">
        <span>⚠️</span> Nhắc Nhở Vi Phạm Nề Nếp & Kỷ Luật
      </h2>
      <div class="bg-slate-800/70 p-6 rounded-2xl border border-slate-700">
        ${
          violationSummary.length === 0
            ? '<p class="text-emerald-400 font-bold text-lg">👏 Không ghi nhận vi phạm nào trong tuần. Lớp giữ vững kỷ luật rất tốt!</p>'
            : `<div class="space-y-3">
                ${violationSummary
                  .map(
                    (v) => `
                  <div class="p-3 bg-rose-950/30 rounded-xl border border-rose-500/30 flex items-center justify-between">
                    <span class="font-bold text-rose-300">${v.split(':')[0]}</span>
                    <span class="text-sm text-slate-300">${v.split(':')[1] || ''}</span>
                  </div>`
                  )
                  .join('')}
              </div>`
        }
      </div>
    </div>
  </section>

  <!-- Slide 5: Kế hoạch tuần tới -->
  <section class="slide bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-indigo-400 font-bold uppercase tracking-wider text-sm mb-2">Mục IV</div>
      <h2 class="text-4xl font-extrabold mb-8 text-white flex items-center gap-3">
        <span>🚀</span> Phương Hướng Kế Hoạch Tuần ${weekNumber + 1}
      </h2>
      <div class="space-y-4">
        <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">1</div>
          <div>
            <h3 class="font-bold text-lg text-white">Ổn định chuyên cần</h3>
            <p class="text-slate-400 text-sm">Đi học đúng giờ, mặc đúng trang phục theo quy định nhà trường.</p>
          </div>
        </div>
        <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">2</div>
          <div>
            <h3 class="font-bold text-lg text-white">Nâng cao chất lượng giờ học</h3>
            <p class="text-slate-400 text-sm">Chuẩn bị bài đầy đủ trước khi đến lớp, tích cực phát biểu xây dựng bài.</p>
          </div>
        </div>
        <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl">3</div>
          <div>
            <h3 class="font-bold text-lg text-white">Phát động thi đua giữa các tổ</h3>
            <p class="text-slate-400 text-sm">Các tổ trưởng theo dõi, đôn đốc thành viên hoàn thành tốt nhiệm vụ.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Controls footer -->
  <footer class="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur border-t border-slate-800 flex justify-between items-center text-sm px-8">
    <div class="text-slate-400">
      Nhấn <strong>[Phím Mũi Tên]</strong> hoặc bấm nút để chuyển slide
    </div>
    <div class="flex items-center gap-3">
      <button onclick="prevSlide()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer">◀ Slide Trước</button>
      <span id="slideIndicator" class="text-slate-300 font-bold">1 / 5</span>
      <button onclick="nextSlide()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer">Slide Tiếp ▶</button>
    </div>
  </footer>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const indicator = document.getElementById('slideIndicator');

    function showSlide(index) {
      if (index < 0 || index >= slides.length) return;
      slides[current].classList.remove('active');
      current = index;
      slides[current].classList.add('active');
      indicator.textContent = (current + 1) + ' / ' + slides.length;
    }

    function prevSlide() { showSlide(current - 1); }
    function nextSlide() { showSlide(current + 1); }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([slideHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Slide_SinhHoatLop_${config.className || 'Lop'}_Tuan${weekNumber}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
