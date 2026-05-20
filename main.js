const ROLES = [
  '시간(Time)', '고도(Altitude)', '온도(Temperature)', '기압(Pressure)',
  '습도(Humidity)', 'GPS 위도', 'GPS 경도',
  '가속도 X', '가속도 Y', '가속도 Z',
  '자이로 X', '자이로 Y', '자이로 Z',
  '배터리 전압', 'RSSI', '기타(무시)'
];

const ROLE_COLORS = {
  '고도(Altitude)':      '#63a0ff',
  '온도(Temperature)':   '#ff6b8a',
  '기압(Pressure)':      '#4ef0c0',
  '습도(Humidity)':      '#f7c948',
  '가속도 X':            '#b57bff',
  '가속도 Y':            '#ff9f50',
  '가속도 Z':            '#5ae8a0',
  '자이로 X':            '#60cfee',
  '자이로 Y':            '#ee6090',
  '자이로 Z':            '#a0e060',
  '배터리 전압':          '#ffd060',
  'RSSI':               '#ff9090',
};

let rawData = [], headers = [], mappedRoles = {}, filteredData = [];
let page = 0;
const PAGE_SIZE = 20;
let sortCol = -1, sortAsc = true;
let charts = {};

/* ────────────────────────────────────────────
   UPLOAD
──────────────────────────────────────────── */
const zone      = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

zone.addEventListener('click',     () => fileInput.click());
zone.addEventListener('dragover',  e  => { e.preventDefault(); zone.classList.add('drag'); });
zone.addEventListener('dragleave', ()  => zone.classList.remove('drag'));
zone.addEventListener('drop',      e  => {
  e.preventDefault();
  zone.classList.remove('drag');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file) return;
  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: res => {
      const rows = res.data;
      if (!rows.length) return alert('파일이 비어있습니다.');

      // 첫 행이 문자열이면 헤더로 처리
      if (typeof rows[0][0] === 'string' && isNaN(rows[0][0])) {
        headers = rows[0].map(String);
        rawData = rows.slice(1);
      } else {
        headers = rows[0].map((_, i) => 'Column_' + (i + 1));
        rawData = rows;
      }
      showMapper();
    }
  });
}

/* ────────────────────────────────────────────
   COLUMN MAPPER
──────────────────────────────────────────── */
function showMapper() {
  const grid = document.getElementById('map-grid');
  grid.innerHTML = '';
  headers.forEach((h, i) => {
    const div  = document.createElement('div');
    div.className = 'map-item';
    const opts = ROLES.map(r => `<option value="${r}">${r}</option>`).join('');
    div.innerHTML = `<label>${h}</label><select id="role_${i}" data-col="${i}">${opts}</select>`;
    grid.appendChild(div);
  });
  document.getElementById('column-mapper').style.display = 'block';
  autoDetect();
}

function autoDetect() {
  const kw = {
    '시간(Time)':        ['time','t','timestamp','elapsed','sec','ms','초','시간','경과'],
    '고도(Altitude)':    ['alt','altitude','height','고도','높이'],
    '온도(Temperature)': ['temp','temperature','t1','t2','온도','섭씨'],
    '기압(Pressure)':    ['pres','pressure','baro','hpa','기압','pascal'],
    '습도(Humidity)':    ['humid','humidity','rh','습도'],
    'GPS 위도':          ['lat','latitude','위도'],
    'GPS 경도':          ['lon','lng','longitude','경도'],
    '가속도 X':          ['accx','ax','accel_x','가속x'],
    '가속도 Y':          ['accy','ay','accel_y','가속y'],
    '가속도 Z':          ['accz','az','accel_z','가속z'],
    '자이로 X':          ['gyrx','gx','gyro_x','자이로x'],
    '자이로 Y':          ['gyry','gy','gyro_y','자이로y'],
    '자이로 Z':          ['gyrz','gz','gyro_z','자이로z'],
    '배터리 전압':        ['volt','voltage','bat','battery','배터리','전압'],
    'RSSI':             ['rssi','signal','dbm'],
  };

  headers.forEach((h, i) => {
    const hl  = h.toLowerCase().replace(/[_\s-]/g, '');
    let matched = '기타(무시)';
    for (const [role, patterns] of Object.entries(kw)) {
      if (patterns.some(p => hl.includes(p))) { matched = role; break; }
    }
    const sel = document.getElementById(`role_${i}`);
    if (sel) sel.value = matched;
  });
}

document.getElementById('auto-map-btn').addEventListener('click', autoDetect);
document.getElementById('apply-map-btn').addEventListener('click', applyAndVisualize);

function applyAndVisualize() {
  mappedRoles = {};
  headers.forEach((_, i) => {
    const v = document.getElementById(`role_${i}`).value;
    if (v !== '기타(무시)') mappedRoles[i] = v;
  });
  filteredData = [...rawData];
  setStatus(true);
  renderStats();
  renderCharts();
  renderTable();
  document.getElementById('stats-section').style.display  = 'block';
  document.getElementById('charts-section').style.display = 'block';
  document.getElementById('table-section').style.display  = 'block';
  document.getElementById('stats-section').scrollIntoView({ behavior: 'smooth' });
}

