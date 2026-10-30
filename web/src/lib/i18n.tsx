"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Lightweight translations: English, Spanish, Arabic (right-to-left) and
// Mandarin (Traditional characters). Missing keys fall back to English.

export type Lang = "en" | "es" | "ar" | "zh";
export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "es", label: "Español", short: "ES" },
  { id: "ar", label: "العربية", short: "ع" },
  { id: "zh", label: "繁體中文", short: "中" },
];
const KEY = "skintwin:lang";

const en = {
  "nav.home": "Home",
  "nav.twins": "Twins",
  "nav.circles": "Circles",
  "nav.products": "Products",
  "nav.plan": "Plan",
  "nav.skin": "My skin",
  "nav.checkin": "Check-in",
  "nav.startScan": "Start scan",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.language": "Language",

  "hero.eyebrow": "Powered by YouCam AI Skin Analysis",
  "hero.title": "Stop guessing. See what worked on skin like yours.",
  "hero.mark": "worked",
  "hero.sub": "Scan your face in 10 seconds. Meet people whose skin measures like yours, and see which products cleared, calmed or broke them out. Measured by their own before-and-after scans, not star ratings.",
  "hero.cta": "Scan my skin · 10 sec",
  "hero.sample": "Try a sample face",
  "hero.free": "Free · no sign-up · your photos stay private",
  "pain.title": "Bought it for the five stars, then it broke you out?",
  "pain.mark": "broke",
  "pain.sub": "Star ratings come from strangers with completely different skin. SkinTwin shows you results from people whose skin measures like yours.",
  "p1.t": "No more shelf of regrets",
  "p1.d": "See what worked, and what backfired, for skin like yours before you spend a penny.",
  "p2.t": "Proof, not promises",
  "p2.d": "Every result comes from two face scans weeks apart. Nobody can type a fake review.",
  "p3.t": "No sponsored picks",
  "p3.d": "We don't sell anything, and brands can't pay to rank higher. Only results decide.",
  step: "Step {n}",
  q1: "What's my skin like?",
  a1: "Eight scores from one selfie, mapped onto your face.",
  q2: "Who has skin like mine?",
  a2: "Your skin twins: people whose 8 scores sit close to yours.",
  q3: "What worked for them?",
  a3: "Results come from their scans, not star ratings. Same product, different skin, different result.",
  q4: "Is it working for me?",
  a4: "Check in once a week. Your own scans show what's changing.",
  "close.title": "Your skin twins already tried it.",
  "close.sub": "Before you buy your next product, see how it went for people with skin like yours.",
  "close.cta": "See what works for me",
  "close.t1": "Free, no sign-up",
  "close.t2": "No sponsored picks",
  "close.t3": "Your photos stay private",

  "scan.eyebrow": "Your skin scan",
  "scan.title": "Let's measure your skin",
  "scan.mark": "skin",
  "scan.sub": "One clear selfie is all it takes. YouCam AI scores 8 concerns so we can find people whose skin measures like yours.",
  "scan.cam": "Use my camera",
  "scan.camOn": "Camera is on",
  "scan.camSub": "Best results · we check your light · 10 seconds",
  "scan.upload": "Upload a photo",
  "scan.uploadSub": "A clear, front-facing selfie (JPG or PNG)",
  "scan.sample": "Try a sample face",
  "scan.sampleSub": "No camera? Scan {name} instead",
  "scan.tips": "For the best scan",
  "scan.tapCam": "Tap to turn on camera",
  "scan.preview": "Your preview appears here",

  "today.title": "Your skin today",
  "today.mark": "today",
  "today.hi": "Hi {name}",
  "today.mySkin": "My skin",
  "today.open": "Open my skin",
  "today.checkin": "Weekly check-in",
  "today.due": "Due today",
  "today.next": "Next: {date}",
  "today.checkNow": "Check in now",
  "today.checkEarly": "Check in early",
  "today.seeWeek": "See this week",
  "today.people": "People like you",
  "today.twinsSub": "skin twins. See what worked for them",
  "today.openTwins": "Open twins",
  "today.routine": "Today's routine",
  "today.habits": "Today's habits",
  "today.working": "What's working for you",
  "today.tip": "Skin tip of the day",
  "today.fromTwins": "New from your twins",

  "tour.of": "{n} of {total}",
  "tour.skip": "Skip tour",
  "tour.next": "Next",
  "tour.done": "Got it",
  "tour.skin.t": "Your skin, always here",
  "tour.skin.d": "Your skin map and 8 scores live in My skin, with your progress and goal.",
  "tour.twins.t": "People with your skin",
  "tour.twins.d": "Your skin twins: people whose scores sit close to yours. Their results are measured by scans, not typed.",
  "tour.products.t": "What works for you",
  "tour.products.d": "Every product says how it went for twins like you. Green worked, orange was risky.",
  "tour.plan.t": "Your routine",
  "tour.plan.d": "A morning and evening plan built from what worked, with strong products spaced so they never clash.",
  "tour.checkin.t": "Check in weekly",
  "tour.checkin.d": "One selfie a week shows what's changing, and which products are actually working.",

  "v.good": "Good match for you",
  "v.mixed": "Mixed for skin like yours",
  "v.risky": "Risky for your skin",
  "v.few": "Few twins have tried this",
  "v.noscan": "Will it suit you?",
};
export type TKey = keyof typeof en;

