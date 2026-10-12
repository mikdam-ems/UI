/* Sotto — English / Arabic copy. Elements opt in with data-i18n="key" (text) or data-i18n-aria="key". */
(function () {
  const S = (window.Sotto = window.Sotto || {});
  const D = {
    en: {
      'nav.umbrellas': 'Umbrellas', 'nav.opens': 'How it opens', 'nav.bench': 'The bench', 'nav.visit': 'Visit',
      'nav.sound': 'Rain sound', 'nav.lang': 'عربي', 'nav.langAria': 'اقرأ بالعربية',
      'hero.title': 'It’s raining<br>on your screen.', 'hero.sub': 'Scroll, or pull the umbrella open.',
      'hero.hint': 'Move to wipe the glass · drag up to open',
      'c1.title': 'Eight ribs. One breath.', 'c1.sub': 'Ash and steel unfold in a single motion. Then the rain is someone else’s problem.',
      'c2.eyebrow': 'Ombrellai · since 1921', 'c2.sub': 'Step out of the rain.',
      'c4.title': 'Come in. Dry off.<br>Choose yours.', 'c4.cta': 'See the umbrellas',
      'dots.rain': 'The rain', 'dots.open': 'How it opens', 'dots.sign': 'Sotto', 'dots.inside': 'Inside',
      'shop.eyebrow': 'The rail', 'shop.title': 'The umbrellas',
      'shop.sub': 'Made on the bench behind the counter. Hover to lift one off the rail, open it, then drop it in your stand.',
      'card.ribs': '{n} ribs', 'card.open': 'Open it', 'card.close': 'Close it', 'card.add': 'Put it in your stand',
      'stand.title': 'Your stand', 'stand.aria': 'Your stand, {n} umbrellas', 'stand.empty': 'Your stand is empty. Drop an umbrella in.',
      'stand.remove': 'Take out', 'stand.subtotal': 'Subtotal', 'stand.checkout': 'Checkout', 'stand.close': 'Close',
      'stand.demo': 'Demo shop — nothing is charged.',
      'toast.added': '{name} is in your stand',
      'bench.eyebrow': 'The bench', 'bench.title': 'Seventy-four steps, one pair of hands.',
      'bench.sub': 'Every Sotto is built start to finish by one maker, who signs the inside of the runner.',
      'bench.s1': 'Ribs', 'bench.s1d': 'Steel ribs, filed and tipped with brass so they never snag the cloth.',
      'bench.s2': 'Canopy', 'bench.s2d': 'Waxed cotton cut in panels, sewn tight, then stretched for a night.',
      'bench.s3': 'Handle', 'bench.s3d': 'Chestnut, malacca or ash, steamed and bent by hand into a crook.',
      'bench.k1': 'founded', 'bench.k2': 'hours per umbrella', 'bench.k3': 'lifetime re-cover',
      'visit.title': 'Visit the shop', 'visit.addr': 'Under the portico, 12 Via dei Mercanti', 'visit.hours': 'Tue–Sat · 10:00–19:00 · open late when it rains',
      'visit.note': 'Sotto is a fictional brand made for the EMS showcase.',
      'p.notte': 'Notte', 'p.notte.d': 'Midnight navy, twelve steel ribs, a chestnut crook cut from one piece.',
      'p.bottiglia': 'Bottiglia', 'p.bottiglia.d': 'Bottle green, eight ribs, a light malacca handle with its knuckles left on.',
      'p.rubino': 'Rubino', 'p.rubino.d': 'Ruby red, eight ribs, horn-tipped crook. The one you came in with.',
      'p.nebbia': 'Nebbia', 'p.nebbia.d': 'Fog grey, ten ribs, a straight ash shaft finished with a brass knob.',
      'p.ocra': 'Ocra', 'p.ocra.d': 'Warm ochre, eight ribs, a dark walnut crook for grey mornings.',
      'p.prugna': 'Prugna', 'p.prugna.d': 'Deep plum, twelve ribs, an ebony crook polished to a mirror.',
    },
    ar: {
      'nav.umbrellas': 'المظلات', 'nav.opens': 'كيف تُفتح', 'nav.bench': 'طاولة الحِرفي', 'nav.visit': 'زورونا',
      'nav.sound': 'صوت المطر', 'nav.lang': 'EN', 'nav.langAria': 'Read in English',
      'hero.title': 'إنها تمطر<br>على شاشتك.', 'hero.sub': 'مرّر للأسفل، أو اسحب المظلة لتفتحها.',
      'hero.hint': 'حرّك المؤشر لتمسح الزجاج · اسحب للأعلى لتفتحها',
      'c1.title': 'ثمانية أضلاع. نَفَسٌ واحد.', 'c1.sub': 'خشب الدردار والفولاذ ينفتحان في حركة واحدة، ويصبح المطر شأن غيرك.',
      'c2.eyebrow': 'صُنّاع مظلات · منذ ١٩٢١', 'c2.sub': 'اخرج من المطر.',
      'c4.title': 'تفضّل بالدخول.<br>واختر مظلتك.', 'c4.cta': 'تصفّح المظلات',
      'dots.rain': 'المطر', 'dots.open': 'كيف تُفتح', 'dots.sign': 'سوتّو', 'dots.inside': 'في الداخل',
      'shop.eyebrow': 'الرف', 'shop.title': 'المظلات',
      'shop.sub': 'تُصنع على الطاولة خلف المنضدة. مرّر المؤشر لترفع واحدة عن الرف، افتحها، ثم ضعها في حاملك.',
      'card.ribs': '{n} أضلاع', 'card.open': 'افتحها', 'card.close': 'أغلقها', 'card.add': 'ضعها في حاملك',
      'stand.title': 'حاملك', 'stand.aria': 'حاملك، {n} مظلات', 'stand.empty': 'حاملك فارغ. ضع مظلة فيه.',
      'stand.remove': 'أخرِجها', 'stand.subtotal': 'المجموع', 'stand.checkout': 'إتمام الشراء', 'stand.close': 'إغلاق',
      'stand.demo': 'متجر تجريبي — لن يتم أي دفع.',
      'toast.added': '{name} الآن في حاملك',
      'bench.eyebrow': 'طاولة الحِرفي', 'bench.title': 'أربع وسبعون خطوة، ويدان فقط.',
      'bench.sub': 'كل مظلة من سوتّو يصنعها حِرفي واحد من البداية إلى النهاية، ويوقّع داخل المنزلق.',
      'bench.s1': 'الأضلاع', 'bench.s1d': 'أضلاع فولاذية مصقولة بأطراف نحاسية كي لا تعلق بالقماش.',
      'bench.s2': 'المظلة', 'bench.s2d': 'قطن مشمّع يُقصّ ألواحاً ويُخاط بإحكام ثم يُشدّ ليلة كاملة.',
      'bench.s3': 'المقبض', 'bench.s3d': 'كستناء أو خيزران أو دردار، يُبخّر ويُثنى باليد.',
      'bench.k1': 'سنة التأسيس', 'bench.k2': 'ساعة لكل مظلة', 'bench.k3': 'إعادة تغليف مدى الحياة',
      'visit.title': 'زوروا المتجر', 'visit.addr': 'تحت الرواق، ١٢ شارع التجّار', 'visit.hours': 'الثلاثاء–السبت · ١٠:٠٠–١٩:٠٠ · نتأخر في الإغلاق حين تمطر',
      'visit.note': 'سوتّو علامة تجارية خيالية صُممت لمعرض EMS.',
      'p.notte': 'نوتّي', 'p.notte.d': 'كحلي منتصف الليل، اثنا عشر ضلعاً فولاذياً، ومقبض كستناء من قطعة واحدة.',
      'p.bottiglia': 'بوتيليا', 'p.bottiglia.d': 'أخضر زجاجي، ثمانية أضلاع، ومقبض خيزران فاتح بعُقده الطبيعية.',
      'p.rubino': 'روبينو', 'p.rubino.d': 'أحمر ياقوتي، ثمانية أضلاع، ومقبض بأطراف من القرن. التي دخلت بها.',
      'p.nebbia': 'نيبّيا', 'p.nebbia.d': 'رمادي الضباب، عشرة أضلاع، وعصا دردار مستقيمة بمقبض نحاسي.',
      'p.ocra': 'أوكرا', 'p.ocra.d': 'مُغرة دافئة، ثمانية أضلاع، ومقبض جوز داكن للصباحات الرمادية.',
      'p.prugna': 'بروغنا', 'p.prugna.d': 'برقوقي عميق، اثنا عشر ضلعاً، ومقبض أبنوس مصقول كالمرآة.',
    },
  };
  S.lang = 'en';
  S.t = (k, vars) => {
    let s = (D[S.lang] && D[S.lang][k]) || D.en[k] || k;
    if (vars) Object.keys(vars).forEach(v => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  };
  const listeners = [];
  S.onLang = fn => listeners.push(fn);
  S.applyLang = function () {
    const html = document.documentElement;
    html.lang = S.lang; html.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = S.t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', S.t(el.dataset.i18nAria)));
    listeners.forEach(fn => fn());
  };
  S.setLang = function (l) {
    S.lang = l;
    try { localStorage.setItem('sotto-lang', l); } catch (e) { /* storage unavailable */ }
    S.applyLang();
  };
  try { const saved = localStorage.getItem('sotto-lang'); if (saved === 'ar' || saved === 'en') S.lang = saved; } catch (e) { /* ignore */ }
})();
