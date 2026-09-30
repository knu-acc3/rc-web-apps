/**
 * Pregnancy weeks 4–42 (gestational age from the first day of the last period).
 * Sizes are typical approximate values from common fetal growth charts: crown–rump length up to
 * 20 weeks, crown–heel length from 20 weeks. Individual variation of several centimetres and
 * hundreds of grams is normal. Facts are limited to well-established, conservative statements.
 */

export interface WeekInfo {
  week: number;
  /** Approximate length, cm. */
  length: number;
  /** Approximate weight, g (null when too small to be meaningful). */
  weight: number | null;
  ru: string[];
  en: string[];
}

export const WEEKS: WeekInfo[] = [
  {
    week: 4,
    length: 0.1,
    weight: null,
    ru: ["Завершается имплантация: зародыш прикрепляется к стенке матки.", "Примерно к дате ожидаемой менструации тест на беременность обычно становится положительным — он реагирует на гормон ХГЧ."],
    en: ["Implantation completes as the embryo attaches to the wall of the uterus.", "Around the date of the expected period a home pregnancy test usually turns positive — it detects the hormone hCG."],
  },
  {
    week: 5,
    length: 0.2,
    weight: null,
    ru: ["Эмбрион размером около 1–2 мм. Начинают формироваться нервная трубка и сердце.", "На трансвагинальном УЗИ плодное яйцо обычно становится видно примерно с 5 недель."],
    en: ["The embryo is about 1–2 mm long. The neural tube and the heart begin to form.", "A gestational sac usually becomes visible on a transvaginal ultrasound from about 5 weeks."],
  },
  {
    week: 6,
    length: 0.5,
    weight: null,
    ru: ["Примерно в это время закрывается нервная трубка — зачаток головного и спинного мозга.", "Сердечную активность эмбриона часто можно увидеть на трансвагинальном УЗИ с 6–7 недель."],
    en: ["Around now the neural tube — the future brain and spinal cord — closes.", "Cardiac activity can often be seen on a transvaginal ultrasound from 6–7 weeks."],
  },
  {
    week: 7,
    length: 1,
    weight: null,
    ru: ["Появляются зачатки рук и ног, быстро растёт головной мозг.", "Длина эмбриона — около 1 см."],
    en: ["Arm and leg buds appear and the brain grows quickly.", "The embryo is about 1 cm long."],
  },
  {
    week: 8,
    length: 1.6,
    weight: 1,
    ru: ["Закладываются все основные органы, на руках намечаются пальцы.", "Идёт органогенез — период, когда эмбрион особенно чувствителен к алкоголю, некоторым лекарствам и инфекциям."],
    en: ["All the major organs are forming and fingers begin to appear.", "This is organogenesis, when the embryo is especially sensitive to alcohol, some medicines and infections."],
  },
  {
    week: 9,
    length: 2.3,
    weight: 2,
    ru: ["Хорошо различимы голова, руки и ноги.", "Эмбрион уже двигается, но почувствовать это пока невозможно."],
    en: ["The head, arms and legs are clearly visible.", "The embryo already moves, although it cannot be felt yet."],
  },
  {
    week: 10,
    length: 3.1,
    weight: 4,
    ru: ["С 10-й акушерской недели (8 недель от зачатия) эмбрион называют плодом.", "Основные органы уже сформированы — дальше они растут и созревают."],
    en: ["From 10 weeks of pregnancy (8 weeks after conception) the embryo is called a fetus.", "The major organs have formed; from now on they grow and mature."],
  },
  {
    week: 11,
    length: 4.1,
    weight: 7,
    ru: ["Начинается окно первого скрининга: УЗИ с измерением толщины воротникового пространства и анализ крови обычно проводят с 11 недель до 13 недель 6 дней.", "У плода формируются ногтевые ложа."],
    en: ["The first-trimester screening window opens: an ultrasound with nuchal translucency measurement and a blood test are usually done from 11 weeks to 13 weeks 6 days.", "Nail beds are forming."],
  },
  {
    week: 12,
    length: 5.4,
    weight: 14,
    ru: ["Плод длиной около 5–6 см; начинают работать почки.", "Продолжается окно первого скрининга."],
    en: ["The fetus is about 5–6 cm long and the kidneys start working.", "The first-trimester screening window continues."],
  },
  {
    week: 13,
    length: 7.4,
    weight: 23,
    ru: ["Последняя неделя первого триместра.", "После 12–13 недель риск выкидыша заметно снижается."],
    en: ["The last week of the first trimester.", "After 12–13 weeks the risk of miscarriage falls considerably."],
  },
  {
    week: 14,
    length: 8.7,
    weight: 43,
    ru: ["Начинается второй триместр.", "У многих женщин проходит утренняя тошнота и прибавляется сил."],
    en: ["The second trimester begins.", "For many women morning sickness eases and energy returns."],
  },
  {
    week: 15,
    length: 10.1,
    weight: 70,
    ru: ["Плод около 10 см; кости продолжают твердеть.", "Он активно двигает руками и ногами."],
    en: ["The fetus is about 10 cm long and the bones keep hardening.", "It moves its arms and legs actively."],
  },
  {
    week: 16,
    length: 11.6,
    weight: 100,
    ru: ["Некоторые женщины, рожавшие раньше, начинают чувствовать первые шевеления.", "При первой беременности шевеления чаще замечают на 18–22 неделе."],
    en: ["Some women who have been pregnant before start to feel the first movements.", "In a first pregnancy movements are usually noticed at 18–22 weeks."],
  },
  {
    week: 17,
    length: 13,
    weight: 140,
    ru: ["Под кожей начинает откладываться жир.", "Плод около 13 см и 140 г."],
    en: ["Fat begins to build up under the skin.", "The fetus is about 13 cm and 140 g."],
  },
  {
    week: 18,
    length: 14.2,
    weight: 190,
    ru: ["Начинается окно второго скринингового УЗИ (обычно 18–21 неделя): проверяют анатомию плода, плаценту и количество околоплодных вод.", "На этом УЗИ часто уже можно увидеть пол."],
    en: ["The window for the mid-pregnancy anatomy scan opens (usually 18–21 weeks): the baby's anatomy, the placenta and the amniotic fluid are checked.", "The sex can often be seen at this scan."],
  },
  {
    week: 19,
    length: 15.3,
    weight: 240,
    ru: ["Кожу покрывает первородная смазка, которая защищает её в околоплодных водах.", "Шевеления становятся заметнее."],
    en: ["The skin is covered with vernix, which protects it in the amniotic fluid.", "Movements become easier to feel."],
  },
  {
    week: 20,
    length: 25.6,
    weight: 300,
    ru: ["Середина беременности: дно матки примерно на уровне пупка.", "Длина плода от макушки до пяток — около 25 см."],
    en: ["Halfway: the top of the uterus is roughly level with the navel.", "The baby is about 25 cm long from head to heel."],
  },
  {
    week: 21,
    length: 26.7,
    weight: 360,
    ru: ["Плод глотает околоплодные воды — так тренируется пищеварительная система.", "Длина около 27 см, вес около 360 г."],
    en: ["The baby swallows amniotic fluid, which trains the digestive system.", "About 27 cm long and 360 g."],
  },
  {
    week: 22,
    length: 27.8,
    weight: 430,
    ru: ["Формируются брови и ресницы.", "С 22 недель при преждевременных родах в специализированных центрах возможно выхаживание, но риски для ребёнка очень высоки."],
    en: ["Eyebrows and eyelashes are forming.", "From 22 weeks, babies born early can sometimes be cared for in specialist centres, but the risks are very high."],
  },
  {
    week: 23,
    length: 28.9,
    weight: 500,
    ru: ["Плод реагирует на громкие звуки.", "Продолжают развиваться лёгкие."],
    en: ["The baby reacts to loud sounds.", "The lungs continue to develop."],
  },
  {
    week: 24,
    length: 30,
    weight: 600,
    ru: ["Лёгкие начинают вырабатывать сурфактант — вещество, которое помогает им раскрыться после рождения.", "Глюкозотолерантный тест для выявления гестационного диабета часто проводят между 24 и 28 неделями."],
    en: ["The lungs start producing surfactant, which helps them open after birth.", "A glucose tolerance test for gestational diabetes is often done between 24 and 28 weeks."],
  },
  {
    week: 25,
    length: 34.6,
    weight: 660,
    ru: ["Плод продолжает набирать вес.", "Длина около 35 см, вес около 660 г."],
    en: ["The baby keeps gaining weight.", "About 35 cm long and 660 g."],
  },
  {
    week: 26,
    length: 35.6,
    weight: 760,
    ru: ["Глаза начинают открываться (обычно на 26–28 неделе).", "Плод реагирует на свет и звук."],
    en: ["The eyes begin to open (usually at 26–28 weeks).", "The baby responds to light and sound."],
  },
  {
    week: 27,
    length: 36.6,
    weight: 875,
    ru: ["Последняя неделя второго триместра.", "Длина около 37 см, вес около 875 г."],
    en: ["The last week of the second trimester.", "About 37 cm long and 875 g."],
  },
  {
    week: 28,
    length: 37.6,
    weight: 1000,
    ru: ["Начинается третий триместр; вес плода — около 1 кг.", "При резус-отрицательной крови матери примерно в это время обсуждают профилактику антирезусным иммуноглобулином — решение принимает врач."],
    en: ["The third trimester begins; the baby weighs about 1 kg.", "If the mother is Rh-negative, anti-D prophylaxis is usually discussed around now — the doctor decides."],
  },
  {
    week: 29,
    length: 38.6,
    weight: 1150,
    ru: ["В ближайшие недели плод прибавляет примерно 150–250 г в неделю.", "Мышцы и лёгкие продолжают созревать."],
    en: ["Over the coming weeks the baby gains about 150–250 g a week.", "Muscles and lungs keep maturing."],
  },
  {
    week: 30,
    length: 39.9,
    weight: 1300,
    ru: ["Плод около 40 см и 1,3 кг.", "Третье плановое УЗИ, если оно назначено, обычно проводят около 30–34 недель."],
    en: ["The baby is about 40 cm and 1.3 kg.", "A third-trimester ultrasound, where offered, is usually done around 30–34 weeks."],
  },
  {
    week: 31,
    length: 41.1,
    weight: 1500,
    ru: ["Быстро растёт головной мозг.", "Плод открывает и закрывает глаза, различает свет и темноту."],
    en: ["The brain grows rapidly.", "The baby opens and closes its eyes and can tell light from dark."],
  },
  {
    week: 32,
    length: 42.4,
    weight: 1700,
    ru: ["Вес около 1,7 кг.", "Большинство детей переворачиваются головой вниз — обычно к 36 неделе."],
    en: ["About 1.7 kg.", "Most babies turn head-down, usually by 36 weeks."],
  },
  {
    week: 33,
    length: 43.7,
    weight: 1900,
    ru: ["Кости черепа остаются мягкими и подвижными — это помогает при родах.", "Плод около 1,9 кг."],
    en: ["The skull bones stay soft and flexible, which helps during birth.", "The baby weighs about 1.9 kg."],
  },
  {
    week: 34,
    length: 45,
    weight: 2150,
    ru: ["Лёгкие продолжают созревать.", "Дети, родившиеся на 34–36 неделе, обычно хорошо развиваются, но им может понадобиться наблюдение в первые дни."],
    en: ["The lungs keep maturing.", "Babies born at 34–36 weeks usually do well but may need extra monitoring in the first days."],
  },
  {
    week: 35,
    length: 46.2,
    weight: 2400,
    ru: ["Места для движений становится меньше, но шевеления должны оставаться регулярными.", "Если шевеления стали заметно реже или изменились — обратитесь к врачу в тот же день."],
    en: ["There is less room to move, but movements should stay regular.", "If movements slow down or change, contact your maternity team the same day."],
  },
  {
    week: 36,
    length: 47.4,
    weight: 2600,
    ru: ["Большинство детей уже расположены головой вниз.", "Если ребёнок лежит иначе, врач обсудит варианты."],
    en: ["Most babies are now head-down.", "If the baby is lying another way, the doctor will discuss the options."],
  },
  {
    week: 37,
    length: 48.6,
    weight: 2850,
    ru: ["С 37 недель беременность считается доношенной.", "37+0 — 38+6 — ранний доношенный срок."],
    en: ["From 37 weeks the pregnancy is considered term.", "37+0 to 38+6 is early term."],
  },
  {
    week: 38,
    length: 49.8,
    weight: 3100,
    ru: ["Вес около 3 кг.", "Органы готовы к жизни вне матки."],
    en: ["About 3 kg.", "The organs are ready for life outside the womb."],
  },
  {
    week: 39,
    length: 50.7,
    weight: 3300,
    ru: ["Начинается полный доношенный срок: 39+0 — 40+6.", "Роды могут начаться в любой день."],
    en: ["Full term begins: 39+0 to 40+6.", "Labour can start any day."],
  },
  {
    week: 40,
    length: 51.2,
    weight: 3450,
    ru: ["Неделя предполагаемой даты родов.", "Точно в этот день рожают лишь около 4–5 % женщин; роды между 37 и 42 неделями считаются нормой."],
    en: ["The week of the estimated due date.", "Only about 4–5% of babies arrive on the exact date; birth between 37 and 42 weeks is normal."],
  },
  {
    week: 41,
    length: 51.7,
    weight: 3600,
    ru: ["Поздний доношенный срок: 41+0 — 41+6.", "Врач обычно обсуждает дополнительное наблюдение и возможную индукцию родов."],
    en: ["Late term: 41+0 to 41+6.", "Your doctor will usually discuss extra monitoring and possible induction of labour."],
  },
  {
    week: 42,
    length: 51.5,
    weight: 3700,
    ru: ["С 42 недель беременность считается переношенной.", "Обычно рекомендуют родоразрешение: риски для ребёнка при дальнейшем вынашивании растут."],
    en: ["From 42 weeks the pregnancy is post-term.", "Delivery is usually recommended because risks to the baby increase."],
  },
];

export const weekInfo = (w: number) => WEEKS.find((x) => x.week === w);