const es: Partial<Record<TKey, string>> = {
  "nav.home": "Inicio", "nav.twins": "Gemelos", "nav.circles": "Círculos", "nav.products": "Productos", "nav.plan": "Plan", "nav.skin": "Mi piel", "nav.checkin": "Revisión", "nav.startScan": "Escanear", "nav.login": "Entrar", "nav.signup": "Registrarse", "nav.language": "Idioma",
  "hero.eyebrow": "Con el análisis de piel YouCam AI",
  "hero.title": "Deja de adivinar. Mira lo que funcionó en piel como la tuya.",
  "hero.mark": "funcionó",
  "hero.sub": "Escanea tu rostro en 10 segundos. Conoce a personas cuya piel mide como la tuya y descubre qué productos las mejoraron, calmaron o les causaron brotes. Medido con sus propios escaneos de antes y después, no con estrellas.",
  "hero.cta": "Escanear mi piel · 10 s", "hero.sample": "Probar un rostro de ejemplo", "hero.free": "Gratis · sin registro · tus fotos son privadas",
  "pain.title": "¿Lo compraste por las cinco estrellas y te salieron granos?", "pain.mark": "granos?",
  "pain.sub": "Las estrellas vienen de desconocidos con una piel totalmente distinta. SkinTwin te muestra resultados de personas cuya piel mide como la tuya.",
  "p1.t": "Se acabó el estante de arrepentimientos", "p1.d": "Mira qué funcionó, y qué salió mal, en piel como la tuya antes de gastar un céntimo.",
  "p2.t": "Pruebas, no promesas", "p2.d": "Cada resultado viene de dos escaneos con semanas de diferencia. Nadie puede escribir una reseña falsa.",
  "p3.t": "Sin recomendaciones pagadas", "p3.d": "No vendemos nada y las marcas no pueden pagar para subir. Solo deciden los resultados.",
  step: "Paso {n}", q1: "¿Cómo es mi piel?", a1: "Ocho puntuaciones de un selfie, sobre tu rostro.", q2: "¿Quién tiene una piel como la mía?", a2: "Tus gemelos de piel: personas cuyas 8 puntuaciones se parecen a las tuyas.", q3: "¿Qué les funcionó?", a3: "Los resultados salen de sus escaneos, no de estrellas. Mismo producto, otra piel, otro resultado.", q4: "¿Me está funcionando?", a4: "Haz una revisión semanal. Tus propios escaneos muestran qué cambia.",
  "close.title": "Tus gemelos de piel ya lo probaron.", "close.sub": "Antes de comprar tu próximo producto, mira cómo les fue a personas con tu piel.", "close.cta": "Ver qué me funciona", "close.t1": "Gratis, sin registro", "close.t2": "Sin recomendaciones pagadas", "close.t3": "Tus fotos son privadas",
  "scan.eyebrow": "Tu escaneo", "scan.title": "Midamos tu piel", "scan.mark": "piel", "scan.sub": "Solo necesitas un selfie claro. YouCam AI puntúa 8 aspectos para encontrar personas cuya piel mide como la tuya.",
  "scan.cam": "Usar mi cámara", "scan.camOn": "Cámara encendida", "scan.camSub": "Mejores resultados · revisamos tu luz · 10 segundos", "scan.upload": "Subir una foto", "scan.uploadSub": "Un selfie claro y de frente (JPG o PNG)", "scan.sample": "Probar un rostro de ejemplo", "scan.sampleSub": "¿Sin cámara? Escanea a {name}", "scan.tips": "Para un mejor escaneo", "scan.tapCam": "Toca para encender la cámara", "scan.preview": "Aquí verás tu vista previa",
  "today.title": "Tu piel hoy", "today.mark": "hoy", "today.hi": "Hola, {name}", "today.mySkin": "Mi piel", "today.open": "Abrir mi piel", "today.checkin": "Revisión semanal", "today.due": "Hoy toca", "today.next": "Próxima: {date}", "today.checkNow": "Revisar ahora", "today.checkEarly": "Revisar antes", "today.seeWeek": "Ver esta semana", "today.people": "Personas como tú", "today.twinsSub": "gemelos de piel. Mira qué les funcionó", "today.openTwins": "Ver gemelos", "today.routine": "Rutina de hoy", "today.habits": "Hábitos de hoy", "today.working": "Lo que te funciona", "today.tip": "Consejo del día", "today.fromTwins": "Novedades de tus gemelos",
  "tour.of": "{n} de {total}", "tour.skip": "Saltar", "tour.next": "Siguiente", "tour.done": "Entendido",
  "tour.skin.t": "Tu piel, siempre aquí", "tour.skin.d": "Tu mapa de piel y tus 8 puntuaciones viven en Mi piel, con tu progreso y tu meta.",
  "tour.twins.t": "Personas con tu piel", "tour.twins.d": "Tus gemelos de piel: personas con puntuaciones cercanas a las tuyas. Sus resultados se miden con escaneos.",
  "tour.products.t": "Lo que te funciona", "tour.products.d": "Cada producto dice cómo les fue a gemelos como tú. Verde funcionó, naranja fue arriesgado.",
  "tour.plan.t": "Tu rutina", "tour.plan.d": "Un plan de mañana y noche basado en lo que funcionó, sin mezclar activos fuertes.",
  "tour.checkin.t": "Revisión semanal", "tour.checkin.d": "Un selfie a la semana muestra qué cambia y qué productos funcionan de verdad.",
  "v.good": "Buena opción para ti", "v.mixed": "Resultados mixtos para tu piel", "v.risky": "Arriesgado para tu piel", "v.few": "Pocos gemelos lo han probado", "v.noscan": "¿Te irá bien?",
};

