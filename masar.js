/* «مسار» — الاتصال بقاعدة البيانات (مشترك بين صفحة المعلمات وصفحة الموجهة) */
(function () {
  "use strict";
  const cfg = window.MASAR_CONFIG || {};
  const SB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

  function localCfg() {
    try { const c = JSON.parse(localStorage.getItem('masar.cfg') || 'null'); return c && c.url && c.key ? c : null; } catch (e) { return null; }
  }
  function conf() { return cfg.demo ? { demo: true } : (cfg.url && cfg.key ? cfg : localCfg()); }
  function loadSB() {
    if (window.supabase) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = SB_URL; s.onload = res; s.onerror = () => rej(new Error('Failed to fetch')); document.head.append(s); });
  }
  async function client(c) {
    c = c || conf();
    if (!c) return null;
    if (c.demo) return mock();
    await loadSB();
    return window.supabase.createClient(c.url, c.key);
  }

  /* ───────── نسخة المعاينة: قاعدة بيانات وهمية داخل المتصفح ───────── */
  const KEY = 'masar.demo.v4';
  function code() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (const b of crypto.getRandomValues(new Uint8Array(6))) s += a[b % a.length]; return s; }
  const iso = n => new Date(Date.now() - n * 864e5).toISOString();
  const day = n => iso(n).slice(0, 10);
  function seed() {
    const db = { settings: { school: 'ابتدائية الخنساء برغدان' }, teachers: [
      { id: 1, name: 'أ. هند (تجريبي)', pin: '1234' }, { id: 2, name: 'أ. منيرة (تجريبي)', pin: '5678' }, { id: 3, name: 'أ. سارة (تجريبي)', pin: '1111' }],
      referrals: [], docs: [], images: [], feedback: [], seq: 0, tseq: 3, fseq: 0 };
    const ref = (name, grade, sec, teacher, kinds, details, status, daysAgo, extra = {}) => {
      const r = { id: ++db.seq, code: code(), student_name: name, grade, section: sec, teacher_name: teacher, teacher_id: (db.teachers.find(t => t.name === teacher) || {}).id || null, kinds, details, urgent: false, status,
        public_note: null, case_id: null, created_at: iso(daysAgo), updated_at: iso(daysAgo),
        started_at: status !== 'new' ? iso(daysAgo - 1) : null, closed_at: status === 'closed' ? iso(Math.max(0, daysAgo - 14)) : null, ...extra };
      db.referrals.push(r); return r;
    };
    const kase = (r, cats, status, plan, follow) => {
      const id = 'c' + r.id + 'demo';
      r.case_id = id;
      db.docs.push({ id, data: { id, name: r.student_name, grade: r.grade, section: r.section, cats, status, priority: r.urgent ? 'high' : 'mid',
        date: r.created_at.slice(0, 10), source: 'ترشيح معلمة', desc: r.details + '\nالمعلمة المحيلة: ' + r.teacher_name,
        plan, follow, refId: r.id, refCode: r.code, createdAt: Date.parse(r.created_at), updatedAt: Date.parse(r.created_at) } });
    };
    ref('جود (تجريبي)', 'الثاني', 'أ', 'أ. هند (تجريبي)', ['fear'], 'تبكي عند دخول الفصل وترفض البقاء بعيدًا عن أختها منذ أسبوع.', 'new', 0, { urgent: true });
    ref('هيا (تجريبي)', 'الرابع', 'ب', 'أ. منيرة (تجريبي)', ['study'], 'درجاتها في الرياضيات منخفضة ولا تسلّم الواجبات.', 'new', 1);
    const a = ref('لمى (تجريبي)', 'الثالث', 'أ', 'أ. سارة (تجريبي)', ['withdrawn'], 'هادئة جدًا، لا تشارك وتجلس وحدها في الفسحة.', 'progress', 8,
      { public_note: 'بدأنا جلسات فردية معها، نرجو تشجيعها على المشاركة في مجموعة صغيرة.' });
    db.feedback.push({ id: ++db.fseq, referral_id: a.id, teacher_id: 3, prog: 'up', body: 'بدأت تجلس مع زميلة في الفسحة، وشاركت مرة في حصة القراءة.', seen: false, used: false, created_at: iso(1) });
    kase(a, ['psych'], 'active', [{ t: 'جلسات فردية لبناء الثقة والتعبير عن المشاعر', done: true, doneAt: day(6) }, { t: 'دمجها في مجموعة صغيرة أو نشاط تحبه', done: false }, { t: 'التواصل مع الأسرة لفهم الظروف', done: true, doneAt: day(3) }],
      [{ id: 'f1demo', date: day(6), type: 'جلسة فردية', prog: 'same', topic: 'بناء الثقة', goal: 'مساعدة الطالبة على التعبير عن مشاعرها', note: 'تحدثت عن حبها للرسم\nتفضّل اللعب مع زميلة واحدة', plan: 'جلسة متابعة الأسبوع القادم', photos: [] },
       { id: 'f2demo', date: day(3), type: 'اتصال بولي الأمر', prog: 'up', topic: '', goal: '', note: 'ذكرت الأم أنها تغيّرت بعد انتقالهم للحي الجديد', plan: '', photos: [] }]);
    const b = ref('رهف (تجريبي)', 'الخامس', 'ب', 'أ. هند (تجريبي)', ['study'], 'ضعف واضح في القراءة.', 'closed', 30,
      { public_note: 'تحسنت قراءتها بعد خطة التقوية، شكرًا لك.' });
    kase(b, ['delayed'], 'closed', [{ t: 'خطة علاجية مع معلمة المادة: حصص تقوية وأوراق عمل', done: true, doneAt: day(20) }], []);
    return db;
  }
  function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d) { if (d.settings && /الأمل/.test(d.settings.school || '')) { d.settings.school = 'ابتدائية الخنساء برغدان'; save(d); } return d; } } catch (e) {} const d = seed(); save(d); return d; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function touch(r) {
    r.updated_at = new Date().toISOString();
    if (r.status === 'progress' && !r.started_at) r.started_at = r.updated_at;
    if (r.status === 'closed') { r.closed_at = r.closed_at || r.updated_at; r.started_at = r.started_at || r.updated_at; } else r.closed_at = null;
    if (r.status === 'new') r.started_at = null;
  }
  const clone = v => JSON.parse(JSON.stringify(v));
  function mock() {
    const err = m => ({ data: null, error: { message: m } });
    const ok = d => ({ data: clone(d), error: null });
    const tOk = a => { const d = load(); const t = d.teachers.find(x => x.id == a.p_tid); return t && t.pin === a.p_pin ? t : null; };
    const rpcs = {
      masar_info: () => { const d = load(); return ok({ school: d.settings.school, teacher_ready: d.teachers.length > 0, has_admin: true }); },
      masar_teacher_names: () => ok(load().teachers.map(t => ({ id: t.id, name: t.name })).sort((x, y) => x.name.localeCompare(y.name))),
      masar_student_search: a => { if (!tOk(a)) return ok({ error: 'wrong' }); const nz = x => String(x || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
        const L = [['ريم أحمد سعيد', 'الرابع', 'أ'], ['ريماس خالد علي', 'الثاني', 'ب'], ['جود فهد علي', 'الثاني', 'ب'], ['جنى سعد محمد', 'الخامس', 'أ'], ['لمى عبدالله سالم', 'السادس', 'ب'], ['مريم ناصر حسن', 'الثالث', 'أ'], ['جوري ماجد فهد', 'الأول', 'ب']];
        const w = nz(a.p_q).trim().split(/\s+/); return ok({ ok: true, rows: L.filter(([n]) => w.every(x => nz(n).includes(x))).map(([name, grade, section]) => ({ name, grade, section })) }); },
      masar_teacher_login: a => { const t = tOk(a); return ok(t ? { ok: true, name: t.name } : { error: 'wrong' }); },
      masar_submit: a => {
        const t = tOk(a); if (!t) return ok({ error: 'wrong' });
        if (!a.p_name || a.p_name.trim().length < 2) return ok({ error: 'student_name_required' });
        if (!a.p_kinds || !a.p_kinds.length) return ok({ error: 'bad_kinds' });
        const d = load(); const r = { id: ++d.seq, code: code(), student_name: a.p_name.trim(), grade: a.p_grade, section: a.p_section, teacher_name: t.name, teacher_id: t.id, kinds: a.p_kinds, details: a.p_details, urgent: !!a.p_urgent, status: 'new', public_note: null, case_id: null, created_at: new Date().toISOString(), started_at: null, closed_at: null };
        touch(r); d.referrals.push(r); save(d); return ok({ ok: true, code: r.code });
      },
      masar_track: a => {
        const t = tOk(a); if (!t) return ok({ error: 'wrong' });
        return ok({ ok: true, rows: load().referrals.filter(r => r.teacher_id === t.id).sort((x, y) => y.created_at.localeCompare(x.created_at))
          .map(r => ({ code: r.code, student_name: r.student_name, kinds: r.kinds, status: r.status, public_note: r.public_note, created_at: r.created_at, started_at: r.started_at, closed_at: r.closed_at,
            feedback: load().feedback.filter(f => f.referral_id === r.id).map(f => ({ prog: f.prog, body: f.body, created_at: f.created_at })) })) });
      },
      masar_feedback_add: a => {
        const t = tOk(a); if (!t) return ok({ error: 'wrong' });
        if (!['up', 'same', 'down'].includes(a.p_prog)) return ok({ error: 'bad_prog' });
        const d = load(); const r = d.referrals.find(x => x.code === String(a.p_code).toUpperCase() && x.teacher_id === t.id && x.status !== 'closed');
        if (!r) return ok({ error: 'not_found' });
        d.feedback.push({ id: ++d.fseq, referral_id: r.id, teacher_id: t.id, prog: a.p_prog, body: (a.p_body || '').trim(), seen: false, used: false, created_at: new Date().toISOString() });
        save(d); return ok({ ok: true });
      },
      masar_claim: () => ok(true),
      masar_save_teacher: a => {
        if (a.p_pin != null && !/^[0-9]{4}$/.test(a.p_pin)) return err('pin_4_digits');
        const d = load();
        if (a.p_id == null) { if (d.teachers.some(t => t.name === a.p_name.trim())) return err('duplicate key masar_teachers_name_key'); const t = { id: ++d.tseq, name: a.p_name.trim(), pin: a.p_pin }; d.teachers.push(t); save(d); return ok(t.id); }
        const t = d.teachers.find(x => x.id == a.p_id); if (a.p_name) t.name = a.p_name.trim(); if (a.p_pin) t.pin = a.p_pin; save(d); return ok(t.id);
      }
    };
    const TABLES = { masar_referrals: 'referrals', masar_docs: 'docs', masar_images: 'images', masar_teachers: 'teachers', masar_feedback: 'feedback' };
    class Q {
      constructor(t) { this.t = t; this.op = 'select'; this.f = []; this.ord = []; this.one = false; this.maybe = false; this.row = null; }
      select() { return this; } insert(r) { this.op = 'insert'; this.row = r; return this; } upsert(r) { this.op = 'upsert'; this.row = r; return this; }
      update(p) { this.op = 'update'; this.row = p; return this; } delete() { this.op = 'delete'; return this; }
      eq(c, v) { this.f.push([c, v]); return this; } order(c, o) { this.ord.push([c, o && o.ascending === false ? -1 : 1]); return this; }
      limit() { return this; } single() { this.one = true; return this; } maybeSingle() { this.maybe = true; return this; }
      then(res, rej) { let out; try { out = this.run(); } catch (e) { out = err(e.message); } return Promise.resolve(out).then(res, rej); }
      run() {
        if (this.t === 'masar_admins') return ok([{ user_id: 'demo' }]);
        if (this.t === 'masar_settings') { const d = load(); if (this.op === 'update') { Object.assign(d.settings, this.row); save(d); return ok(null); } return ok(this.one ? { school: d.settings.school } : [{ school: d.settings.school }]); }
        const d = load(); const arr = d[TABLES[this.t]];
        const match = r => this.f.every(([c, v]) => r[c] == v);
        if (this.op === 'select') {
          let rows = arr.filter(match);
          for (const [c, dir] of this.ord.slice().reverse()) rows.sort((a, b) => String(a[c]).localeCompare(String(b[c])) * dir);
          if (this.one || this.maybe) return rows[0] ? ok(rows[0]) : (this.maybe ? ok(null) : err('not found'));
          return ok(rows);
        }
        if (this.op === 'upsert' || this.op === 'insert') {
          for (const r of [].concat(this.row)) { const i = arr.findIndex(x => x.id === r.id); if (i >= 0 && this.op === 'upsert') arr[i] = { ...arr[i], ...clone(r) }; else arr.push(clone(r)); }
          save(d); return ok(null);
        }
        if (this.op === 'update') {
          const hit = arr.filter(match); hit.forEach(r => { Object.assign(r, clone(this.row)); if (this.t === 'masar_referrals') touch(r); }); save(d);
          return this.one ? ok(hit[0] || null) : ok(hit);
        }
        if (this.op === 'delete') { d[TABLES[this.t]] = arr.filter(r => !match(r)); save(d); return ok(null); }
      }
    }
    return {
      demo: true,
      rpc: (n, a) => Promise.resolve(rpcs[n] ? rpcs[n](a || {}) : err('unknown rpc')),
      from: t => new Q(t),
      auth: {
        getSession: async () => ({ data: { session: { demo: true } } }),
        signInWithPassword: async () => ({ data: { session: {} }, error: null }),
        signUp: async () => ({ data: { session: {} }, error: null }),
        signOut: async () => ({ error: null })
      },
      resetDemo: () => { try { localStorage.removeItem(KEY); } catch (e) {} }
    };
  }

  window.Masar = { conf, client, localCfg, loadSB, demo: !!cfg.demo };
})();
