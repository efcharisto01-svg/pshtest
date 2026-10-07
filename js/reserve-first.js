// 처음 방문 예약: 4단계 입력 흐름 (환자 정보 → 진료과 → 의사·시간 → 확인)
(function () {
  var TOTAL = 4;
  var step = 1;
  var data = { dept: null, doctor: null, date: null, time: null };

  // 예시 데이터: 실제 병원 정보로 교체 예정
  var DEPTS = [
    { id: '내과', sub: '감기, 소화기, 고혈압·당뇨', fee: 15000 },
    { id: '정형외과', sub: '관절, 허리, 근육 통증', fee: 18000 },
    { id: '피부과', sub: '피부 질환, 알레르기', fee: 15000 },
    { id: '이비인후과', sub: '코, 목, 귀', fee: 15000 },
    { id: '소아청소년과', sub: '만 18세 이하', fee: 12000 },
    { id: '산부인과', sub: '여성 질환, 임신', fee: 18000 }
  ];
  var DOCTORS = {
    '내과': ['김서연', '이준호'], '정형외과': ['박민수', '최유진'], '피부과': ['정하윤', '한도현'],
    '이비인후과': ['오지훈', '서민아'], '소아청소년과': ['윤서아', '강태민'], '산부인과': ['임수현', '조은별']
  };
  var TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  function $(id) { return document.getElementById(id); }
  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  // 선택 가능한 날짜: 오늘부터 7일, 일요일 제외
  function dates() {
    var out = [], d = new Date();
    for (var i = 0; out.length < 7 && i < 14; i++, d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) continue;
      out.push({ key: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), label: (d.getMonth() + 1) + '/' + d.getDate() + '(' + DAYS[d.getDay()] + ')', text: (d.getMonth() + 1) + '월 ' + d.getDate() + '일(' + DAYS[d.getDay()] + ')' });
    }
    return out;
  }
  // 예시로 일부 시간은 마감 처리 (날짜·의사에 따라 달라지는 고정 규칙)
  function taken(time, dateKey, doctor) {
    var seed = 0, s = time + dateKey + doctor;
    for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) % 97;
    return seed % 4 === 0;
  }

  function fieldError(id, show, inputId) {
    $(id).hidden = !show;
    if (inputId) { var i = $(inputId); if (show) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
  }

  function validateStep1() {
    var ok = true, firstBad = null;
    function check(cond, errId, inputId) { fieldError(errId, !cond, inputId); if (!cond) { ok = false; if (!firstBad) firstBad = inputId || errId; } }
    check($('name').value.trim().length >= 2, 'name-err', 'name');
    check(/^(19|20)\d{6}$/.test($('birth').value), 'birth-err', 'birth');
    check(!!data.gender, 'gender-err');
    check(/^01\d-\d{3,4}-\d{4}$/.test($('phone').value), 'phone-err', 'phone');
    check($('agree').checked, 'agree-err');
    if (firstBad && $(firstBad)) $(firstBad).focus();
    return ok;
  }

  function renderDepts() {
    var ul = $('dept-list');
    ul.textContent = '';
    DEPTS.forEach(function (d) {
      var li = el('li'), b = el('button', 'list__item list__item--link');
      b.type = 'button';
      if (data.dept === d.id) b.setAttribute('aria-selected', 'true');
      var main = el('span', 'list__main');
      main.appendChild(el('span', 'list__title', d.id));
      main.appendChild(el('span', 'list__sub', d.sub));
      b.appendChild(main);
      b.addEventListener('click', function () {
        if (data.dept !== d.id) { data.dept = d.id; data.doctor = data.date = data.time = null; }
        renderDepts(); update();
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  function renderStep3() {
    $('dept-note').textContent = data.dept + ' · 일요일은 쉬어요';
    var dl = $('doctor-list'); dl.textContent = '';
    (DOCTORS[data.dept] || []).forEach(function (name) {
      var b = el('button', 'card card--selectable');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(data.doctor === name));
      var row = el('div', 'row');
      var box = el('div'); box.appendChild(el('h3', '', name + ' 전문의')); box.appendChild(el('p', 'muted', data.dept));
      row.appendChild(box); b.appendChild(row);
      b.addEventListener('click', function () { data.doctor = name; data.time = null; renderStep3(); update(); });
      dl.appendChild(b);
    });

    var dt = $('date-list'); dt.textContent = '';
    dates().forEach(function (d) {
      var b = el('button', 'chip', d.label);
      b.type = 'button'; b.setAttribute('aria-pressed', String(data.date && data.date.key === d.key));
      b.addEventListener('click', function () { data.date = d; data.time = null; renderStep3(); update(); });
      dt.appendChild(b);
    });

    var tm = $('time-list'); tm.textContent = '';
    if (!data.doctor || !data.date) { tm.appendChild(el('p', 'muted', '의사와 날짜를 먼저 선택해 주세요.')); return; }
    TIMES.forEach(function (t) {
      var b = el('button', 'chip', t);
      b.type = 'button';
      var full = taken(t, data.date.key, data.doctor);
      b.disabled = full;
      if (full) b.setAttribute('aria-label', t + ' 마감');
      b.setAttribute('aria-pressed', String(data.time === t));
      b.addEventListener('click', function () { data.time = t; renderStep3(); update(); });
      tm.appendChild(b);
    });
  }

  function renderConfirm() {
    var dept = DEPTS.filter(function (d) { return d.id === data.dept; })[0];
    var rows = [
      ['환자', $('name').value.trim() + ' (' + data.gender + ')'],
      ['생년월일', $('birth').value.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')],
      ['휴대폰', $('phone').value],
      ['진료과', data.dept],
      ['의사', data.doctor + ' 전문의'],
      ['일시', data.date.text + ' ' + data.time],
      ['예상 진료비', won(dept.fee)]
    ];
    if ($('memo').value.trim()) rows.splice(6, 0, ['증상 메모', $('memo').value.trim()]);
    var dl = $('confirm'); dl.textContent = '';
    rows.forEach(function (r, i) {
      var div = el('div', i === rows.length - 1 ? 'total' : '');
      div.appendChild(el('dt', '', r[0])); div.appendChild(el('dd', '', r[1]));
      dl.appendChild(div);
    });
  }

  function canNext() {
    if (step === 2) return !!data.dept;
    if (step === 3) return !!(data.doctor && data.date && data.time);
    return true;
  }

  function update() {
    document.querySelectorAll('[data-step]').forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== step; });
    $('step-label').textContent = step + ' / ' + TOTAL;
    Array.prototype.forEach.call($('steps').children, function (li, i) {
      li.removeAttribute('aria-current'); li.removeAttribute('data-state');
      if (i + 1 < step) li.setAttribute('data-state', 'done');
      if (i + 1 === step) li.setAttribute('aria-current', 'step');
    });
    var next = $('next');
    next.textContent = step === TOTAL ? '접수하기' : '다음';
    next.disabled = !canNext();
  }

  function go(n) {
    step = n;
    if (n === 2) renderDepts();
    if (n === 3) renderStep3();
    if (n === 4) renderConfirm();
    update();
    window.scrollTo(0, 0);
  }

  $('back').addEventListener('click', function () { if (step === 1) location.href = 'index.html'; else go(step - 1); });
  $('next').addEventListener('click', function () {
    if (step === 1 && !validateStep1()) return;
    if (step < TOTAL) { go(step + 1); return; }
    // 마지막 단계: 로그인이 필요하다고 안내 (로그인 기능은 다음 단계에서 구현)
    var sheet = $('login-sheet'); sheet.hidden = false; sheet.querySelector('[data-close].btn').focus();
  });

  document.querySelectorAll('[data-gender]').forEach(function (b) {
    b.addEventListener('click', function () {
      data.gender = b.getAttribute('data-gender');
      document.querySelectorAll('[data-gender]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      fieldError('gender-err', false);
    });
  });
  $('birth').addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
  $('phone').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = d.length > 7 ? d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
  });

  update();
})();