const ar: Partial<Record<TKey, string>> = {
  "nav.home": "الرئيسية", "nav.twins": "التوائم", "nav.circles": "الدوائر", "nav.products": "المنتجات", "nav.plan": "الخطة", "nav.skin": "بشرتي", "nav.checkin": "الفحص", "nav.startScan": "ابدأ الفحص", "nav.login": "تسجيل الدخول", "nav.signup": "إنشاء حساب", "nav.language": "اللغة",
  "hero.eyebrow": "بتقنية تحليل البشرة من YouCam AI",
  "hero.title": "توقّفي عن التخمين. شاهدي ما نجح مع بشرة مثل بشرتك.",
  "hero.mark": "نجح",
  "hero.sub": "افحصي وجهك في 10 ثوانٍ. تعرّفي على أشخاص تشبه قياسات بشرتهم بشرتك، واكتشفي أي المنتجات صفّت بشرتهم أو هدّأتها أو سبّبت لها الحبوب. النتائج من فحوصاتهم قبل وبعد، لا من النجوم.",
  "hero.cta": "افحصي بشرتي · 10 ثوانٍ", "hero.sample": "جرّبي وجهًا نموذجيًا", "hero.free": "مجاني · بدون تسجيل · صورك خاصة",
  "pain.title": "اشتريتِه لأنه بخمس نجوم، ثم ظهرت الحبوب؟", "pain.mark": "الحبوب؟",
  "pain.sub": "التقييمات تأتي من غرباء ببشرة مختلفة تمامًا. يعرض لك SkinTwin نتائج أشخاص تشبه قياسات بشرتهم بشرتك.",
  "p1.t": "وداعًا لرفّ المنتجات المندم عليها", "p1.d": "اعرفي ما نجح وما فشل مع بشرة مثل بشرتك قبل أن تدفعي أي شيء.",
  "p2.t": "دليل، لا وعود", "p2.d": "كل نتيجة تأتي من فحصين للوجه تفصل بينهما أسابيع. لا أحد يستطيع كتابة مراجعة مزيفة.",
  "p3.t": "بلا توصيات مدفوعة", "p3.d": "نحن لا نبيع شيئًا، ولا تستطيع العلامات التجارية الدفع لترتيب أعلى. النتائج وحدها تقرّر.",
  step: "الخطوة {n}", q1: "كيف هي بشرتي؟", a1: "ثماني نتائج من صورة سيلفي واحدة، على خريطة وجهك.", q2: "من لديه بشرة مثل بشرتي؟", a2: "توائم بشرتك: أشخاص نتائجهم الثماني قريبة من نتائجك.", q3: "ما الذي نجح معهم؟", a3: "النتائج من فحوصاتهم، لا من النجوم. المنتج نفسه، بشرة مختلفة، نتيجة مختلفة.", q4: "هل ينجح معي؟", a4: "افحصي مرة كل أسبوع. فحوصاتك تُظهر ما يتغيّر.",
  "close.title": "توائم بشرتك جرّبوه بالفعل.", "close.sub": "قبل شراء منتجك التالي، شاهدي كيف كانت النتيجة مع أشخاص ببشرة مثل بشرتك.", "close.cta": "اعرضي ما يناسبني", "close.t1": "مجاني وبدون تسجيل", "close.t2": "بلا توصيات مدفوعة", "close.t3": "صورك تبقى خاصة",
  "scan.eyebrow": "فحص بشرتك", "scan.title": "لنقِس بشرتك", "scan.mark": "بشرتك", "scan.sub": "كل ما تحتاجينه صورة سيلفي واضحة. يقيّم YouCam AI ثمانية جوانب لنجد أشخاصًا ببشرة مثل بشرتك.",
  "scan.cam": "استخدمي الكاميرا", "scan.camOn": "الكاميرا تعمل", "scan.camSub": "أفضل نتيجة · نتحقق من الإضاءة · 10 ثوانٍ", "scan.upload": "ارفعي صورة", "scan.uploadSub": "صورة سيلفي واضحة من الأمام (JPG أو PNG)", "scan.sample": "جرّبي وجهًا نموذجيًا", "scan.sampleSub": "بدون كاميرا؟ افحصي {name} بدلًا من ذلك", "scan.tips": "لأفضل فحص", "scan.tapCam": "اضغطي لتشغيل الكاميرا", "scan.preview": "ستظهر المعاينة هنا",
  "today.title": "بشرتك اليوم", "today.mark": "اليوم", "today.hi": "مرحبًا {name}", "today.mySkin": "بشرتي", "today.open": "افتحي بشرتي", "today.checkin": "الفحص الأسبوعي", "today.due": "موعده اليوم", "today.next": "التالي: {date}", "today.checkNow": "افحصي الآن", "today.checkEarly": "افحصي مبكرًا", "today.seeWeek": "شاهدي هذا الأسبوع", "today.people": "أشخاص مثلك", "today.twinsSub": "توأم بشرة. شاهدي ما نجح معهم", "today.openTwins": "افتحي التوائم", "today.routine": "روتين اليوم", "today.habits": "عادات اليوم", "today.working": "ما ينجح معك", "today.tip": "نصيحة اليوم", "today.fromTwins": "جديد من توائمك",
  "tour.of": "{n} من {total}", "tour.skip": "تخطّي", "tour.next": "التالي", "tour.done": "فهمت",
  "tour.skin.t": "بشرتك، دائمًا هنا", "tour.skin.d": "خريطة بشرتك ونتائجك الثماني في «بشرتي»، مع تقدّمك وهدفك.",
  "tour.twins.t": "أشخاص ببشرتك", "tour.twins.d": "توائم بشرتك: أشخاص نتائجهم قريبة من نتائجك، ونتائجهم مقاسة بالفحص.",
  "tour.products.t": "ما يناسبك", "tour.products.d": "كل منتج يوضّح نتيجته مع توائم مثلك. الأخضر نجح، والبرتقالي كان محفوفًا بالمخاطر.",
  "tour.plan.t": "روتينك", "tour.plan.d": "خطة صباحية ومسائية مبنية على ما نجح، مع فصل المكونات القوية حتى لا تتعارض.",
  "tour.checkin.t": "افحصي أسبوعيًا", "tour.checkin.d": "صورة واحدة في الأسبوع تُظهر ما يتغيّر وأي المنتجات تنجح فعلًا.",
  "v.good": "مناسب لك", "v.mixed": "نتائج متفاوتة لبشرتك", "v.risky": "محفوف بالمخاطر لبشرتك", "v.few": "قلّة من التوائم جرّبوه", "v.noscan": "هل سيناسبك؟",
};