function setStatus(active) {
  document.getElementById('status-dot').className    = 'status-dot' + (active ? ' active' : '');
  document.getElementById('status-label').textContent = active ? 'DATA LOADED' : 'NO DATA';
}

/* ────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────── */
function colFor(role) {
  return parseInt(Object.keys(mappedRoles).find(k => mappedRoles[k] === role));
}

function dataFor(role) {
  const c = colFor(role);
  if (isNaN(c)) return null;
  return rawData.map(r => parseFloat(r[c])).filter(v => !isNaN(v));
}

/* ────────────────────────────────────────────
   STATS
──────────────────────────────────────────── */
function renderStats() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '';

  const makeCard = (label, val, sub, cls) => {
    const d = document.createElement('div');
    d.className = `stat-card ${cls}`;
    d.innerHTML = `<div class="label">${label}</div><div class="val">${val}</div><div class="sub">${sub}</div>`;
    grid.appendChild(d);
  };

  makeCard('총 데이터 포인트', rawData.length.toLocaleString(), '행(rows)', 'blue');
  makeCard('센서 채널', Object.keys(mappedRoles).length, '매핑된 열', 'green');

  const altData = dataFor('고도(Altitude)');
  if (altData) {
    makeCard('최대 고도',
      Math.max(...altData).toFixed(1) + ' m',
      `최솟값: ${Math.min(...altData).toFixed(1)} m`,
      'yellow');
  }

  const tempData = dataFor('온도(Temperature)');
  if (tempData) {
    const avg = (tempData.reduce((a, b) => a + b, 0) / tempData.length).toFixed(1);
    makeCard('평균 온도',
      avg + ' °C',
      `범위: ${Math.min(...tempData).toFixed(1)}–${Math.max(...tempData).toFixed(1)} °C`,
      'red');
  }

  const presData = dataFor('기압(Pressure)');
  if (presData) {
    const avg = (presData.reduce((a, b) => a + b, 0) / presData.length).toFixed(1);
    makeCard('평균 기압',
      avg + ' hPa',
      `범위: ${Math.min(...presData).toFixed(0)}–${Math.max(...presData).toFixed(0)} hPa`,
      'green');
  }

  const batData = dataFor('배터리 전압');
  if (batData) {
    makeCard('배터리 최소',
      Math.min(...batData).toFixed(2) + ' V',
      `최대: ${Math.max(...batData).toFixed(2)} V`,
      'yellow');
  }
}

/* ────────────────────────────────────────────
   CHARTS
──────────────────────────────────────────── */
function renderCharts() {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
  document.getElementById('charts-grid').innerHTML = '';
  document.getElementById('corr-grid').innerHTML   = '';
  document.getElementById('alt-chart-card').style.display = 'none';

  const timeCol    = colFor('시간(Time)');
  const timeLabels = isNaN(timeCol)
    ? rawData.map((_, i) => i)
    : rawData.map(r => r[timeCol]);

  // 고도 프로파일
  const altData = dataFor('고도(Altitude)');
  if (altData) {
    document.getElementById('alt-chart-card').style.display = 'block';
    charts['alt'] = new Chart(document.getElementById('altChart'), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: '고도 (m)',
          data: altData,
          borderColor: '#63a0ff',
          backgroundColor: 'rgba(99,160,255,0.08)',
          fill: true, tension: 0.3,
          pointRadius: altData.length > 200 ? 0 : 2,
          borderWidth: 2,
        }]
      },
      options: makeChartOptions()
    });
  }

  // 센서별 라인 차트
  const chartRoles = [
    '온도(Temperature)', '기압(Pressure)', '습도(Humidity)',
    '가속도 X', '가속도 Y', '가속도 Z',
    '자이로 X', '자이로 Y', '자이로 Z',
    '배터리 전압', 'RSSI'
  ];

  chartRoles.forEach(role => {
    const d = dataFor(role);
    if (!d) return;
    const color = ROLE_COLORS[role] || '#63a0ff';
    const id    = 'chart_' + role.replace(/\W/g, '_');
    const card  = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `<h4>${role}</h4>
      <div class="chart-wrap">
        <canvas id="${id}" role="img" aria-label="${role} 그래프"></canvas>
      </div>`;
    document.getElementById('charts-grid').appendChild(card);

    charts[id] = new Chart(document.getElementById(id), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: role,
          data: d,
          borderColor: color,
          backgroundColor: color + '14',
          fill: true, tension: 0.3,
          pointRadius: d.length > 200 ? 0 : 2,
          borderWidth: 2,
        }]
      },
      options: makeChartOptions()
    });
  });

  // 상관 산점도: 고도 vs 온도
  const td = dataFor('온도(Temperature)');
  if (altData && td && altData.length === td.length) {
    const scatterData = altData.map((a, i) => ({ x: a, y: td[i] }));
    const id2  = 'corr_alt_temp';
    const card2 = document.createElement('div');
    card2.className = 'chart-card';
    card2.innerHTML = `<h4>고도 vs 온도</h4>
      <div class="chart-wrap">
        <canvas id="${id2}" role="img" aria-label="고도 대 온도 산점도"></canvas>
      </div>`;
    document.getElementById('corr-grid').appendChild(card2);

    charts[id2] = new Chart(document.getElementById(id2), {
      type: 'scatter',
      data: {
        datasets: [{
          label: '고도 vs 온도',
          data: scatterData,
          backgroundColor: 'rgba(99,160,255,0.5)',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: '고도 (m)',  color: '#8896b0' }, ticks: { color: '#8896b0' }, grid: { color: 'rgba(99,160,255,0.08)' } },
          y: { title: { display: true, text: '온도 (°C)', color: '#8896b0' }, ticks: { color: '#8896b0' }, grid: { color: 'rgba(99,160,255,0.08)' } }
        }
      }
    });
  }

  // 합성 가속도 크기
  const ax = dataFor('가속도 X'), ay = dataFor('가속도 Y'), az = dataFor('가속도 Z');
  if (ax && ay && az) {
    const mag   = ax.map((v, i) => parseFloat(Math.sqrt(v*v + ay[i]*ay[i] + az[i]*az[i]).toFixed(3)));
    const id3   = 'chart_accel_mag';
    const card3 = document.createElement('div');
    card3.className = 'chart-card';
    card3.innerHTML = `<h4>가속도 합성 크기 (m/s²)</h4>
      <div class="chart-wrap">
        <canvas id="${id3}" role="img" aria-label="가속도 합성 크기 그래프"></canvas>
      </div>`;
    document.getElementById('corr-grid').appendChild(card3);

    charts[id3] = new Chart(document.getElementById(id3), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: '합성 가속도',
          data: mag,
          borderColor: '#b57bff',
          backgroundColor: 'rgba(181,123,255,0.08)',
          fill: true, tension: 0.3,
          pointRadius: mag.length > 200 ? 0 : 2,
          borderWidth: 2,
        }]
      },
      options: makeChartOptions()
    });
  }
}

function makeChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141c2e',
        borderColor: 'rgba(99,160,255,0.2)',
        borderWidth: 1,
        titleColor: '#63a0ff',
        bodyColor: '#e8edf8'
      }
    },
    scales: {
      x: { ticks: { color: '#8896b0', maxTicksLimit: 8 }, grid: { color: 'rgba(99,160,255,0.06)' } },
      y: { ticks: { color: '#8896b0' },                   grid: { color: 'rgba(99,160,255,0.06)' } }
    }
  };
}

/* ────────────────────────────────────────────
   TABLE
──────────────────────────────────────────── */
function renderTable() {
  const head = document.getElementById('tbl-head');
  head.innerHTML = '<tr>' +
    headers.map((h, i) =>
      `<th onclick="sortTable(${i})">${h} <i class="fas fa-sort" style="opacity:0.3;font-size:10px"></i></th>`
    ).join('') +
  '</tr>';
  renderTableRows();
}

window.sortTable = function(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = true; }
  filteredData.sort((a, b) => {
    const va = a[col], vb = b[col];
    if (va == null) return 1;
    if (vb == null) return -1;
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
  page = 0;
  renderTableRows();
};

document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  filteredData = q
    ? rawData.filter(r => r.some(v => String(v).toLowerCase().includes(q)))
    : [...rawData];
  page = 0;
  renderTableRows();
});

function renderTableRows() {
  const start = page * PAGE_SIZE;
  const rows  = filteredData.slice(start, start + PAGE_SIZE);
  const body  = document.getElementById('tbl-body');

  body.innerHTML = rows.map(r =>
    '<tr>' +
    headers.map((_, i) => {
      const v     = r[i] != null ? r[i] : '';
      const isNum = typeof r[i] === 'number';
      return `<td class="${isNum ? 'num' : ''}">${isNum ? (+v.toFixed(4)) : v}</td>`;
    }).join('') +
    '</tr>'
  ).join('');

  const total = filteredData.length;
  document.getElementById('page-info').textContent =
    `${start + 1}–${Math.min(start + PAGE_SIZE, total)} / ${total.toLocaleString()}행`;
  document.getElementById('page-num').textContent =
    `${page + 1} / ${Math.ceil(total / PAGE_SIZE)}`;
  document.getElementById('prev-btn').disabled = page === 0;
  document.getElementById('next-btn').disabled = start + PAGE_SIZE >= total;
}

document.getElementById('prev-btn').addEventListener('click', () => { page--; renderTableRows(); });
document.getElementById('next-btn').addEventListener('click', () => { page++; renderTableRows(); });

document.getElementById('export-csv-btn').addEventListener('click', () => {
  const csv = [headers.join(','), ...filteredData.map(r => r.join(','))].join('\n');
  const a   = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'cansat_export.csv';
  a.click();
});
