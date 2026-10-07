// 팝업(바텀시트) 열기·닫기
(function () {
  var opener = null;

  function open(id, from) {
    var sheet = document.getElementById(id);
    if (!sheet) return;
    opener = from;
    sheet.hidden = false;
    var first = sheet.querySelector('a[href]:not([aria-disabled]), button:not([data-close])') || sheet.querySelector('button');
    if (first) first.focus();
  }

  function close(sheet) {
    sheet.hidden = true;
    if (opener) opener.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open]');
    if (trigger) { e.preventDefault(); open(trigger.getAttribute('data-open'), trigger); return; }
    var closer = e.target.closest('[data-close]');
    if (closer) { close(closer.closest('.sheet')); return; }
    var disabled = e.target.closest('[aria-disabled="true"]');
    if (disabled) e.preventDefault();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var sheet = document.querySelector('.sheet:not([hidden])');
    if (sheet) close(sheet);
  });
})();
