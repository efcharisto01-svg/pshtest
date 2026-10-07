// 데모용 로그인 상태: 실제 로그인 구현 전까지 홈의 로그인 버튼으로 켜고 끈다
(function () {
  var KEY = 'psh-demo-user';
  var memory = null; // 저장소를 못 쓰는 환경 대비
  var DEMO = { name: '홍길동', birth: '19900101', gender: '남성', phone: '010-1234-5678' };

  var Session = {
    get: function () {
      try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : memory; } catch (e) { return memory; }
    },
    login: function () { memory = DEMO; try { localStorage.setItem(KEY, JSON.stringify(DEMO)); } catch (e) {} },
    logout: function () { memory = null; try { localStorage.removeItem(KEY); } catch (e) {} }
  };
  window.Session = Session;

  var pill = document.getElementById('auth-pill');
  if (!pill) return;
  function paint() {
    var u = Session.get();
    pill.textContent = u ? u.name + '님 · 로그아웃' : '로그인';
  }
  pill.addEventListener('click', function (e) {
    e.preventDefault();
    if (Session.get()) Session.logout(); else Session.login();
    paint();
  });
  paint();
})();