const zh: Partial<Record<TKey, string>> = {
  "nav.home": "首頁", "nav.twins": "膚質雙胞胎", "nav.circles": "圈子", "nav.products": "產品", "nav.plan": "計畫", "nav.skin": "我的肌膚", "nav.checkin": "每週檢測", "nav.startScan": "開始檢測", "nav.login": "登入", "nav.signup": "註冊", "nav.language": "語言",
  "hero.eyebrow": "由 YouCam AI 肌膚分析提供",
  "hero.title": "別再猜了。看看什麼對和你一樣的肌膚有效。",
  "hero.mark": "有效。",
  "hero.sub": "10 秒掃描你的臉。認識肌膚數據和你相近的人，看看哪些產品讓他們變清透、變穩定，或讓他們冒痘。結果來自他們自己的前後掃描，而不是星級評分。",
  "hero.cta": "檢測我的肌膚 · 10 秒", "hero.sample": "試試示範臉孔", "hero.free": "免費 · 無需註冊 · 照片保持私密",
  "pain.title": "因為五顆星買下，結果卻冒痘？", "pain.mark": "冒痘？",
  "pain.sub": "星級評分來自膚質完全不同的陌生人。SkinTwin 讓你看到肌膚數據和你相近的人的結果。",
  "p1.t": "不再囤積後悔的產品", "p1.d": "花錢之前，先看看什麼對和你一樣的肌膚有效、什麼適得其反。",
  "p2.t": "證據，而非承諾", "p2.d": "每個結果都來自相隔數週的兩次臉部掃描。沒有人能寫假評論。",
  "p3.t": "沒有付費推薦", "p3.d": "我們不賣任何東西，品牌也不能付費提升排名。只有結果說了算。",
  step: "第 {n} 步", q1: "我的肌膚狀況如何？", a1: "一張自拍得到八項分數，標示在你的臉上。", q2: "誰的肌膚和我一樣？", a2: "你的膚質雙胞胎：八項分數和你相近的人。", q3: "什麼對他們有效？", a3: "結果來自他們的掃描，而不是星級。同樣的產品，不同的肌膚，不同的結果。", q4: "對我有效嗎？", a4: "每週檢測一次。你自己的掃描會顯示變化。",
  "close.title": "你的膚質雙胞胎已經試過了。", "close.sub": "買下一個產品之前，先看看和你肌膚相似的人用得如何。", "close.cta": "看看什麼適合我", "close.t1": "免費，無需註冊", "close.t2": "沒有付費推薦", "close.t3": "照片保持私密",
  "scan.eyebrow": "你的肌膚檢測", "scan.title": "一起來測量你的肌膚", "scan.mark": "肌膚", "scan.sub": "只需要一張清楚的自拍。YouCam AI 會評估八項指標，幫你找到肌膚數據相近的人。",
  "scan.cam": "使用相機", "scan.camOn": "相機已開啟", "scan.camSub": "效果最好 · 我們會檢查光線 · 10 秒", "scan.upload": "上傳照片", "scan.uploadSub": "一張清楚的正面自拍（JPG 或 PNG）", "scan.sample": "試試示範臉孔", "scan.sampleSub": "沒有相機？改為檢測 {name}", "scan.tips": "讓檢測更準確", "scan.tapCam": "點一下開啟相機", "scan.preview": "預覽會顯示在這裡",
  "today.title": "今天的肌膚", "today.mark": "今天的肌膚", "today.hi": "嗨，{name}", "today.mySkin": "我的肌膚", "today.open": "查看我的肌膚", "today.checkin": "每週檢測", "today.due": "今天該檢測了", "today.next": "下次：{date}", "today.checkNow": "立即檢測", "today.checkEarly": "提前檢測", "today.seeWeek": "查看本週", "today.people": "和你相似的人", "today.twinsSub": "位膚質雙胞胎。看看什麼對他們有效", "today.openTwins": "查看雙胞胎", "today.routine": "今天的保養", "today.habits": "今天的好習慣", "today.working": "對你有效的產品", "today.tip": "今日護膚小提示", "today.fromTwins": "雙胞胎的最新分享",
  "tour.of": "{n} / {total}", "tour.skip": "略過導覽", "tour.next": "下一步", "tour.done": "知道了",
  "tour.skin.t": "你的肌膚，隨時在這裡", "tour.skin.d": "肌膚地圖和八項分數都在「我的肌膚」，還有你的進度與目標。",
  "tour.twins.t": "和你肌膚相似的人", "tour.twins.d": "你的膚質雙胞胎：分數和你相近的人。他們的結果由掃描測量，不是手打的。",
  "tour.products.t": "什麼適合你", "tour.products.d": "每個產品都會顯示它在相似膚質者身上的效果。綠色代表有效，橘色代表有風險。",
  "tour.plan.t": "你的保養計畫", "tour.plan.d": "依據有效結果建立的早晚保養，強效成分會錯開使用，避免衝突。",
  "tour.checkin.t": "每週檢測", "tour.checkin.d": "每週一張自拍，就能看到變化，以及哪些產品真正有效。",
  "v.good": "很適合你", "v.mixed": "對你的膚質效果不一", "v.risky": "對你的肌膚有風險", "v.few": "試過的雙胞胎還不多", "v.noscan": "適合你嗎？",
};

const DICTS: Record<Lang, Partial<Record<TKey, string>>> = { en, es, ar, zh };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey, vars?: Record<string, string | number>) => string } | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Lang | null;
      if (saved && saved in DICTS) setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);
  const t = useCallback(
    (k: TKey, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][k] ?? en[k];
      for (const [v, val] of Object.entries(vars ?? {})) s = s.replace(`{${v}}`, String(val));
      return s;
    },
    [lang],
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT outside I18nProvider");
  return ctx;
}
