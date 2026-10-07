// 진료과 추천 규칙: 아픈 부위 + 질문 답변을 점수로 합산해 진료과를 정한다.
// 규칙을 바꾸려면 아래 표의 숫자만 고치면 된다. (병원에 없는 진료과는 DEPTS에 있어야 추천됨)
(function () {
  var PART_LABEL = { head: '머리', eye: '눈', face: '귀·코·입', neck: '목', chest: '가슴', abdomen: '배', pelvis: '아랫배·골반',
    arm: '어깨·팔', hand: '손', leg: '다리', foot: '발', back: '등', lowback: '허리', buttock: '엉덩이' };

  // 1) 부위별 기본 점수
  var PART = {
    head: { 신경과: 4, 내과: 1, 이비인후과: 1 }, eye: { 안과: 8 }, face: { 이비인후과: 6, 피부과: 1 },
    neck: { 정형외과: 3, 이비인후과: 2, 신경과: 1 }, chest: { 내과: 5, 정형외과: 1 }, abdomen: { 내과: 4, 외과: 2 },
    pelvis: { 비뇨의학과: 3, 산부인과: 3, 외과: 1 }, arm: { 정형외과: 5, 신경과: 1 }, hand: { 정형외과: 4, 피부과: 1, 신경과: 1 },
    leg: { 정형외과: 5, 신경과: 1 }, foot: { 정형외과: 4, 피부과: 1 }, back: { 정형외과: 5, 내과: 1 },
    lowback: { 정형외과: 5, 비뇨의학과: 1 }, buttock: { 정형외과: 3, 외과: 2, 피부과: 1 }
  };
  // 2) 안쪽(속)인지 바깥쪽(겉)인지
  var DEPTH = {
    inside: { 내과: 2, 신경과: 1 },
    outside: { 정형외과: 2, 피부과: 2, 외과: 1 }
  };
  // 3) 아픈 모양
  var TYPE = {
    stab: { 외과: 1, 내과: 1, 신경과: 1 },        // 찌르듯이
    cut: { 외과: 2, 피부과: 1 },                  // 칼로 베는 듯이
    throb: { 정형외과: 2 },                       // 욱신욱신 쑤심
    dull: { 정형외과: 1, 내과: 1 },               // 묵직하고 뻐근함
    burn: { 피부과: 3, 신경과: 1 },               // 화끈거리거나 가려움
    squeeze: { 내과: 3 },                         // 조이거나 누르는 듯함
    numb: { 신경과: 4 }                           // 저리고 감각이 이상함
  };
  // 4) 아프게 된 계기
  var CAUSE = {
    injury: { 정형외과: 3, 외과: 3 },
    sudden: { 내과: 1, 신경과: 1 },
    gradual: { 정형외과: 1, 내과: 1 }
  };
  var TYPE_LABEL = { stab: '찌르듯이', cut: '칼로 베는 듯이', throb: '욱신욱신 쑤시게', dull: '묵직하고 뻐근하게', burn: '화끈거리거나 가렵게', squeeze: '조이거나 누르는 듯이', numb: '저리고 감각이 이상하게' };
  var DEPTH_LABEL = { inside: '몸 안쪽', outside: '겉(피부·근육·뼈)' };
  var CAUSE_LABEL = { injury: '다친 뒤', sudden: '갑자기', gradual: '서서히' };

  function add(total, table, key) {
    var t = table[key] || {};
    Object.keys(t).forEach(function (d) { total[d] = (total[d] || 0) + t[d]; });
  }

  // answers: { part, depth, type, cause }, available: 병원에 있는 진료과 이름 배열
  function recommend(a, available) {
    var total = {};
    add(total, PART, a.part); add(total, DEPTH, a.depth); add(total, TYPE, a.type); add(total, CAUSE, a.cause);
    var list = Object.keys(total).filter(function (d) { return available.indexOf(d) >= 0; })
      .sort(function (x, y) { return total[y] - total[x] || available.indexOf(x) - available.indexOf(y); });
    if (!list.length) list = ['내과'];
    var warn = null;
    if (a.part === 'chest' || (a.part === 'head' && a.cause === 'sudden' && (a.type === 'stab' || a.type === 'squeeze')) || (a.part === 'abdomen' && a.type === 'cut' && a.cause === 'sudden')) {
      warn = '숨쉬기 힘들거나 통증이 매우 심하고 계속되면 접수하지 말고 바로 119나 응급실로 가세요.';
    }
    return {
      main: list[0],
      others: list.slice(1, 3),
      warn: warn,
      reason: PART_LABEL[a.part] + '(' + DEPTH_LABEL[a.depth] + ') 부위가 ' + TYPE_LABEL[a.type] + ' 아프고 ' + CAUSE_LABEL[a.cause] + ' 시작된 경우, ' + list[0] + '에서 먼저 진료하는 경우가 많아요.',
      summary: PART_LABEL[a.part] + '(' + DEPTH_LABEL[a.depth] + ') 부위가 ' + TYPE_LABEL[a.type] + ' 아파요. (' + CAUSE_LABEL[a.cause] + ' 시작)'
    };
  }
  window.Recommend = { recommend: recommend, PART_LABEL: PART_LABEL };
})();
