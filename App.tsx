
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  LayoutDashboard, 
  Layers, 
  User as UserIcon, 
  Mic, 
  MessageSquare, 
  LogOut,
  Loader2,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Brain,
  Moon,
  Sun,
  Languages,
  Home,
  Globe
} from 'lucide-react';

import { Language, AppState, AppView, MnemonicResponse, SavedMnemonic } from './types';
import { GeminiService } from './services/geminiService';
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';

// Components
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { MnemonicCard } from './components/MnemonicCard';
import { VoiceMode } from './components/VoiceMode';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import AboutSection from './components/AboutSection';
import { SearchPage } from './components/SearchPage';
import { FeedbackModal } from './components/FeedbackModel';

const TRANSLATIONS: Record<Language, any> = {
  [Language.UZBEK]: {
    heroTitle: "Xorijiy so'zlarni bir zumda eslab qoling",
    heroSubtitle: "Mnemonika va sun'iy intellekt yordamida so'z boyligingizni 10 barobar tezroq oshiring.",
    searchPlaceholder: "Inglizcha so'zni kiriting...",
    btnSearch: "O'rganish",
    btnVoice: "Live Rejim",
    btnStartSearch: "Qidiruvni boshlash",
    navHome: "Asosiy",
    navSearch: "Qidiruv",
    navDash: "Statistika",
    navFlash: "Kartalar",
    navProfile: "Profil",
    howItWorksTitle: "Bu qanday ishlaydi?",
    howItWorksStep1: "So'zni qidiring",
    howItWorksStep1Desc: "O'rganmoqchi bo'lgan inglizcha so'zingizni kiriting.",
    howItWorksStep2: "Mnemonika oling",
    howItWorksStep2Desc: "AI sizga tushunarli assotsiatsiya va rasm yaratib beradi.",
    howItWorksStep3: "Xotiraga muhrlang",
    howItWorksStep3Desc: "Tasavvur qiling va so'zni bir umrga eslab qoling.",
    howItWorksMethodTitle: "Keyword Method",
    howItWorksMethodDesc: "Stanford universiteti olimlari tomonidan ishlab chiqilgan ushbu metod xotirani 3 barobar kuchaytirishi isbotlangan.",
    errorTitle: "Xatolik yuz berdi",
    errorQuota: "Limit tugadi. Iltimos, biroz kuting.",
    errorGeneral: "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.",
    loadingMnemonic: "Mnemonika yaratilmoqda...",
    loadingImage: "Tasvir chizilmoqda...",
    saveSuccess: "So'z saqlandi!",
    feedback: "Keri baylanis",
    allWords: "Barcha so'zlar",
    retry: "Qayta urinish",
    startLearning: "Yangi so'z o'rganishni boshlang",
    loadingStory: "Usta siz uchun eng qiziqarli hikoyani o'ylamoqda...",
    checkingSpelling: "CHECKING SPELLING...",
    creatingImage: "CREATING IMAGE...",
    recentSearches: "Oxirgi qidiruvlar",
    darkMode: "Tungi rejim",
    lightMode: "Kunduzgi rejim",
    langLabel: "Til",
    searchHeroTitle1: "Har bir so'zda ",
    searchHeroTitle2: "bir hikoya",
    searchHeroTitle3: " bor.",
    searchHeroSubtitle: "Ingliz tilini qiziqarli va oson o'rganing.",
    aboutMethodTitle: "MnemoniX Metodi",
    aboutMethodDesc: "Bizning miyamiz mavhum ro'yxatlarni emas, balki hikoyalar va tasvirlarni eslab qolish uchun yaratilgan. Yorqin, qiziqarli va ba'zan g'alati assotsiatsiyalar yaratish orqali biz 'unutish egri chizig'ini' chetlab o'tamiz va ma'lumotni to'g'ridan-to'g'ri uzoq muddatli xotiraga o'tkazamiz.",
    dashboard: {
      title: "Faoliyat",
      stats: "O'rganish statistikasi",
      total: "JAMI O'RGANILGAN",
      today: "BUGUNGI HISOB",
      average: "O'RTACHA KUNLIK",
      level: "SO'ZLAR DARAJASI",
      progress: "Oxirgi 7 kunlik progress",
      noData: "Ma'lumot topilmadi"
    },
    profile: {
      learner: "O'rganuvchi",
      guestLearner: "Mehmon o'rganuvchi",
      joined: "A'zo bo'lgan sana",
      guestSession: "Mehmon seansi",
      noAccount: "Hisob ulanmagan",
      wordsSearched: "Qidirilgan so'zlar",
      mastered: "O'zlashtirilgan",
      accountSettings: "Hisob sozlamalari",
      editProfile: "Profilni tahrirlash",
      signOut: "Chiqish",
      signIn: "Kirish / Hisob yaratish",
      hardWords: "Qiyin so'zlar"
    }
  },
  [Language.RUSSIAN]: {
    heroTitle: "Запоминайте иностранные слова мгновенно",
    heroSubtitle: "Увеличьте свой словарный запас в 10 раз быстрее с помощью мнемоники и ИИ.",
    searchPlaceholder: "Введите английское слово...",
    btnSearch: "Изучить",
    btnVoice: "Live Режим",
    btnStartSearch: "Начать поиск",
    navHome: "Главная",
    navSearch: "Поиск",
    navDash: "Статистика",
    navFlash: "Карты",
    navProfile: "Профиль",
    howItWorksTitle: "Как это работает?",
    howItWorksStep1: "Найдите слово",
    howItWorksStep1Desc: "Введите английское слово, которое хотите выучить.",
    howItWorksStep2: "Получите мнемонику",
    howItWorksStep2Desc: "ИИ создаст для вас понятную ассоциацию и изображение.",
    howItWorksStep3: "Запомните навсегда",
    howItWorksStep3Desc: "Представьте образ и запомните слово навсегда.",
    howItWorksMethodTitle: "Метод ключевых слов",
    howItWorksMethodDesc: "Доказано, что этот метод, разработанный учеными Стэнфорда, улучшает память в 3 раза.",
    errorTitle: "Произошла ошибка",
    errorQuota: "Лимит исчерпан. Пожалуйста, подождите.",
    errorGeneral: "Что-то пошло не так. Попробуйте еще раз.",
    loadingMnemonic: "Создание мнемоники...",
    loadingImage: "Рисование образа...",
    saveSuccess: "Слово сохранено!",
    feedback: "Обратная связь",
    allWords: "Все слова",
    retry: "Повторить",
    startLearning: "Начните изучать новые слова",
    loadingStory: "Мастер придумывает для вас интересную историю...",
    checkingSpelling: "ПРОВЕРКА ОРФОГРАФИИ...",
    creatingImage: "СОЗДАНИЕ ИЗОБРАЖЕНИЯ...",
    recentSearches: "Последние поиски",
    darkMode: "Темный режим",
    lightMode: "Светлый режим",
    langLabel: "Язык",
    searchHeroTitle1: "В каждом слове ",
    searchHeroTitle2: "своя история",
    searchHeroTitle3: ".",
    searchHeroSubtitle: "Изучайте английский весело и легко.",
    aboutMethodTitle: "Метод MnemoniX",
    aboutMethodDesc: "Наш мозг создан для того, чтобы запоминать истории и образы, а не абстрактные списки. Создавая яркие, интересные, а иногда и странные ассоциации, мы обходим 'кривую забывания' и переносим информацию прямо в долговременную память.",
    dashboard: {
      title: "Активность",
      stats: "Статистика обучения",
      total: "ВСЕГО ВЫУЧЕНО",
      today: "СЕГОДНЯШНИЙ СЧЕТ",
      average: "СРЕДНЕЕ В ДЕНЬ",
      level: "УРОВЕНЬ СЛОВ",
      progress: "Прогресс за последние 7 дней",
      noData: "Данные не найдены"
    },
    profile: {
      learner: "Ученик",
      guestLearner: "Гость",
      joined: "Присоединился",
      guestSession: "Гостевой сеанс",
      noAccount: "Аккаунт не подключен",
      wordsSearched: "Изучено слов",
      mastered: "Освоено",
      accountSettings: "Настройки аккаунта",
      editProfile: "Редактировать профиль",
      signOut: "Выйти",
      signIn: "Войти / Создать аккаунт",
      hardWords: "Трудные слова"
    }
  },
  [Language.KAZAKH]: {
    heroTitle: "Шет тілі сөздерін лезде жаттаңыз",
    heroSubtitle: "Мнемоника мен жасанды интеллект көмегімен сөздік қорыңызды 10 есе жылдам арттырыңыз.",
    searchPlaceholder: "Ағылшын сөзін енгізіңіз...",
    btnSearch: "Үйрену",
    btnVoice: "Live Режим",
    btnStartSearch: "Іздеуді бастау",
    navHome: "Басты бет",
    navSearch: "Іздеу",
    navDash: "Статистика",
    navFlash: "Карталар",
    navProfile: "Профиль",
    howItWorksTitle: "Бұл қалай жұмыс істейді?",
    howItWorksStep1: "Сөзді іздеңіз",
    howItWorksStep1Desc: "Үйренгіңіз келетін ағылшын сөзін енгізіңіз.",
    howItWorksStep2: "Мнемоника алыңыз",
    howItWorksStep2Desc: "ЖИ сіз үшін түсінікті ассоциация мен сурет жасайды.",
    howItWorksStep3: "Мәңгі есте сақтаңыз",
    howItWorksStep3Desc: "Бейнені елестетіп, сөзді мәңгіге жаттаңыз.",
    howItWorksMethodTitle: "Кілт сөздер әдісі",
    howItWorksMethodDesc: "Стэнфорд ғалымдары жасаған бұл әдіс жадыны 3 есе күшейтетіні дәлелденген.",
    errorTitle: "Қате орын алды",
    errorQuota: "Лимит таусылды. Күте тұрыңыз.",
    errorGeneral: "Бірдеңе дұрыс болмады. Қайталап көріңіз.",
    loadingMnemonic: "Мнемоника жасалуда...",
    loadingImage: "Бейне салынуда...",
    saveSuccess: "Сөз сақталды!",
    feedback: "Кері байланыс",
    allWords: "Барлық сөздер",
    retry: "Қайталау",
    startLearning: "Жаңа сөздерді үйренуді бастаңыз",
    loadingStory: "Шебер сіз үшін қызықты оқиға ойлап табуда...",
    checkingSpelling: "ЕМЛЕНІ ТЕКСЕРУ...",
    creatingImage: "СУРЕТТІ ЖАСАУ...",
    recentSearches: "Соңғы іздеулер",
    darkMode: "Қараңғы режим",
    lightMode: "Жарық режим",
    langLabel: "Тіл",
    searchHeroTitle1: "Әр сөзде ",
    searchHeroTitle2: "бір хикая",
    searchHeroTitle3: " бар.",
    searchHeroSubtitle: "Ағылшын тілін қызықты әрі оңай үйреніңіз.",
    aboutMethodTitle: "MnemoniX әдісі",
    aboutMethodDesc: "Біздің миымыз дерексіз тізімдерді емес, оқиғалар мен бейнелерді есте сақтау үшін жаратылған. Жарқын, қызықты және кейде оғаш ассоциациялар құру арқылы біз 'ұмыту қисығын' айналып өтіп, ақпаратты тікелей ұзақ мерзімді жадыға өткіземіз.",
    dashboard: {
      title: "Белсенділік",
      stats: "Оқу статистикасы",
      total: "БАРЛЫҒЫ ҮЙРЕНІЛДІ",
      today: "БҮГІНГІ ЕСЕП",
      average: "ОРТАША КҮНДІК",
      level: "СӨЗДЕР ДЕҢГЕЙІ",
      progress: "Соңғы 7 күндік прогресс",
      noData: "Мәлімет табылмады"
    },
    profile: {
      learner: "Үйренуші",
      guestLearner: "Қонақ үйренуші",
      joined: "Тіркелген күні",
      guestSession: "Қонақ сессиясы",
      noAccount: "Тіркелгі қосылмаған",
      wordsSearched: "Ізделген сөздер",
      mastered: "Меңгерілген",
      accountSettings: "Тіркелгі параметрлері",
      editProfile: "Профильді өңдеу",
      signOut: "Шығу",
      signIn: "Кіру / Тіркелгі жасау",
      hardWords: "Қиын сөздер"
    }
  },
  [Language.TAJIK]: {
    heroTitle: "Калимаҳои хориҷиро фавран дар хотир гиред",
    heroSubtitle: "Захираи луғавии худро бо ёрии мнемоника ва зеҳни сунъӣ 10 маротиба тезтар зиёд кунед.",
    searchPlaceholder: "Калимаи англисиро ворид кунед...",
    btnSearch: "Омӯхтан",
    btnVoice: "Режими Live",
    btnStartSearch: "Оғози ҷустуҷӯ",
    navHome: "Асосӣ",
    navSearch: "Ҷустуҷӯ",
    navDash: "Омор",
    navFlash: "Кортҳо",
    navProfile: "Профил",
    howItWorksTitle: "Ин чӣ гуна кор мекунад?",
    howItWorksStep1: "Калимаро ҷӯед",
    howItWorksStep1Desc: "Калимаи англисиеро, ки мехоҳед омӯзед, ворид кунед.",
    howItWorksStep2: "Мнемоника гиред",
    howItWorksStep2Desc: "AI барои шумо ассотсиатсия ва тасвири фаҳмо эҷод мекунад.",
    howItWorksStep3: "Дар хотир нигоҳ доред",
    howItWorksStep3Desc: "Тасвирро тасаввур кунед ва калимаро барои ҳамеша дар хотир гиред.",
    howItWorksMethodTitle: "Методи калимаҳои калидӣ",
    howItWorksMethodDesc: "Исбот шудааст, ки ин метод, ки аз ҷониби олимони Стэнфорд таҳия шудааст, хотираро 3 маротиба қавӣ мегардонад.",
    errorTitle: "Хатогӣ рӯй дод",
    errorQuota: "Маҳдудияти квота. Лутфан интизор шавед.",
    errorGeneral: "Чизе нодуруст рафт. Дубора кӯшиш кунед.",
    loadingMnemonic: "Мнемоника сохта шуда истодааст...",
    loadingImage: "Тасвир кашида шуда истодааст...",
    saveSuccess: "Калима захира шуд!",
    feedback: "Фикру мулоҳиза",
    allWords: "Ҳамаи калимаҳо",
    retry: "Дубора кӯшиш кунед",
    startLearning: "Омӯзиши калимаҳои навро оғоз кунед",
    loadingStory: "Устод барои шумо ҳикояи ҷолиб фикр мекунад...",
    checkingSpelling: "САНҶИШИ ИМЛО...",
    creatingImage: "ЭҶОДИ ТАСВИР...",
    recentSearches: "Ҷустуҷӯҳои охирин",
    darkMode: "Ҳолати торик",
    lightMode: "Ҳолати рӯшан",
    langLabel: "Забон",
    searchHeroTitle1: "Дар ҳар як калима ",
    searchHeroTitle2: "як ҳикоя",
    searchHeroTitle3: " ҳаст.",
    searchHeroSubtitle: "Забони англисиро шавқовар ва осон омӯзед.",
    aboutMethodTitle: "Методи MnemoniX",
    aboutMethodDesc: "Мағзи мо барои дар хотир нигоҳ доштани ҳикояҳо ва тасвирҳо сохта шудааст, на рӯйхатҳои абстрактӣ. Бо эҷод кардани ассотсиатсияҳои дурахшон, ҷолиб ва баъзан аҷиб, мо 'каҷи фаромӯширо' давр мезанем ва маълумотро мустақиман ба хотираи дарозмуддат интиқол медиҳем.",
    dashboard: {
      title: "Фаъолият",
      stats: "Омори омӯзиш",
      total: "ҲАМАИ ОМӮХТАШУДА",
      today: "ҲИСОБИ ИМРӮЗА",
      average: "МИЁНАИ РӮЗОНА",
      level: "САТҲИ КАЛИМАҲО",
      progress: "Пешрафти 7 рӯзи охир",
      noData: "Маълумот ёфт нашуд"
    },
    profile: {
      learner: "Омӯзанда",
      guestLearner: "Омӯзандаи меҳмон",
      joined: "Санаи ҳамроҳшавӣ",
      guestSession: "Сессияи меҳмонӣ",
      noAccount: "Ҳисоб пайваст нашудааст",
      wordsSearched: "Калимаҳои ҷустуҷӯшуда",
      mastered: "Азхудшуда",
      accountSettings: "Танзимоти ҳисоб",
      editProfile: "Таҳрири профил",
      signOut: "Баромадан",
      signIn: "Даромадан / Сохтани ҳисоб",
      hardWords: "Калимаҳои душвор"
    }
  },
  [Language.KYRGYZ]: {
    heroTitle: "Чет тилдеги сөздөрдү заматта эстеп калыңыз",
    heroSubtitle: "Мнемоника жана жасалма интеллекттин жардамы менен сөз байлыгыңызды 10 эсе тезирээк көбөйтүңүз.",
    searchPlaceholder: "Англисче сөздү киргизиңіз...",
    btnSearch: "Үйрөнүү",
    btnVoice: "Live Режим",
    btnStartSearch: "Издөөнү баштоо",
    navHome: "Башкы бет",
    navSearch: "Издөө",
    navDash: "Статистика",
    navFlash: "Карталар",
    navProfile: "Профиль",
    howItWorksTitle: "Бул кантип иштейт?",
    howItWorksStep1: "Сөздү издеңиз",
    howItWorksStep1Desc: "Үйрөнгүңүз келген англисче сөздү киргизиңіз.",
    howItWorksStep2: "Мнемоника алыңыз",
    howItWorksStep2Desc: "ЖИ сиз үчүн түшүнүктүү ассоциация жана сүрөт жаратат.",
    howItWorksStep3: "Түбөлүккө эстеп калыңыз",
    howItWorksStep3Desc: "Образды элестетип, сөздү түбөлүккө жаттаңыз.",
    howItWorksMethodTitle: "Ачкыч сөздөр ыкмасы",
    howItWorksMethodDesc: "Стэнфорд окумуштуулары тарабынан иштелип чыккан бул ыкма эстутумду 3 эсе күчөтөрү далилденген.",
    errorTitle: "Ката кетти",
    errorQuota: "Лимит бүттү. Күтө туруңуз.",
    errorGeneral: "Бир нерсе туура эмес кетти. Кайра аракет кылыңыз.",
    loadingMnemonic: "Мнемоника түзүлүүдө...",
    loadingImage: "Сүрөт тартылууда...",
    saveSuccess: "Сөз сакталды!",
    feedback: "Пикир-пикир",
    allWords: "Бардык сөздөр",
    retry: "Кайталоо",
    startLearning: "Жаңы сөздөрдү үйрөнүүнү баштаңыз",
    loadingStory: "Мастер сиз үчүн кызыктуу окуя ойлоп жатат...",
    checkingSpelling: "ЖАЗУУНУ ТЕКШЕРҮҮ...",
    creatingImage: "СҮРӨТТҮ ТҮЗҮҮ...",
    recentSearches: "Акыркы издөөлөр",
    darkMode: "Караңғы режим",
    lightMode: "Жарык режим",
    langLabel: "Тил",
    searchHeroTitle1: "Ар бир сөздө ",
    searchHeroTitle2: "бир окуя",
    searchHeroTitle3: " бар.",
    searchHeroSubtitle: "Англис тилин кызыктуу жана оңой үйрөнүңүз.",
    aboutMethodTitle: "MnemoniX ыкмасы",
    aboutMethodDesc: "Биздин мээбиз абстракттуу тизмелерди эмес, окуяларды жана образдарды эстеп калуу үчүн жаратылган. Жаркын, кызыктуу жана кээде кызыктай ассоциацияларды түзүү менен биз 'унутуу ийри сызыгын' айланып өтүп, маалыматты түздөн-түз узак мөөнөттүү эстутумга өткөрөбүз.",
    dashboard: {
      title: "Активдүүлүк",
      stats: "Окуу статистикасы",
      total: "БАРДЫГЫ ҮЙРӨНҮЛДҮ",
      today: "БҮГҮНКҮ ЭСЕП",
      average: "ОРТОЧО КҮНДҮК",
      level: "СӨЗДӨР ДЕҢГЭЭЛИ",
      progress: "Акыркы 7 күндүк прогресс",
      noData: "Маалымат табылган жок"
    },
    profile: {
      learner: "Үйрөнүүчү",
      guestLearner: "Конок үйрөнүүчү",
      joined: "Кошулган күнү",
      guestSession: "Конок сессиясы",
      noAccount: "Аккаунт туташтырылган эмес",
      wordsSearched: "Изделген сөздөр",
      mastered: "Өздөштүрүлгөн",
      accountSettings: "Аккаунттун жөндөөлөрү",
      editProfile: "Профилди түзөтүү",
      signOut: "Чыгуу",
      signIn: "Кирүү / Аккаунт түзүү",
      hardWords: "Кыйын сөздөр"
    }
  },
  [Language.TURKMEN]: {
    heroTitle: "Daşary ýurt sözlerini bada-bat ýatda saklaň",
    heroSubtitle: "Mnemonika we emeli intellekt kömegi bilen söz baýlygyňyzy 10 esse çalt artdyryň.",
    searchPlaceholder: "Iňlisçe sözi giriziň...",
    btnSearch: "Öwrenmek",
    btnVoice: "Live Režim",
    btnStartSearch: "Gözlegi başlatmak",
    navHome: "Esasy",
    navSearch: "Gözleg",
    navDash: "Statistika",
    navFlash: "Kartalar",
    navProfile: "Profil",
    howItWorksTitle: "Bu nähili işleýär?",
    howItWorksStep1: "Sözi gözläň",
    howItWorksStep1Desc: "Öwrenmek isleýän iňlisçe sözüňizi giriziň.",
    howItWorksStep2: "Mnemonika alyň",
    howItWorksStep2Desc: "AI size düşnükli assosiasiýa we surat döredip berer.",
    howItWorksStep3: "Hatyraňyza möhürläň",
    howItWorksStep3Desc: "Göz öňüne getiriň we sözi ömürlik ýatda saklaň.",
    howItWorksMethodTitle: "Açar sözler metody",
    howItWorksMethodDesc: "Stenford uniwersitetiniň alymlary tarapyndan işlenip düzülen bu metod ýatkeşligi 3 esse güýçlendirýändigi subut edildi.",
    errorTitle: "Ýalňyşlyk ýüze çykdy",
    errorQuota: "Limit gutardy. Haýyş, biraz garaşyň.",
    errorGeneral: "Nämedir bir zat ýalňyş boldy. Täzeden synanyşyň.",
    loadingMnemonic: "Mnemonika döredilýär...",
    loadingImage: "Surat çekilýär...",
    saveSuccess: "Söz saklandy!",
    feedback: "Keri baylanis",
    allWords: "Ähli sözler",
    retry: "Täzeden synanyşmak",
    startLearning: "Täze sözleri öwrenip başlaň",
    loadingStory: "Ussa size gyzykly hekaýa oýlap tapýar...",
    checkingSpelling: "ÝAZYLYŞY BARLANÝAR...",
    creatingImage: "SURAT DÖREDILÝÄR...",
    recentSearches: "Soňky gözlegler",
    darkMode: "Garaňky režim",
    lightMode: "Ýagty režim",
    langLabel: "Dil",
    searchHeroTitle1: "Her bir sözde ",
    searchHeroTitle2: "bir hekaýa",
    searchHeroTitle3: " bar.",
    searchHeroSubtitle: "Iňlis dilini gyzykly we aňsat öwreniň.",
    aboutMethodTitle: "MnemoniX Metody",
    aboutMethodDesc: "Biziň beýnimiz abstrakt sanawlary däl-de, eýsem hekaýalary we şekilleri ýatda saklamak üçin döredilendir. Açyk, gyzykly we käwagt geň assosiasiýalary döretmek arkaly biz 'ýatdan çykarmak egrisini' sowlup geçýäris we maglumaty göni uzak möhletli ýatkeşlige geçirýäris.",
    dashboard: {
      title: "Işjeňlik",
      stats: "Öwreniş statistikasy",
      total: "JEMI ÖWRENILDI",
      today: "ŞUGÜNKI HASAP",
      average: "ORTAÇA GÜNLÜK",
      level: "SÖZLER DEREJESI",
      progress: "Soňky 7 günlük progress",
      noData: "Maglumat tapylmady"
    },
    profile: {
      learner: "Öwreniji",
      guestLearner: "Myhman öwreniji",
      joined: "Goşulan senesi",
      guestSession: "Myhman seansi",
      noAccount: "Hasap birikdirilmedik",
      wordsSearched: "Gözlenen sözler",
      mastered: "Özleşdirilen",
      accountSettings: "Hasap sazlamalary",
      editProfile: "Profili tahrirlemek",
      signOut: "Çykmak",
      signIn: "Girmek / Hasap döretmek",
      hardWords: "Kyn sözler"
    }
  },
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  const gemini = React.useMemo(() => new GeminiService(), []);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [isFlashcardDetailOpen, setIsFlashcardDetailOpen] = useState(false);
  const [forceCloseFlashcardDetail, setForceCloseFlashcardDetail] = useState(false);
  const [language, setLanguage] = useState<Language>(Language.UZBEK);
  const [searchQuery, setSearchQuery] = useState('');
  const [mnemonic, setMnemonic] = useState<MnemonicResponse | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [savedMnemonics, setSavedMnemonics] = useState<SavedMnemonic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const t = TRANSLATIONS[language];

  const navigateTo = (newView: AppView) => {
    if (newView !== view) {
      setViewHistory(prev => [...prev, view]);
      setView(newView);
    }
  };

  const goBack = () => {
    if (view === AppView.FLASHCARDS && isFlashcardDetailOpen) {
      setForceCloseFlashcardDetail(true);
      setTimeout(() => setForceCloseFlashcardDetail(false), 100);
      return;
    }

    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setView(prev);
    } else if (view !== AppView.HOME) {
      setView(AppView.HOME);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme as 'light' | 'dark');
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedMnemonics();
    }
  }, [user]);

  const fetchSavedMnemonics = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_words')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setSavedMnemonics(data.map(item => ({
        id: item.id,
        word: item.word,
        data: item.mnemonic_data,
        imageUrl: item.image_url,
        timestamp: new Date(item.created_at).getTime(),
        language: item.language as Language,
        isHard: item.mnemonic_data?.isHard || false,
        isMastered: item.status === 'mastered'
      })));
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setState(AppState.LOADING);
    setError(null);
    setMnemonic(null);
    setImageUrl('');

    try {
      const correctedWord = await gemini.checkSpelling(searchQuery);
      const res = await gemini.getMnemonic(correctedWord, language);
      setMnemonic(res);
      
      const img = await gemini.generateImage(res.imagePrompt);
      setImageUrl(img);
      
      setState(AppState.RESULTS);

      const newSavedMnemonic: SavedMnemonic = {
        id: Math.random().toString(36).substr(2, 9),
        word: res.word,
        data: res,
        imageUrl: img,
        timestamp: Date.now(),
        language: language,
        isHard: false
      };

      setSavedMnemonics(prev => [newSavedMnemonic, ...prev]);

      if (user) {
        await supabase.from('user_words').insert({
          user_id: user.id,
          word: res.word,
          mnemonic_data: res,
          image_url: img,
          language: language
        });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setError(t.errorQuota);
      } else {
        setError(t.errorGeneral);
      }
      setState(AppState.ERROR);
    }
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from('user_words').delete().eq('id', id);
    }
    setSavedMnemonics(prev => prev.filter(m => m.id !== id));
  };

  const handleToggleHard = async (id: string, isHard: boolean) => {
    const word = savedMnemonics.find(m => m.id === id);
    if (!word) return;

    const updatedData = { ...word.data, isHard };
    
    if (user) {
      await supabase
        .from('user_words')
        .update({ mnemonic_data: updatedData })
        .eq('id', id);
    }

    setSavedMnemonics(prev => prev.map(m => m.id === id ? { ...m, isHard, data: updatedData } : m));
  };

  const handleToggleMastered = async (id: string, isMastered: boolean) => {
    const word = savedMnemonics.find(m => m.id === id);
    if (!word) return;

    if (user) {
      await supabase
        .from('user_words')
        .update({ status: isMastered ? 'mastered' : 'learning' })
        .eq('id', id);
    }

    setSavedMnemonics(prev => prev.map(m => m.id === id ? { ...m, isMastered } : m));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Auth onSuccess={() => {}} onGuestMode={() => setIsGuest(true)} />;
  }

  const masteredCount = savedMnemonics.filter(m => m.isMastered).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 px-4 py-4 sm:py-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Desktop Logo */}
          <div 
            className="hidden md:flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateTo(AppView.HOME)}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              M
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight hidden lg:block">
              Mnemonix
            </span>
          </div>

          {/* Mobile Back Button */}
          <div className="md:hidden flex-1 flex items-center">
            {(view !== AppView.HOME || isFlashcardDetailOpen) && (
              <button 
                onClick={goBack}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>

          {/* Mobile Centered Logo */}
          <div className="md:hidden flex-[2] flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
              M
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Mnemonix
            </span>
          </div>

          {/* Tablet/Desktop Navigation (md and up) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Center Nav - Pill */}
            <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-100 dark:border-slate-800 p-1.5 rounded-full shadow-sm">
              {[
                { id: AppView.HOME, label: t.navHome },
                { id: AppView.SEARCH, label: t.navSearch },
                { id: AppView.DASHBOARD, label: t.navDash },
                { id: AppView.FLASHCARDS, label: t.navFlash }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    view === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Voice Assistant Toggle */}
            <button 
              onClick={() => setState(AppState.VOICE_MODE)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg shadow-indigo-500/20 font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <Mic size={18} />
            </button>

            {/* Settings Icons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView(AppView.PROFILE)}
                className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                <UserIcon size={20} />
              </button>
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              
              {/* Language Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                >
                  <Languages size={20} />
                </button>
                
                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                    >
                      {Object.values(Language).map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setLanguage(l);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            language === l 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Navigation (md:hidden) */}
          <div className="md:hidden flex-1 flex justify-end">
            {/* Hamburger Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  isMenuOpen 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/80 dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-gray-400'
                } shadow-sm`}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                    >
                      {/* Profile */}
                      <button
                        onClick={() => {
                          setView(AppView.PROFILE);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <UserIcon size={18} />
                        {t.navProfile}
                      </button>

                      {/* Theme Toggle */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        {theme === 'light' ? t.darkMode : t.lightMode}
                      </button>

                      {/* Language Selector */}
                      <div className="border-t border-gray-100 dark:border-slate-800 mt-2 pt-2">
                        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {t.langLabel}
                        </div>
                        {Object.values(Language).map((l) => (
                          <button
                            key={l}
                            onClick={() => {
                              setLanguage(l);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              language === l 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {view === AppView.HOME && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 sm:space-y-12"
            >
              {/* Hero Section */}
              <div className="text-center max-w-4xl mx-auto space-y-6 py-4 sm:py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-black uppercase tracking-wider animate-bounce">
                  <Sparkles size={16} />
                  AI-Powered Learning
                </div>
                <h1 className="text-4xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                  {t.heroTitle}
                </h1>
                <p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                  {t.heroSubtitle}
                </p>

                <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                   <button 
                    onClick={() => setView(AppView.SEARCH)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-4 sm:px-10 sm:py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-xl shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 w-full sm:w-auto text-center"
                   >
                     <Search size={20} className="sm:w-6 sm:h-6" />
                     <span className="leading-tight">{t.btnStartSearch}</span>
                   </button>
                   <button 
                    onClick={() => setState(AppState.VOICE_MODE)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-4 sm:px-10 sm:py-5 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-xl text-gray-600 dark:text-gray-400 hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm w-full sm:w-auto text-center"
                   >
                     <Mic size={20} className="sm:w-6 sm:h-6" />
                     <span className="leading-tight">{t.btnVoice}</span>
                   </button>
                </div>
              </div>

              {/* Results / Loading States */}
              <div className="min-h-[200px]">
                <AboutSection t={t} />
              </div>
            </motion.div>
          )}

          {view === AppView.SEARCH && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SearchPage 
                language={language}
                state={state}
                mnemonic={mnemonic}
                imageUrl={imageUrl}
                error={error}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                savedMnemonics={savedMnemonics}
                setState={setState}
                t={t}
              />
            </motion.div>
          )}

          {view === AppView.DASHBOARD && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard savedMnemonics={savedMnemonics} language={language} onDelete={handleDelete} t={t.dashboard} />
            </motion.div>
          )}

          {view === AppView.FLASHCARDS && (
            <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Flashcards 
                savedMnemonics={savedMnemonics} 
                language={language} 
                onToggleHard={handleToggleHard}
                onToggleMastered={handleToggleMastered}
                onDetailChange={setIsFlashcardDetailOpen}
                forceCloseDetail={forceCloseFlashcardDetail}
              />
            </motion.div>
          )}

          {view === AppView.PROFILE && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Profile 
                user={user} 
                totalWords={savedMnemonics.length} 
                masteredCount={masteredCount}
                onSignOut={() => { supabase.auth.signOut(); setIsGuest(false); }} 
                onSignIn={() => setIsGuest(false)}
                language={language}
                t={t.profile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-gray-100 dark:border-slate-800/50 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1">
          {[
            { id: AppView.HOME, icon: <Home size={22} />, label: t.navHome },
            { id: AppView.SEARCH, icon: <Search size={22} />, label: t.navSearch },
            { id: AppView.DASHBOARD, icon: <LayoutDashboard size={22} />, label: t.navDash },
            { id: AppView.FLASHCARDS, icon: <Layers size={22} />, label: t.navFlash }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === item.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold mt-0 ${view === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {state === AppState.VOICE_MODE && (
          <VoiceMode onClose={() => setState(AppState.IDLE)} targetLanguage={language} />
        )}
        {showFeedback && (
          <FeedbackModal 
            onClose={() => setShowFeedback(false)} 
            language={language} 
            receiverEmail="khazratkulovusa@gmail.com" 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
