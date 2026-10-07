// 처음 방문 접수 흐름
//  A) 진료과 선택 → 증상 → (환자정보) → 접수대기 → 접수완료
//  B) 진료과 추천(인체 모형도 → 질문 → 결과) → 증상 → (환자정보) → 접수대기 → 접수완료
//  로그인 상태이면 환자정보 단계를 건너뛴다.
(function () {
  // 예시 데이터: 실제 병원 진료과로 교체 예정
  var DEPTS = [
    { id: '내과', sub: '감기, 소화기, 고혈압·당뇨' }, { id: '외과', sub: '복통, 상처, 수술이 필요한 질환' },
    { id: '정형외과', sub: '뼈, 관절, 허리, 근육 통증' }, { id: '신경과', sub: '두통, 어지럼, 저림' },
    { id: '피부과', sub: '피부 질환, 알레르기' }, { id: '이비인후과', sub: '코, 목, 귀' },
    { id: '안과', sub: '눈 질환, 시력' }, { id: '산부인과', sub: '여성 질환, 임신' },
    { id: '비뇨의학과', sub: '소변, 신장, 남성 질환' }, { id: '소아청소년과', sub: '만 18세 이하' }
  ];
  var NAMES = DEPTS.map(function (d) { return d.id; });
  var SVGNS = 'http://www.w3.org/2000/svg';

  // 인체 모형도 도형 (viewBox 200 x 396)
  var SHAPES = {
    front: [
      ['head', 'circle', { cx: 100, cy: 38, r: 26 }], ['face', 'circle', { cx: 74, cy: 40, r: 4 }], ['face', 'circle', { cx: 126, cy: 40, r: 4 }],
      ['face', 'rect', { x: 88, y: 46, width: 24, height: 14, rx: 6 }], ['eye', 'ellipse', { cx: 90, cy: 36, rx: 6, ry: 4 }], ['eye', 'ellipse', { cx: 110, cy: 36, rx: 6, ry: 4 }],
      ['neck', 'rect', { x: 90, y: 66, width: 20, height: 16, rx: 6 }], ['chest', 'rect', { x: 60, y: 84, width: 80, height: 52, rx: 16 }],
      ['abdomen', 'rect', { x: 64, y: 138, width: 72, height: 48, rx: 14 }], ['pelvis', 'rect', { x: 62, y: 188, width: 76, height: 32, rx: 14 }],
      ['arm', 'rect', { x: 34, y: 88, width: 22, height: 84, rx: 11 }], ['arm', 'rect', { x: 144, y: 88, width: 22, height: 84, rx: 11 }],
      ['hand', 'circle', { cx: 45, cy: 184, r: 11 }], ['hand', 'circle', { cx: 155, cy: 184, r: 11 }],
      ['leg', 'rect', { x: 64, y: 222, width: 34, height: 140, rx: 16 }], ['leg', 'rect', { x: 102, y: 222, width: 34, height: 140, rx: 16 }],
      ['foot', 'ellipse', { cx: 81, cy: 376, rx: 18, ry: 11 }], ['foot', 'ellipse', { cx: 119, cy: 376, rx: 18, ry: 11 }]
    ],
    back: [
      ['head', 'circle', { cx: 100, cy: 38, r: 26 }], ['neck', 'rect', { x: 90, y: 66, width: 20, height: 16, rx: 6 }],
      ['back', 'rect', { x: 60, y: 84, width: 80, height: 54, rx: 16 }], ['lowback', 'rect', { x: 64, y: 140, width: 72, height: 44, rx: 14 }],
      ['buttock', 'rect', { x: 62, y: 186, width: 76, height: 36, rx: 16 }],
      ['arm', 'rect', { x: 34, y: 88, width: 22, height: 84, rx: 11 }], ['arm', 'rect', { x: 144, y: 88, width: 22, height: 84, rx: 11 }],
      ['hand', 'circle', { cx: 45, cy: 184, r: 11 }], ['hand', 'circle', { cx: 155, cy: 184, r: 11 }],
      ['leg', 'rect', { x: 64, y: 224, width: 34, height: 138, rx: 16 }], ['leg', 'rect', { x: 102, y: 224, width: 34, height: 138, rx: 16 }],
      ['foot', 'ellipse', { cx: 81, cy: 376, rx: 18, ry: 11 }], ['foot', 'ellipse', { cx: 119, cy: 376, rx: 18, ry: 11 }]
    ]
  };

  var s = { mode: null, dept: null, part: null, depth: null, type: null, cause: null, symptom: '', gender: null, reco: null, side: 'front', patient: null, ticket: null };
  var current = 'mode';
  var trail = [];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function user() { return window.Session && window.Session.get(); }

  // ----- 단계 순서와 진행 표시 -----
  function path() {
    var p = s.mode === 'recommend' ? ['body', 'ask', 'result', 'symptom', 'patient'] : ['dept', 'symptom', 'patient'];
    if (user()) p.pop();
    return p;
  }
  function paintProgress() {
    var list = path(), idx = list.indexOf(current);
    if (idx < 0 && current === 'dept') idx = list.indexOf('result');
    var hideProgress = idx < 0;
    $('steps').hidden = hideProgress;
    $('step-label').textContent = hideProgress ? '' : (idx + 1) + ' / ' + list.length;
    var ol = $('steps'); ol.textContent = '';
    list.forEach(function (_, i) {
      var li = el('li');
      if (i < idx) li.setAttribute('data-state', 'done');
      if (i === idx) li.setAttribute('aria-current', 'step');
      ol.appendChild(li);
    });
  }

  // ----- 단계 이동 -----
  function go(id, back) {
    if (!back && current !== id) trail.push(current);
    current = id;
    document.querySelectorAll('[data-step]').forEach(function (sec) { sec.hidden = sec.getAttribute('data-step') !== id; });
    if (id === 'dept') renderDepts();
    if (id === 'body') renderBody();
    if (id === 'ask') renderAsk();
    if (id === 'result') renderResult();
    if (id === 'symptom') renderSymptom();
    paintProgress();
    paintBar();
    window.scrollTo(0, 0);
  }

  function nextLabel() {
    if (current === 'result') return s.reco.main + '로 접수하기';
    if (current === 'symptom') return user() ? '접수하기' : '다음';
    if (current === 'patient') return '접수하기';
    if (current === 'status') return '홈으로';
    return '다음';
  }
  function canNext() {
    if (current === 'dept') return !!s.dept;
    if (current === 'body') return !!s.part;
    if (current === 'ask') return !!(s.depth && s.type && s.cause);
    return true;
  }
  function paintBar() {
    var showBar = current !== 'mode' && !(current === 'status' && s.ticket && s.ticket.state === 'waiting');
    $('bar').hidden = !showBar;
    $('next').textContent = nextLabel();
    $('next').disabled = !canNext();
  }

  // ----- 진료과 선택 -----
  function renderDepts() {
    $('dept-hint').textContent = s.mode === 'recommend' ? '추천 대신 직접 고를 수 있어요.' : '우리 병원 진료과예요.';
    var ul = $('dept-list'); ul.textContent = '';
    DEPTS.forEach(function (d) {
      var li = el('li'), b = el('button', 'list__item list__item--link'); b.type = 'button';
      if (s.dept === d.id) b.setAttribute('aria-selected', 'true');
      var main = el('span', 'list__main'); main.appendChild(el('span', 'list__title', d.id)); main.appendChild(el('span', 'list__sub', d.sub));
      b.appendChild(main);
      b.addEventListener('click', function () { s.dept = d.id; renderDepts(); paintBar(); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  // ----- 인체 모형도 -----
  function renderBody() {
    var svg = $('body-svg'); svg.textContent = '';
    SHAPES[s.side].forEach(function (sh) {
      var node = document.createElementNS(SVGNS, sh[1]);
      Object.keys(sh[2]).forEach(function (k) { node.setAttribute(k, sh[2][k]); });
      node.setAttribute('class', 'part');
      node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button');
      node.setAttribute('aria-label', window.Recommend.PART_LABEL[sh[0]]);
      node.setAttribute('aria-pressed', String(s.part === sh[0]));
      var pick = function () { s.part = sh[0]; renderBody(); paintBar(); };
      node.addEventListener('click', pick);
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      svg.appendChild(node);
    });
    $('picked').textContent = s.part ? '선택: ' + window.Recommend.PART_LABEL[s.part] : '';
    document.querySelectorAll('[data-side]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-side') === s.side)); });
  }

  // ----- 질문 -----
  function renderAsk() {
    $('ask-part').textContent = '선택한 부위: ' + window.Recommend.PART_LABEL[s.part];
    document.querySelectorAll('[data-ask]').forEach(function (g) {
      var key = g.getAttribute('data-ask');
      Array.prototype.forEach.call(g.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', String(s[key] === c.getAttribute('data-v'))); });
    });
  }

  // ----- 추천 결과 -----
  function renderResult() {
    s.reco = window.Recommend.recommend({ part: s.part, depth: s.depth, type: s.type, cause: s.cause }, NAMES);
    $('reco-dept').textContent = s.reco.main;
    $('reco-reason').textContent = s.reco.reason;
    $('reco-warn').hidden = !s.reco.warn; $('reco-warn').textContent = s.reco.warn || '';
    $('reco-others-box').hidden = !s.reco.others.length;
    var ul = $('reco-others'); ul.textContent = '';
    s.reco.others.forEach(function (name) {
      var d = DEPTS.filter(function (x) { return x.id === name; })[0];
      var li = el('li'), b = el('button', 'list__item list__item--link'); b.type = 'button';
      var main = el('span', 'list__main'); main.appendChild(el('span', 'list__title', d.id)); main.appendChild(el('span', 'list__sub', d.sub));
      b.appendChild(main);
      b.addEventListener('click', function () { s.dept = name; go('symptom'); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  // ----- 증상 서술 -----
  function renderSymptom() {
    $('symptom-dept').textContent = s.dept;
    var ta = $('symptom');
    if (!ta.value.trim() && s.mode === 'recommend' && s.reco) { ta.value = s.reco.summary + ' '; s.symptom = ta.value; }
    $('symptom-count').textContent = String(ta.value.length);
  }

  // ----- 환자 정보 -----
  function fieldError(id, show, inputId) {
    $(id).hidden = !show;
    if (inputId) { var i = $(inputId); if (show) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
  }
  function validatePatient() {
    var ok = true, firstBad = null;
    function check(cond, errId, inputId) { fieldError(errId, !cond, inputId); if (!cond) { ok = false; if (!firstBad) firstBad = inputId || errId; } }
    check($('name').value.trim().length >= 2, 'name-err', 'name');
    check(/^(19|20)\d{6}$/.test($('birth').value), 'birth-err', 'birth');
    check(!!s.gender, 'gender-err');
    check(/^01\d-\d{3,4}-\d{4}$/.test($('phone').value), 'phone-err', 'phone');
    check($('agree').checked, 'agree-err');
    if (firstBad && $(firstBad)) $(firstBad).focus();
    return ok;
  }

  // ----- 접수 -----
  function submit() {
    var u = user();
    s.patient = u ? { name: u.name, birth: u.birth, gender: u.gender, phone: u.phone } :
      { name: $('name').value.trim(), birth: $('birth').value, gender: s.gender, phone: $('phone').value };
    s.ticket = { no: 'A-' + (10 + Math.floor(Math.random() * 40)), state: 'waiting', at: new Date() };
    renderStatus();
    go('status');
  }
  function renderStatus() {
    var waiting = s.ticket.state === 'waiting';
    $('ticket-no').textContent = s.ticket.no;
    var b = $('status-badge'); b.textContent = waiting ? '접수 대기' : '접수 완료'; b.className = 'badge ' + (waiting ? 'badge--warn' : 'badge--ok');
    $('status-msg').textContent = waiting ? '접수 확인을 기다리고 있어요. 이 화면을 닫아도 접수는 유지돼요.' : '접수가 완료됐어요. 로비에서 번호가 호출될 때까지 기다려 주세요.';
    var items = $('track').children;
    Array.prototype.forEach.call(items, function (li, i) {
      li.removeAttribute('data-state'); li.removeAttribute('aria-current');
      var cur = waiting ? 1 : 2;
      if (i < cur) li.setAttribute('data-state', 'done');
      if (i === cur) li.setAttribute('aria-current', 'step');
    });
    $('demo-box').hidden = !waiting;
    var p = s.patient, t = s.ticket.at;
    var rows = [['진료과', s.dept], ['환자', p.name], ['휴대폰', p.phone], ['접수 시각', t.getHours() + ':' + ('0' + t.getMinutes()).slice(-2)], ['증상', s.symptom.trim()]];
    var dl = $('status-summary'); dl.textContent = '';
    rows.forEach(function (r) { var d = el('div'); d.appendChild(el('dt', '', r[0])); d.appendChild(el('dd', '', r[1])); dl.appendChild(d); });
    paintBar();
  }

  // ----- 이벤트 -----
  $('mode-select').addEventListener('click', function () { s.mode = 'select'; go('dept'); });
  $('mode-recommend').addEventListener('click', function () { s.mode = 'recommend'; go('body'); });
  $('back').addEventListener('click', function () {
    if (current === 'status' || !trail.length) { location.href = 'index.html'; return; }
    go(trail.pop(), true);
  });
  $('next').addEventListener('click', function () {
    if (current === 'status') { location.href = 'index.html'; return; }
    if (current === 'symptom') {
      s.symptom = $('symptom').value;
      if (s.symptom.trim().length < 5) { fieldError('symptom-err', true, 'symptom'); $('symptom').focus(); return; }
      fieldError('symptom-err', false, 'symptom');
      if (user()) { submit(); } else { go('patient'); }
      return;
    }
    if (current === 'patient') { if (validatePatient()) submit(); return; }
    if (current === 'body') { go('ask'); return; }
    if (current === 'ask') { go('result'); return; }
    if (current === 'result') { s.dept = s.reco.main; go('symptom'); return; }
    if (current === 'dept') { go('symptom'); return; }
  });
  $('reco-manual').addEventListener('click', function () { go('dept'); });
  $('demo-done').addEventListener('click', function () { s.ticket.state = 'done'; renderStatus(); });
  $('symptom').addEventListener('input', function () { $('symptom-count').textContent = String(this.value.length); });

  document.querySelectorAll('[data-side]').forEach(function (b) { b.addEventListener('click', function () { s.side = b.getAttribute('data-side'); s.part = null; renderBody(); paintBar(); }); });
  document.querySelectorAll('[data-ask]').forEach(function (g) {
    var key = g.getAttribute('data-ask');
    Array.prototype.forEach.call(g.querySelectorAll('.chip'), function (c) {
      c.addEventListener('click', function () { s[key] = c.getAttribute('data-v'); renderAsk(); paintBar(); });
    });
  });
  document.querySelectorAll('[data-gender]').forEach(function (b) {
    b.addEventListener('click', function () {
      s.gender = b.getAttribute('data-gender');
      document.querySelectorAll('[data-gender]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      fieldError('gender-err', false);
    });
  });
  $('birth').addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
  $('phone').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = d.length > 7 ? d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
  });

  var u = user();
  if (u) { $('login-note').hidden = false; $('login-note').textContent = u.name + '님으로 접수해요. 환자 정보 입력은 건너뛰어요.'; }
  go('mode');
})();
