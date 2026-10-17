/* مساعد Claude — يجهّز وصف الحالة ويفتحه في Claude. لا يُرسل شيء إلا عند ضغط الزر. */
(function () {
  'use strict';
  var css = '.aih-bg{position:fixed;inset:0;background:rgba(10,20,18,.55);z-index:9000;display:flex;align-items:flex-end;justify-content:center;padding:0}' +
    '@media(min-width:700px){.aih-bg{align-items:center;padding:20px}}' +
    '.aih{background:var(--surface,#fff);color:var(--ink,#18211F);width:min(100%,720px);max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:18px 18px 22px;display:flex;flex-direction:column;gap:12px;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;direction:rtl;text-align:right}' +
    '@media(min-width:700px){.aih{border-radius:20px}}' +
    '.aih h2{margin:0;font-size:1.15rem;display:flex;align-items:center;gap:8px;font-family:"Readex Pro","IBM Plex Sans Arabic",sans-serif}' +
    '.aih .spark{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--brand,#1F5E58);color:#fff;font-size:1rem;flex:none}' +
    '.aih .hd{display:flex;align-items:center;gap:10px}.aih .hd h2{flex:1}' +
    '.aih .x{border:0;background:var(--sunk,#E8EDEB);width:40px;height:40px;border-radius:12px;font-size:1.1rem;cursor:pointer;color:inherit}' +
    '.aih .lbl{font-weight:700;font-size:.9rem;color:var(--muted,#56635F)}' +
    '.aih .tasks{display:flex;flex-wrap:wrap;gap:6px}' +
    '.aih .tasks button{border:1.5px solid var(--line,#D8E0DD);background:var(--surface,#fff);color:inherit;border-radius:999px;padding:8px 14px;font:inherit;font-size:.88rem;font-weight:600;cursor:pointer;min-height:40px}' +
    '.aih .tasks button[aria-pressed="true"]{background:var(--brand,#1F5E58);border-color:var(--brand,#1F5E58);color:#fff}' +
    '.aih textarea,.aih input[type=text]{width:100%;border:1.5px solid var(--line,#D8E0DD);background:var(--surface,#fff);color:inherit;border-radius:12px;padding:10px 12px;font:inherit;font-size:.92rem;box-sizing:border-box}' +
    '.aih textarea{min-height:190px;line-height:1.7;resize:vertical}' +
    '.aih .chk{display:flex;gap:8px;align-items:center;font-weight:600;font-size:.92rem}.aih .chk input{width:20px;height:20px;accent-color:var(--brand,#1F5E58)}' +
    '.aih .acts{display:flex;gap:8px;flex-wrap:wrap}' +
    '.aih .b{border:0;border-radius:12px;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer;min-height:46px}' +
    '.aih .b.p{background:var(--brand,#1F5E58);color:#fff;flex:1}.aih .b.s{background:var(--sunk,#E8EDEB);color:inherit}' +
    '.aih .note{font-size:.8rem;color:var(--muted,#56635F);background:var(--sunk,#E8EDEB);border-radius:10px;padding:8px 12px;margin:0;line-height:1.7}' +
    '.aih details summary{cursor:pointer;font-weight:700;font-size:.9rem;color:var(--muted,#56635F)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var PRE = 'أنتِ مستشارة تربوية خبيرة في التوجيه والإرشاد الطلابي بمدارس المملكة العربية السعودية، وتعرفين قواعد السلوك والمواظبة ودليل التوجيه والإرشاد الطلابي. أنا موجهة طلابية في مدرسة ابتدائية للبنات، وأحتاج مساعدتك في الحالة التالية.';
  var POST = 'اكتبي ردّك بالعربية الفصحى المبسطة، بنقاط عملية قابلة للتطبيق في المدرسة الابتدائية، ومراعية لسرية الطالبة وكرامتها. وإذا كانت المعلومات ناقصة، اذكري ما أحتاج أسأل عنه.';

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function anon(text, name) {
    if (!name) return text;
    var clean = String(name).replace(/\(.*?\)/g, '').replace(/^مثال:\s*/, '').trim();
    var parts = clean.split(/\s+/).filter(function (p) { return p.length > 1; });
    var out = text;
    if (clean) out = out.replace(new RegExp(escRe(clean), 'g'), 'الطالبة');
    if (String(name).trim() !== clean) out = out.replace(new RegExp(escRe(String(name).trim()), 'g'), 'الطالبة');
    if (parts[0]) out = out.replace(new RegExp('(^|[\\s،.:(])' + escRe(parts[0]) + '(?=$|[\\s،.:)])', 'g'), '$1الطالبة');
    return out;
  }
  function build(o, task, extra, hide) {
    var ctx = hide ? anon(o.context, o.name) : o.context;
    return PRE + '\n\n' + 'بيانات الحالة:\n' + ctx.trim() + '\n\n' + 'المطلوب: ' + task + (extra ? '\n' + 'ملاحظة إضافية: ' + extra : '') + '\n\n' + POST;
  }
  function copy(t) {
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(t); }); } catch (e) {}
    return Promise.resolve(legacy(t));
  }
  function legacy(t) { var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); return ok; }
  function msg(t) { if (typeof window.toast === 'function') { window.toast(t); return; } var el = document.createElement('div'); el.textContent = t; el.setAttribute('role', 'status'); el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#18211F;color:#fff;padding:12px 18px;border-radius:12px;z-index:9100;font-weight:700;font-family:inherit'; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2800); }
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function open(o) {
    var old = document.querySelector('.aih-bg'); if (old) old.remove();
    var tasks = o.tasks || []; var cur = 0;
    var bg = document.createElement('div'); bg.className = 'aih-bg';
    bg.innerHTML = '<div class="aih" role="dialog" aria-modal="true" aria-labelledby="aihT">' +
      '<div class="hd"><span class="spark" aria-hidden="true">✦</span><h2 id="aihT">' + h(o.title || 'اقتراحات') + '</h2><button class="x" data-aih="close" aria-label="إغلاق">✕</button></div>' +
      '<span class="lbl">وش تحتاجين؟</span><div class="tasks" role="group">' + tasks.map(function (t, i) { return '<button type="button" data-aih-t="' + i + '" aria-pressed="' + (i === 0) + '">' + h(t[0]) + '</button>'; }).join('') + '</div>' +
      '<label class="lbl" for="aihX">سؤال أو تفصيل إضافي (اختياري)</label><input type="text" id="aihX" placeholder="مثال: الأم متعاونة لكن الطالبة ترفض تجي المدرسة">' +
      '<label class="chk"' + (o.name ? '' : ' hidden') + '><input type="checkbox" id="aihH" checked><span>إخفاء اسم الطالبة (يُكتب «الطالبة» بدله)</span></label>' +
      '<details><summary>النص (تقدرين تعدلينه)</summary><textarea id="aihP" aria-label="النص"></textarea></details>' +
      '<div class="acts"><button class="b p" data-aih="go">متابعة</button><button class="b s" data-aih="copy">نسخ النص</button></div>' +
      '<p class="note">تفتح صفحة جديدة، وإذا ما ظهر النص الصقيه (منسوخ تلقائياً). الاقتراحات للمساعدة، والقرار لحسّك المهني وللأنظمة المعتمدة.</p></div>';
    document.body.appendChild(bg); document.body.style.overflow = 'hidden';
    var P = bg.querySelector('#aihP'), X = bg.querySelector('#aihX'), H = bg.querySelector('#aihH'); var edited = false;
    function refresh() { if (!edited) P.value = build(o, tasks[cur] ? tasks[cur][1] : '', X.value.trim(), H.checked); }
    function close() { bg.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); window.removeEventListener('hashchange', close); }
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc); window.addEventListener('hashchange', close);
    P.addEventListener('input', function () { edited = true; });
    X.addEventListener('input', function () { edited = false; refresh(); });
    H.addEventListener('change', function () { edited = false; refresh(); });
    bg.addEventListener('click', function (e) {
      if (e.target === bg) { close(); return; }
      var t = e.target.closest('[data-aih-t]');
      if (t) { cur = +t.getAttribute('data-aih-t'); edited = false; bg.querySelectorAll('[data-aih-t]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); refresh(); return; }
      var a = e.target.closest('[data-aih]'); if (!a) return; var k = a.getAttribute('data-aih');
      if (k === 'close') close();
      else if (k === 'copy') copy(P.value).then(function (ok) { msg(ok ? 'نُسخ النص' : 'ما قدرت أنسخ، افتحي النص وانسخيه'); });
      else if (k === 'go') {
        var text = P.value; var url = 'https://claude.ai/new?q=' + encodeURIComponent(text);
        var u = url.length < 7000 ? url : 'https://claude.ai/new';
        copy(text).then(function () { msg(url.length < 7000 ? 'تم، والنص منسوخ احتياطاً' : 'النص طويل: نسخته لك، الصقيه في الصفحة'); });
        var w = window.open(u, '_blank'); if (w) { try { w.opener = null; } catch (er) {} } else location.href = u;
      }
    });
    refresh();
  }
  window.AIHelp = { open: open };
})();
