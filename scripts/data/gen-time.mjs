/**
 * World-time dataset generator: node scripts/data/gen-time.mjs
 *
 * Source: the hand-curated lists below (one city / country per line). The script
 * validates everything (unique slugs, valid IANA zones, coordinates, Russian
 * locative forms, country coverage) and writes:
 *   src/tools/time/time/data/cities.json
 *   src/tools/time/time/data/countries.json
 * Russian country names are cross-checked against CLDR when it is installed
 * (npm --prefix scripts/data install) — mismatches are only reported, the
 * curated names win (CLDR uses long/official forms such as «Соединенные Штаты»).
 *
 * City line:    slug;en;ru;ruIn;cc;tz;lat;lon;population[;1 = national capital]
 * Country line: cc;en;ru;ruIn;mainCitySlug
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "src", "tools", "time", "time", "data");

const CITIES = `
# ───── Kazakhstan
astana;Astana;Астана;в Астане;KZ;Asia/Almaty;51.1694;71.4491;1430000;1
almaty;Almaty;Алматы;в Алматы;KZ;Asia/Almaty;43.2389;76.8897;2230000
shymkent;Shymkent;Шымкент;в Шымкенте;KZ;Asia/Almaty;42.3417;69.5901;1230000
aktobe;Aktobe;Актобе;в Актобе;KZ;Asia/Aqtobe;50.2839;57.1670;590000
karaganda;Karaganda;Караганда;в Караганде;KZ;Asia/Almaty;49.8047;73.1094;510000
taraz;Taraz;Тараз;в Таразе;KZ;Asia/Almaty;42.9000;71.3667;370000
pavlodar;Pavlodar;Павлодар;в Павлодаре;KZ;Asia/Almaty;52.2873;76.9674;360000
ust-kamenogorsk;Ust-Kamenogorsk;Усть-Каменогорск;в Усть-Каменогорске;KZ;Asia/Almaty;49.9483;82.6278;340000
semey;Semey;Семей;в Семее;KZ;Asia/Almaty;50.4111;80.2275;350000
oral;Oral;Уральск;в Уральске;KZ;Asia/Oral;51.2333;51.3667;330000
atyrau;Atyrau;Атырау;в Атырау;KZ;Asia/Atyrau;47.0945;51.9238;300000
aktau;Aktau;Актау;в Актау;KZ;Asia/Aqtau;43.6500;51.1667;270000
kostanay;Kostanay;Костанай;в Костанае;KZ;Asia/Qostanay;53.2144;63.6246;260000
kyzylorda;Kyzylorda;Кызылорда;в Кызылорде;KZ;Asia/Qyzylorda;44.8488;65.4823;250000
petropavl;Petropavl;Петропавловск;в Петропавловске;KZ;Asia/Almaty;54.8667;69.1500;220000
turkistan;Turkistan;Туркестан;в Туркестане;KZ;Asia/Almaty;43.2973;68.2517;200000
temirtau;Temirtau;Темиртау;в Темиртау;KZ;Asia/Almaty;50.0547;72.9644;180000
kokshetau;Kokshetau;Кокшетау;в Кокшетау;KZ;Asia/Almaty;53.2833;69.3833;160000
zhanaozen;Zhanaozen;Жанаозен;в Жанаозене;KZ;Asia/Aqtau;43.3411;52.8619;160000
taldykorgan;Taldykorgan;Талдыкорган;в Талдыкоргане;KZ;Asia/Almaty;45.0156;78.3739;150000
ekibastuz;Ekibastuz;Экибастуз;в Экибастузе;KZ;Asia/Almaty;51.7236;75.3228;150000
rudny;Rudny;Рудный;в Рудном;KZ;Asia/Qostanay;52.9667;63.1167;130000
zhezkazgan;Zhezkazgan;Жезказган;в Жезказгане;KZ;Asia/Almaty;47.7833;67.7000;90000
konaev;Konaev;Конаев;в Конаеве;KZ;Asia/Almaty;43.8667;77.0667;60000
# ───── Russia
moscow;Moscow;Москва;в Москве;RU;Europe/Moscow;55.7558;37.6173;13100000;1
saint-petersburg;Saint Petersburg;Санкт-Петербург;в Санкт-Петербурге;RU;Europe/Moscow;59.9386;30.3141;5600000
novosibirsk;Novosibirsk;Новосибирск;в Новосибирске;RU;Asia/Novosibirsk;55.0084;82.9357;1630000
yekaterinburg;Yekaterinburg;Екатеринбург;в Екатеринбурге;RU;Asia/Yekaterinburg;56.8389;60.6057;1540000
kazan;Kazan;Казань;в Казани;RU;Europe/Moscow;55.7887;49.1221;1320000
krasnoyarsk;Krasnoyarsk;Красноярск;в Красноярске;RU;Asia/Krasnoyarsk;56.0153;92.8932;1210000
nizhny-novgorod;Nizhny Novgorod;Нижний Новгород;в Нижнем Новгороде;RU;Europe/Moscow;56.3269;44.0059;1200000
chelyabinsk;Chelyabinsk;Челябинск;в Челябинске;RU;Asia/Yekaterinburg;55.1644;61.4368;1180000
ufa;Ufa;Уфа;в Уфе;RU;Asia/Yekaterinburg;54.7388;55.9721;1160000
samara;Samara;Самара;в Самаре;RU;Europe/Samara;53.1959;50.1002;1160000
krasnodar;Krasnodar;Краснодар;в Краснодаре;RU;Europe/Moscow;45.0355;38.9753;1150000
rostov-on-don;Rostov-on-Don;Ростов-на-Дону;в Ростове-на-Дону;RU;Europe/Moscow;47.2357;39.7015;1140000
omsk;Omsk;Омск;в Омске;RU;Asia/Omsk;54.9885;73.3242;1110000
voronezh;Voronezh;Воронеж;в Воронеже;RU;Europe/Moscow;51.6720;39.1843;1050000
perm;Perm;Пермь;в Перми;RU;Asia/Yekaterinburg;58.0105;56.2502;1030000
volgograd;Volgograd;Волгоград;в Волгограде;RU;Europe/Volgograd;48.7080;44.5133;1020000
saratov;Saratov;Саратов;в Саратове;RU;Europe/Saratov;51.5336;46.0343;900000
tyumen;Tyumen;Тюмень;в Тюмени;RU;Asia/Yekaterinburg;57.1522;65.5272;850000
tolyatti;Tolyatti;Тольятти;в Тольятти;RU;Europe/Samara;53.5078;49.4204;680000
barnaul;Barnaul;Барнаул;в Барнауле;RU;Asia/Barnaul;53.3548;83.7698;630000
izhevsk;Izhevsk;Ижевск;в Ижевске;RU;Europe/Samara;56.8527;53.2114;630000
makhachkala;Makhachkala;Махачкала;в Махачкале;RU;Europe/Moscow;42.9849;47.5047;620000
khabarovsk;Khabarovsk;Хабаровск;в Хабаровске;RU;Asia/Vladivostok;48.4802;135.0719;620000
ulyanovsk;Ulyanovsk;Ульяновск;в Ульяновске;RU;Europe/Ulyanovsk;54.3142;48.4031;620000
irkutsk;Irkutsk;Иркутск;в Иркутске;RU;Asia/Irkutsk;52.2870;104.3050;610000
vladivostok;Vladivostok;Владивосток;во Владивостоке;RU;Asia/Vladivostok;43.1155;131.8855;600000
yaroslavl;Yaroslavl;Ярославль;в Ярославле;RU;Europe/Moscow;57.6261;39.8845;570000
tomsk;Tomsk;Томск;в Томске;RU;Asia/Tomsk;56.4847;84.9482;570000
stavropol;Stavropol;Ставрополь;в Ставрополе;RU;Europe/Moscow;45.0428;41.9734;550000
kemerovo;Kemerovo;Кемерово;в Кемерово;RU;Asia/Novokuznetsk;55.3547;86.0873;550000
naberezhnye-chelny;Naberezhnye Chelny;Набережные Челны;в Набережных Челнах;RU;Europe/Moscow;55.7436;52.3958;550000
orenburg;Orenburg;Оренбург;в Оренбурге;RU;Asia/Yekaterinburg;51.7682;55.0969;550000
novokuznetsk;Novokuznetsk;Новокузнецк;в Новокузнецке;RU;Asia/Novokuznetsk;53.7596;87.1216;540000
ryazan;Ryazan;Рязань;в Рязани;RU;Europe/Moscow;54.6292;39.7359;530000
balashikha;Balashikha;Балашиха;в Балашихе;RU;Europe/Moscow;55.7963;37.9382;520000
penza;Penza;Пенза;в Пензе;RU;Europe/Moscow;53.1959;45.0183;500000
lipetsk;Lipetsk;Липецк;в Липецке;RU;Europe/Moscow;52.6088;39.5992;500000
cheboksary;Cheboksary;Чебоксары;в Чебоксарах;RU;Europe/Moscow;56.1439;47.2489;490000
kaliningrad;Kaliningrad;Калининград;в Калининграде;RU;Europe/Kaliningrad;54.7104;20.4522;490000
astrakhan;Astrakhan;Астрахань;в Астрахани;RU;Europe/Astrakhan;46.3479;48.0336;470000
kirov;Kirov;Киров;в Кирове;RU;Europe/Kirov;58.6036;49.6680;470000
tula;Tula;Тула;в Туле;RU;Europe/Moscow;54.1931;37.6177;470000
sochi;Sochi;Сочи;в Сочи;RU;Europe/Moscow;43.5855;39.7231;470000
kursk;Kursk;Курск;в Курске;RU;Europe/Moscow;51.7373;36.1874;440000
ulan-ude;Ulan-Ude;Улан-Удэ;в Улан-Удэ;RU;Asia/Irkutsk;51.8335;107.5841;440000
tver;Tver;Тверь;в Твери;RU;Europe/Moscow;56.8587;35.9176;410000
magnitogorsk;Magnitogorsk;Магнитогорск;в Магнитогорске;RU;Asia/Yekaterinburg;53.4072;58.9791;410000
surgut;Surgut;Сургут;в Сургуте;RU;Asia/Yekaterinburg;61.2540;73.3962;400000
bryansk;Bryansk;Брянск;в Брянске;RU;Europe/Moscow;53.2521;34.3717;380000
ivanovo;Ivanovo;Иваново;в Иваново;RU;Europe/Moscow;56.9994;40.9728;360000
yakutsk;Yakutsk;Якутск;в Якутске;RU;Asia/Yakutsk;62.0355;129.6755;360000
vladimir;Vladimir;Владимир;во Владимире;RU;Europe/Moscow;56.1290;40.4070;350000
chita;Chita;Чита;в Чите;RU;Asia/Chita;52.0340;113.4994;350000
belgorod;Belgorod;Белгород;в Белгороде;RU;Europe/Moscow;50.5997;36.5983;340000
nizhny-tagil;Nizhny Tagil;Нижний Тагил;в Нижнем Тагиле;RU;Asia/Yekaterinburg;57.9194;59.9650;340000
novorossiysk;Novorossiysk;Новороссийск;в Новороссийске;RU;Europe/Moscow;44.7235;37.7686;340000
kaluga;Kaluga;Калуга;в Калуге;RU;Europe/Moscow;54.5293;36.2754;330000
grozny;Grozny;Грозный;в Грозном;RU;Europe/Moscow;43.3180;45.6982;330000
volzhsky;Volzhsky;Волжский;в Волжском;RU;Europe/Volgograd;48.7858;44.7797;320000
smolensk;Smolensk;Смоленск;в Смоленске;RU;Europe/Moscow;54.7826;32.0453;310000
saransk;Saransk;Саранск;в Саранске;RU;Europe/Moscow;54.1874;45.1839;310000
vologda;Vologda;Вологда;в Вологде;RU;Europe/Moscow;59.2205;39.8915;310000
podolsk;Podolsk;Подольск;в Подольске;RU;Europe/Moscow;55.4242;37.5547;310000
cherepovets;Cherepovets;Череповец;в Череповце;RU;Europe/Moscow;59.1270;37.9090;300000
arkhangelsk;Arkhangelsk;Архангельск;в Архангельске;RU;Europe/Moscow;64.5393;40.5170;300000
kurgan;Kurgan;Курган;в Кургане;RU;Asia/Yekaterinburg;55.4410;65.3411;300000
oryol;Oryol;Орёл;в Орле;RU;Europe/Moscow;52.9703;36.0635;300000
vladikavkaz;Vladikavkaz;Владикавказ;во Владикавказе;RU;Europe/Moscow;43.0205;44.6819;300000
tambov;Tambov;Тамбов;в Тамбове;RU;Europe/Moscow;52.7212;41.4523;280000
petrozavodsk;Petrozavodsk;Петрозаводск;в Петрозаводске;RU;Europe/Moscow;61.7849;34.3469;280000
yoshkar-ola;Yoshkar-Ola;Йошкар-Ола;в Йошкар-Оле;RU;Europe/Moscow;56.6344;47.8999;280000
nizhnevartovsk;Nizhnevartovsk;Нижневартовск;в Нижневартовске;RU;Asia/Yekaterinburg;60.9344;76.5531;280000
sterlitamak;Sterlitamak;Стерлитамак;в Стерлитамаке;RU;Asia/Yekaterinburg;53.6300;55.9500;280000
murmansk;Murmansk;Мурманск;в Мурманске;RU;Europe/Moscow;68.9585;33.0827;270000
kostroma;Kostroma;Кострома;в Костроме;RU;Europe/Moscow;57.7678;40.9269;270000
khimki;Khimki;Химки;в Химках;RU;Europe/Moscow;55.8970;37.4297;260000
taganrog;Taganrog;Таганрог;в Таганроге;RU;Europe/Moscow;47.2362;38.8969;250000
syktyvkar;Syktyvkar;Сыктывкар;в Сыктывкаре;RU;Europe/Moscow;61.6688;50.8364;250000
nalchik;Nalchik;Нальчик;в Нальчике;RU;Europe/Moscow;43.4853;43.6071;250000
blagoveshchensk;Blagoveshchensk;Благовещенск;в Благовещенске;RU;Asia/Yakutsk;50.2907;127.5272;240000
komsomolsk-on-amur;Komsomolsk-on-Amur;Комсомольск-на-Амуре;в Комсомольске-на-Амуре;RU;Asia/Vladivostok;50.5500;137.0000;240000
veliky-novgorod;Veliky Novgorod;Великий Новгород;в Великом Новгороде;RU;Europe/Moscow;58.5215;31.2755;220000
pskov;Pskov;Псков;в Пскове;RU;Europe/Moscow;57.8194;28.3318;200000
abakan;Abakan;Абакан;в Абакане;RU;Asia/Krasnoyarsk;53.7156;91.4292;185000
yuzhno-sakhalinsk;Yuzhno-Sakhalinsk;Южно-Сахалинск;в Южно-Сахалинске;RU;Asia/Sakhalin;46.9591;142.7380;180000
norilsk;Norilsk;Норильск;в Норильске;RU;Asia/Krasnoyarsk;69.3498;88.2010;180000
petropavlovsk-kamchatsky;Petropavlovsk-Kamchatsky;Петропавловск-Камчатский;в Петропавловске-Камчатском;RU;Asia/Kamchatka;53.0452;158.6483;165000
khanty-mansiysk;Khanty-Mansiysk;Ханты-Мансийск;в Ханты-Мансийске;RU;Asia/Yekaterinburg;61.0042;69.0019;105000
magadan;Magadan;Магадан;в Магадане;RU;Asia/Magadan;59.5682;150.8085;90000
anadyr;Anadyr;Анадырь;в Анадыре;RU;Asia/Anadyr;64.7337;177.5089;15000
# ───── Other CIS, Caucasus, Central Asia
kyiv;Kyiv;Киев;в Киеве;UA;Europe/Kyiv;50.4501;30.5234;2950000;1
kharkiv;Kharkiv;Харьков;в Харькове;UA;Europe/Kyiv;49.9935;36.2304;1420000
odesa;Odesa;Одесса;в Одессе;UA;Europe/Kyiv;46.4825;30.7233;1010000
dnipro;Dnipro;Днепр;в Днепре;UA;Europe/Kyiv;48.4647;35.0462;970000
lviv;Lviv;Львов;во Львове;UA;Europe/Kyiv;49.8397;24.0297;720000
zaporizhzhia;Zaporizhzhia;Запорожье;в Запорожье;UA;Europe/Kyiv;47.8388;35.1396;710000
minsk;Minsk;Минск;в Минске;BY;Europe/Minsk;53.9006;27.5590;2000000;1
gomel;Gomel;Гомель;в Гомеле;BY;Europe/Minsk;52.4412;30.9878;500000
vitebsk;Vitebsk;Витебск;в Витебске;BY;Europe/Minsk;55.1904;30.2049;360000
mogilev;Mogilev;Могилёв;в Могилёве;BY;Europe/Minsk;53.9007;30.3314;360000
grodno;Grodno;Гродно;в Гродно;BY;Europe/Minsk;53.6694;23.8131;360000
brest;Brest;Брест;в Бресте;BY;Europe/Minsk;52.0976;23.7341;340000
chisinau;Chisinau;Кишинёв;в Кишинёве;MD;Europe/Chisinau;47.0105;28.8638;640000;1
tashkent;Tashkent;Ташкент;в Ташкенте;UZ;Asia/Tashkent;41.2995;69.2401;3000000;1
namangan;Namangan;Наманган;в Намангане;UZ;Asia/Tashkent;40.9983;71.6726;650000
samarkand;Samarkand;Самарканд;в Самарканде;UZ;Asia/Samarkand;39.6542;66.9597;550000
andijan;Andijan;Андижан;в Андижане;UZ;Asia/Tashkent;40.7821;72.3442;450000
nukus;Nukus;Нукус;в Нукусе;UZ;Asia/Samarkand;42.4531;59.6103;330000
fergana;Fergana;Фергана;в Фергане;UZ;Asia/Tashkent;40.3864;71.7864;300000
bukhara;Bukhara;Бухара;в Бухаре;UZ;Asia/Samarkand;39.7747;64.4286;280000
bishkek;Bishkek;Бишкек;в Бишкеке;KG;Asia/Bishkek;42.8746;74.5698;1100000;1
osh;Osh;Ош;в Оше;KG;Asia/Bishkek;40.5140;72.8161;330000
dushanbe;Dushanbe;Душанбе;в Душанбе;TJ;Asia/Dushanbe;38.5598;68.7870;900000;1
khujand;Khujand;Худжанд;в Худжанде;TJ;Asia/Dushanbe;40.2826;69.6222;190000
ashgabat;Ashgabat;Ашхабад;в Ашхабаде;TM;Asia/Ashgabat;37.9601;58.3261;1000000;1
baku;Baku;Баку;в Баку;AZ;Asia/Baku;40.4093;49.8671;2300000;1
yerevan;Yerevan;Ереван;в Ереване;AM;Asia/Yerevan;40.1792;44.4991;1090000;1
tbilisi;Tbilisi;Тбилиси;в Тбилиси;GE;Asia/Tbilisi;41.7151;44.8271;1200000;1
batumi;Batumi;Батуми;в Батуми;GE;Asia/Tbilisi;41.6168;41.6367;170000
vilnius;Vilnius;Вильнюс;в Вильнюсе;LT;Europe/Vilnius;54.6872;25.2797;590000;1
riga;Riga;Рига;в Риге;LV;Europe/Riga;56.9496;24.1052;610000;1
tallinn;Tallinn;Таллин;в Таллине;EE;Europe/Tallinn;59.4370;24.7536;450000;1
# ───── Europe
london;London;Лондон;в Лондоне;GB;Europe/London;51.5074;-0.1278;8900000;1
birmingham;Birmingham;Бирмингем;в Бирмингеме;GB;Europe/London;52.4862;-1.8904;1150000
glasgow;Glasgow;Глазго;в Глазго;GB;Europe/London;55.8642;-4.2518;630000
manchester;Manchester;Манчестер;в Манчестере;GB;Europe/London;53.4808;-2.2426;550000
edinburgh;Edinburgh;Эдинбург;в Эдинбурге;GB;Europe/London;55.9533;-3.1883;520000
liverpool;Liverpool;Ливерпуль;в Ливерпуле;GB;Europe/London;53.4084;-2.9916;500000
dublin;Dublin;Дублин;в Дублине;IE;Europe/Dublin;53.3498;-6.2603;590000;1
paris;Paris;Париж;в Париже;FR;Europe/Paris;48.8566;2.3522;2100000;1
marseille;Marseille;Марсель;в Марселе;FR;Europe/Paris;43.2965;5.3698;870000
lyon;Lyon;Лион;в Лионе;FR;Europe/Paris;45.7640;4.8357;520000
toulouse;Toulouse;Тулуза;в Тулузе;FR;Europe/Paris;43.6047;1.4442;500000
nice;Nice;Ницца;в Ницце;FR;Europe/Paris;43.7102;7.2620;340000
berlin;Berlin;Берлин;в Берлине;DE;Europe/Berlin;52.5200;13.4050;3700000;1
hamburg;Hamburg;Гамбург;в Гамбурге;DE;Europe/Berlin;53.5511;9.9937;1900000
munich;Munich;Мюнхен;в Мюнхене;DE;Europe/Berlin;48.1351;11.5820;1500000
cologne;Cologne;Кёльн;в Кёльне;DE;Europe/Berlin;50.9375;6.9603;1080000
frankfurt;Frankfurt;Франкфурт-на-Майне;во Франкфурте-на-Майне;DE;Europe/Berlin;50.1109;8.6821;770000
stuttgart;Stuttgart;Штутгарт;в Штутгарте;DE;Europe/Berlin;48.7758;9.1829;630000
dusseldorf;Düsseldorf;Дюссельдорф;в Дюссельдорфе;DE;Europe/Berlin;51.2277;6.7735;620000
rome;Rome;Рим;в Риме;IT;Europe/Rome;41.9028;12.4964;2800000;1
milan;Milan;Милан;в Милане;IT;Europe/Rome;45.4642;9.1900;1370000
naples;Naples;Неаполь;в Неаполе;IT;Europe/Rome;40.8518;14.2681;920000
turin;Turin;Турин;в Турине;IT;Europe/Rome;45.0703;7.6869;850000
florence;Florence;Флоренция;во Флоренции;IT;Europe/Rome;43.7696;11.2558;360000
venice;Venice;Венеция;в Венеции;IT;Europe/Rome;45.4408;12.3155;250000
madrid;Madrid;Мадрид;в Мадриде;ES;Europe/Madrid;40.4168;-3.7038;3300000;1
barcelona;Barcelona;Барселона;в Барселоне;ES;Europe/Madrid;41.3874;2.1686;1620000
valencia;Valencia;Валенсия;в Валенсии;ES;Europe/Madrid;39.4699;-0.3763;800000
seville;Seville;Севилья;в Севилье;ES;Europe/Madrid;37.3891;-5.9845;680000
malaga;Málaga;Малага;в Малаге;ES;Europe/Madrid;36.7213;-4.4214;580000
palma;Palma;Пальма-де-Мальорка;в Пальме-де-Мальорке;ES;Europe/Madrid;39.5696;2.6502;420000
las-palmas;Las Palmas;Лас-Пальмас;в Лас-Пальмасе;ES;Atlantic/Canary;28.1235;-15.4363;380000
santa-cruz-de-tenerife;Santa Cruz de Tenerife;Санта-Крус-де-Тенерифе;в Санта-Крус-де-Тенерифе;ES;Atlantic/Canary;28.4636;-16.2518;210000
lisbon;Lisbon;Лиссабон;в Лиссабоне;PT;Europe/Lisbon;38.7223;-9.1393;550000;1
porto;Porto;Порту;в Порту;PT;Europe/Lisbon;41.1579;-8.6291;230000
funchal;Funchal;Фуншал;в Фуншале;PT;Atlantic/Madeira;32.6669;-16.9241;105000
ponta-delgada;Ponta Delgada;Понта-Делгада;в Понта-Делгаде;PT;Atlantic/Azores;37.7412;-25.6756;68000
amsterdam;Amsterdam;Амстердам;в Амстердаме;NL;Europe/Amsterdam;52.3676;4.9041;920000;1
rotterdam;Rotterdam;Роттердам;в Роттердаме;NL;Europe/Amsterdam;51.9244;4.4777;650000
brussels;Brussels;Брюссель;в Брюсселе;BE;Europe/Brussels;50.8503;4.3517;1200000;1
luxembourg;Luxembourg;Люксембург;в Люксембурге;LU;Europe/Luxembourg;49.6116;6.1319;130000;1
bern;Bern;Берн;в Берне;CH;Europe/Zurich;46.9480;7.4474;135000;1
zurich;Zurich;Цюрих;в Цюрихе;CH;Europe/Zurich;47.3769;8.5417;420000
geneva;Geneva;Женева;в Женеве;CH;Europe/Zurich;46.2044;6.1432;200000
vienna;Vienna;Вена;в Вене;AT;Europe/Vienna;48.2082;16.3738;2000000;1
prague;Prague;Прага;в Праге;CZ;Europe/Prague;50.0755;14.4378;1350000;1
karlovy-vary;Karlovy Vary;Карловы Вары;в Карловых Варах;CZ;Europe/Prague;50.2310;12.8710;48000
bratislava;Bratislava;Братислава;в Братиславе;SK;Europe/Bratislava;48.1486;17.1077;475000;1
warsaw;Warsaw;Варшава;в Варшаве;PL;Europe/Warsaw;52.2297;21.0122;1860000;1
krakow;Kraków;Краков;в Кракове;PL;Europe/Warsaw;50.0647;19.9450;800000
wroclaw;Wrocław;Вроцлав;во Вроцлаве;PL;Europe/Warsaw;51.1079;17.0385;670000
lodz;Łódź;Лодзь;в Лодзи;PL;Europe/Warsaw;51.7592;19.4560;660000
gdansk;Gdańsk;Гданьск;в Гданьске;PL;Europe/Warsaw;54.3520;18.6466;480000
budapest;Budapest;Будапешт;в Будапеште;HU;Europe/Budapest;47.4979;19.0402;1700000;1
bucharest;Bucharest;Бухарест;в Бухаресте;RO;Europe/Bucharest;44.4268;26.1025;1800000;1
sofia;Sofia;София;в Софии;BG;Europe/Sofia;42.6977;23.3219;1250000;1
varna;Varna;Варна;в Варне;BG;Europe/Sofia;43.2141;27.9147;330000
belgrade;Belgrade;Белград;в Белграде;RS;Europe/Belgrade;44.7866;20.4489;1380000;1
zagreb;Zagreb;Загреб;в Загребе;HR;Europe/Zagreb;45.8150;15.9819;770000;1
ljubljana;Ljubljana;Любляна;в Любляне;SI;Europe/Ljubljana;46.0569;14.5058;290000;1
sarajevo;Sarajevo;Сараево;в Сараево;BA;Europe/Sarajevo;43.8563;18.4131;275000;1
podgorica;Podgorica;Подгорица;в Подгорице;ME;Europe/Podgorica;42.4304;19.2594;190000;1
skopje;Skopje;Скопье;в Скопье;MK;Europe/Skopje;41.9981;21.4254;530000;1
tirana;Tirana;Тирана;в Тиране;AL;Europe/Tirane;41.3275;19.8187;560000;1
pristina;Pristina;Приштина;в Приштине;XK;Europe/Belgrade;42.6629;21.1655;220000;1
athens;Athens;Афины;в Афинах;GR;Europe/Athens;37.9838;23.7275;3150000;1
thessaloniki;Thessaloniki;Салоники;в Салониках;GR;Europe/Athens;40.6401;22.9444;320000
heraklion;Heraklion;Ираклион;в Ираклионе;GR;Europe/Athens;35.3387;25.1442;180000
nicosia;Nicosia;Никосия;в Никосии;CY;Asia/Nicosia;35.1856;33.3823;330000;1
limassol;Limassol;Лимасол;в Лимасоле;CY;Asia/Nicosia;34.7071;33.0226;240000
larnaca;Larnaca;Ларнака;в Ларнаке;CY;Asia/Nicosia;34.9003;33.6232;85000
valletta;Valletta;Валлетта;в Валлетте;MT;Europe/Malta;35.8989;14.5146;6000;1
monaco;Monaco;Монако;в Монако;MC;Europe/Monaco;43.7384;7.4246;39000;1
andorra-la-vella;Andorra la Vella;Андорра-ла-Велья;в Андорре-ла-Велье;AD;Europe/Andorra;42.5063;1.5218;23000;1
san-marino;San Marino;Сан-Марино;в Сан-Марино;SM;Europe/San_Marino;43.9356;12.4473;4000;1
vaduz;Vaduz;Вадуц;в Вадуце;LI;Europe/Vaduz;47.1410;9.5209;5700;1
vatican-city;Vatican City;Ватикан;в Ватикане;VA;Europe/Vatican;41.9029;12.4534;800;1
oslo;Oslo;Осло;в Осло;NO;Europe/Oslo;59.9139;10.7522;700000;1
stockholm;Stockholm;Стокгольм;в Стокгольме;SE;Europe/Stockholm;59.3293;18.0686;980000;1
copenhagen;Copenhagen;Копенгаген;в Копенгагене;DK;Europe/Copenhagen;55.6761;12.5683;650000;1
helsinki;Helsinki;Хельсинки;в Хельсинки;FI;Europe/Helsinki;60.1699;24.9384;660000;1
reykjavik;Reykjavík;Рейкьявик;в Рейкьявике;IS;Atlantic/Reykjavik;64.1466;-21.9426;140000;1
torshavn;Tórshavn;Торсхавн;в Торсхавне;FO;Atlantic/Faroe;62.0079;-6.7900;14000
gibraltar;Gibraltar;Гибралтар;в Гибралтаре;GI;Europe/Gibraltar;36.1408;-5.3536;34000
# ───── Türkiye
istanbul;Istanbul;Стамбул;в Стамбуле;TR;Europe/Istanbul;41.0082;28.9784;15600000
ankara;Ankara;Анкара;в Анкаре;TR;Europe/Istanbul;39.9334;32.8597;5700000;1
izmir;Izmir;Измир;в Измире;TR;Europe/Istanbul;38.4237;27.1428;4400000
bursa;Bursa;Бурса;в Бурсе;TR;Europe/Istanbul;40.1885;29.0610;3100000
antalya;Antalya;Анталья;в Анталье;TR;Europe/Istanbul;36.8969;30.7133;2600000
konya;Konya;Конья;в Конье;TR;Europe/Istanbul;37.8746;32.4932;2300000
adana;Adana;Адана;в Адане;TR;Europe/Istanbul;37.0000;35.3213;2270000
gaziantep;Gaziantep;Газиантеп;в Газиантепе;TR;Europe/Istanbul;37.0662;37.3833;2100000
mersin;Mersin;Мерсин;в Мерсине;TR;Europe/Istanbul;36.8121;34.6415;1900000
kayseri;Kayseri;Кайсери;в Кайсери;TR;Europe/Istanbul;38.7312;35.4787;1400000
diyarbakir;Diyarbakır;Диярбакыр;в Диярбакыре;TR;Europe/Istanbul;37.9144;40.2306;1100000
alanya;Alanya;Аланья;в Аланье;TR;Europe/Istanbul;36.5444;31.9954;350000
# ───── Middle East
dubai;Dubai;Дубай;в Дубае;AE;Asia/Dubai;25.2048;55.2708;3600000
abu-dhabi;Abu Dhabi;Абу-Даби;в Абу-Даби;AE;Asia/Dubai;24.4539;54.3773;1500000;1
sharjah;Sharjah;Шарджа;в Шардже;AE;Asia/Dubai;25.3463;55.4209;1800000
riyadh;Riyadh;Эр-Рияд;в Эр-Рияде;SA;Asia/Riyadh;24.7136;46.6753;7000000;1
jeddah;Jeddah;Джидда;в Джидде;SA;Asia/Riyadh;21.4858;39.1925;4700000
mecca;Mecca;Мекка;в Мекке;SA;Asia/Riyadh;21.3891;39.8579;2000000
medina;Medina;Медина;в Медине;SA;Asia/Riyadh;24.5247;39.5692;1400000
dammam;Dammam;Даммам;в Даммаме;SA;Asia/Riyadh;26.4207;50.0888;1300000
doha;Doha;Доха;в Дохе;QA;Asia/Qatar;25.2854;51.5310;1200000;1
kuwait-city;Kuwait City;Эль-Кувейт;в Эль-Кувейте;KW;Asia/Kuwait;29.3759;47.9774;3000000;1
manama;Manama;Манама;в Манаме;BH;Asia/Bahrain;26.2285;50.5860;200000;1
muscat;Muscat;Маскат;в Маскате;OM;Asia/Muscat;23.5880;58.3829;1400000;1
sanaa;Sanaa;Сана;в Сане;YE;Asia/Aden;15.3694;44.1910;3000000;1
aden;Aden;Аден;в Адене;YE;Asia/Aden;12.7855;45.0187;1000000
amman;Amman;Амман;в Аммане;JO;Asia/Amman;31.9454;35.9284;4000000;1
damascus;Damascus;Дамаск;в Дамаске;SY;Asia/Damascus;33.5138;36.2765;2500000;1
aleppo;Aleppo;Алеппо;в Алеппо;SY;Asia/Damascus;36.2021;37.1343;2000000
beirut;Beirut;Бейрут;в Бейруте;LB;Asia/Beirut;33.8938;35.5018;2400000;1
jerusalem;Jerusalem;Иерусалим;в Иерусалиме;IL;Asia/Jerusalem;31.7683;35.2137;980000
tel-aviv;Tel Aviv;Тель-Авив;в Тель-Авиве;IL;Asia/Jerusalem;32.0853;34.7818;470000
haifa;Haifa;Хайфа;в Хайфе;IL;Asia/Jerusalem;32.7940;34.9896;290000
eilat;Eilat;Эйлат;в Эйлате;IL;Asia/Jerusalem;29.5577;34.9519;52000
gaza;Gaza;Газа;в Газе;PS;Asia/Gaza;31.5017;34.4668;600000
ramallah;Ramallah;Рамалла;в Рамалле;PS;Asia/Hebron;31.9038;35.2034;40000
baghdad;Baghdad;Багдад;в Багдаде;IQ;Asia/Baghdad;33.3152;44.3661;7500000;1
mosul;Mosul;Мосул;в Мосуле;IQ;Asia/Baghdad;36.3350;43.1189;1700000
basra;Basra;Басра;в Басре;IQ;Asia/Baghdad;30.5085;47.7804;1400000
erbil;Erbil;Эрбиль;в Эрбиле;IQ;Asia/Baghdad;36.1911;44.0092;1000000
tehran;Tehran;Тегеран;в Тегеране;IR;Asia/Tehran;35.6892;51.3890;9000000;1
mashhad;Mashhad;Мешхед;в Мешхеде;IR;Asia/Tehran;36.2605;59.6168;3300000
isfahan;Isfahan;Исфахан;в Исфахане;IR;Asia/Tehran;32.6546;51.6680;2200000
karaj;Karaj;Карадж;в Карадже;IR;Asia/Tehran;35.8400;50.9391;1900000
shiraz;Shiraz;Шираз;в Ширазе;IR;Asia/Tehran;29.5918;52.5837;1600000
tabriz;Tabriz;Тебриз;в Тебризе;IR;Asia/Tehran;38.0800;46.2919;1600000
qom;Qom;Кум;в Куме;IR;Asia/Tehran;34.6399;50.8759;1300000
ahvaz;Ahvaz;Ахваз;в Ахвазе;IR;Asia/Tehran;31.3183;48.6706;1200000
kabul;Kabul;Кабул;в Кабуле;AF;Asia/Kabul;34.5553;69.2075;4600000;1
# ───── South Asia
karachi;Karachi;Карачи;в Карачи;PK;Asia/Karachi;24.8607;67.0011;16000000
lahore;Lahore;Лахор;в Лахоре;PK;Asia/Karachi;31.5204;74.3587;13000000
faisalabad;Faisalabad;Фейсалабад;в Фейсалабаде;PK;Asia/Karachi;31.4504;73.1350;3200000
rawalpindi;Rawalpindi;Равалпинди;в Равалпинди;PK;Asia/Karachi;33.5651;73.0169;2100000
gujranwala;Gujranwala;Гуджранвала;в Гуджранвале;PK;Asia/Karachi;32.1877;74.1945;2000000
peshawar;Peshawar;Пешавар;в Пешаваре;PK;Asia/Karachi;34.0151;71.5249;2000000
multan;Multan;Мултан;в Мултане;PK;Asia/Karachi;30.1575;71.5249;1900000
hyderabad-pakistan;Hyderabad;Хайдарабад;в Хайдарабаде;PK;Asia/Karachi;25.3960;68.3578;1700000
islamabad;Islamabad;Исламабад;в Исламабаде;PK;Asia/Karachi;33.6844;73.0479;1200000;1
quetta;Quetta;Кветта;в Кветте;PK;Asia/Karachi;30.1798;66.9750;1000000
delhi;Delhi;Дели;в Дели;IN;Asia/Kolkata;28.7041;77.1025;16800000
mumbai;Mumbai;Мумбаи;в Мумбаи;IN;Asia/Kolkata;19.0760;72.8777;12500000
bangalore;Bengaluru;Бангалор;в Бангалоре;IN;Asia/Kolkata;12.9716;77.5946;8400000
hyderabad;Hyderabad;Хайдарабад;в Хайдарабаде;IN;Asia/Kolkata;17.3850;78.4867;6800000
ahmedabad;Ahmedabad;Ахмадабад;в Ахмадабаде;IN;Asia/Kolkata;23.0225;72.5714;5600000
chennai;Chennai;Ченнай;в Ченнае;IN;Asia/Kolkata;13.0827;80.2707;4700000
kolkata;Kolkata;Калькутта;в Калькутте;IN;Asia/Kolkata;22.5726;88.3639;4500000
surat;Surat;Сурат;в Сурате;IN;Asia/Kolkata;21.1702;72.8311;4500000
pune;Pune;Пуна;в Пуне;IN;Asia/Kolkata;18.5204;73.8567;3100000
jaipur;Jaipur;Джайпур;в Джайпуре;IN;Asia/Kolkata;26.9124;75.7873;3000000
lucknow;Lucknow;Лакхнау;в Лакхнау;IN;Asia/Kolkata;26.8467;80.9462;2800000
kanpur;Kanpur;Канпур;в Канпуре;IN;Asia/Kolkata;26.4499;80.3319;2800000
nagpur;Nagpur;Нагпур;в Нагпуре;IN;Asia/Kolkata;21.1458;79.0882;2400000
indore;Indore;Индаур;в Индауре;IN;Asia/Kolkata;22.7196;75.8577;2000000
visakhapatnam;Visakhapatnam;Вишакхапатнам;в Вишакхапатнаме;IN;Asia/Kolkata;17.6868;83.2185;2000000
bhopal;Bhopal;Бхопал;в Бхопале;IN;Asia/Kolkata;23.2599;77.4126;1800000
patna;Patna;Патна;в Патне;IN;Asia/Kolkata;25.5941;85.1376;1700000
agra;Agra;Агра;в Агре;IN;Asia/Kolkata;27.1767;78.0081;1600000
varanasi;Varanasi;Варанаси;в Варанаси;IN;Asia/Kolkata;25.3176;82.9739;1200000
chandigarh;Chandigarh;Чандигарх;в Чандигархе;IN;Asia/Kolkata;30.7333;76.7794;1100000
new-delhi;New Delhi;Нью-Дели;в Нью-Дели;IN;Asia/Kolkata;28.6139;77.2090;250000;1
goa;Goa;Гоа;в Гоа;IN;Asia/Kolkata;15.4909;73.8278;1500000
kathmandu;Kathmandu;Катманду;в Катманду;NP;Asia/Kathmandu;27.7172;85.3240;1000000;1
thimphu;Thimphu;Тхимпху;в Тхимпху;BT;Asia/Thimphu;27.4728;89.6390;115000;1
dhaka;Dhaka;Дакка;в Дакке;BD;Asia/Dhaka;23.8103;90.4125;10000000;1
chittagong;Chittagong;Читтагонг;в Читтагонге;BD;Asia/Dhaka;22.3569;91.7832;2600000
colombo;Colombo;Коломбо;в Коломбо;LK;Asia/Colombo;6.9271;79.8612;750000
male;Malé;Мале;в Мале;MV;Indian/Maldives;4.1755;73.5093;210000;1
# ───── China, Hong Kong, Macau, Taiwan, Mongolia
shanghai;Shanghai;Шанхай;в Шанхае;CN;Asia/Shanghai;31.2304;121.4737;24900000
beijing;Beijing;Пекин;в Пекине;CN;Asia/Shanghai;39.9042;116.4074;21500000;1
guangzhou;Guangzhou;Гуанчжоу;в Гуанчжоу;CN;Asia/Shanghai;23.1291;113.2644;18700000
shenzhen;Shenzhen;Шэньчжэнь;в Шэньчжэне;CN;Asia/Shanghai;22.5431;114.0579;17500000
chengdu;Chengdu;Чэнду;в Чэнду;CN;Asia/Shanghai;30.5728;104.0668;16300000
chongqing;Chongqing;Чунцин;в Чунцине;CN;Asia/Shanghai;29.5630;106.5516;16000000
tianjin;Tianjin;Тяньцзинь;в Тяньцзине;CN;Asia/Shanghai;39.3434;117.3616;13900000
xian;Xi'an;Сиань;в Сиане;CN;Asia/Shanghai;34.3416;108.9398;12900000
suzhou;Suzhou;Сучжоу;в Сучжоу;CN;Asia/Shanghai;31.2990;120.5853;12700000
zhengzhou;Zhengzhou;Чжэнчжоу;в Чжэнчжоу;CN;Asia/Shanghai;34.7466;113.6254;12600000
wuhan;Wuhan;Ухань;в Ухане;CN;Asia/Shanghai;30.5928;114.3055;12300000
hangzhou;Hangzhou;Ханчжоу;в Ханчжоу;CN;Asia/Shanghai;30.2741;120.1551;12200000
shijiazhuang;Shijiazhuang;Шицзячжуан;в Шицзячжуане;CN;Asia/Shanghai;38.0428;114.5149;11000000
dongguan;Dongguan;Дунгуань;в Дунгуане;CN;Asia/Shanghai;23.0207;113.7518;10500000
qingdao;Qingdao;Циндао;в Циндао;CN;Asia/Shanghai;36.0671;120.3826;10000000
harbin;Harbin;Харбин;в Харбине;CN;Asia/Shanghai;45.8038;126.5350;10000000
changsha;Changsha;Чанша;в Чанше;CN;Asia/Shanghai;28.2282;112.9388;10000000
wenzhou;Wenzhou;Вэньчжоу;в Вэньчжоу;CN;Asia/Shanghai;27.9938;120.6994;9600000
foshan;Foshan;Фошань;в Фошане;CN;Asia/Shanghai;23.0215;113.1214;9500000
hefei;Hefei;Хэфэй;в Хэфэе;CN;Asia/Shanghai;31.8206;117.2272;9400000
ningbo;Ningbo;Нинбо;в Нинбо;CN;Asia/Shanghai;29.8683;121.5440;9400000
nanjing;Nanjing;Нанкин;в Нанкине;CN;Asia/Shanghai;32.0603;118.7969;9300000
jinan;Jinan;Цзинань;в Цзинане;CN;Asia/Shanghai;36.6512;117.1201;9200000
shenyang;Shenyang;Шэньян;в Шэньяне;CN;Asia/Shanghai;41.8057;123.4315;9100000
changchun;Changchun;Чанчунь;в Чанчуне;CN;Asia/Shanghai;43.8171;125.3235;9000000
nanning;Nanning;Наньнин;в Наньнине;CN;Asia/Shanghai;22.8170;108.3665;8700000
kunming;Kunming;Куньмин;в Куньмине;CN;Asia/Shanghai;25.0389;102.7183;8500000
fuzhou;Fuzhou;Фучжоу;в Фучжоу;CN;Asia/Shanghai;26.0745;119.2965;8300000
dalian;Dalian;Далянь;в Даляне;CN;Asia/Shanghai;38.9140;121.6147;7500000
wuxi;Wuxi;Уси;в Уси;CN;Asia/Shanghai;31.4912;120.3119;7500000
nanchang;Nanchang;Наньчан;в Наньчане;CN;Asia/Shanghai;28.6820;115.8579;6300000
guiyang;Guiyang;Гуйян;в Гуйяне;CN;Asia/Shanghai;26.6470;106.6302;6000000
taiyuan;Taiyuan;Тайюань;в Тайюане;CN;Asia/Shanghai;37.8706;112.5489;5300000
xiamen;Xiamen;Сямынь;в Сямыне;CN;Asia/Shanghai;24.4798;118.0894;5200000
lanzhou;Lanzhou;Ланьчжоу;в Ланьчжоу;CN;Asia/Shanghai;36.0611;103.8343;4300000
urumqi;Ürümqi;Урумчи;в Урумчи;CN;Asia/Shanghai;43.8256;87.6168;4000000
hohhot;Hohhot;Хух-Хото;в Хух-Хото;CN;Asia/Shanghai;40.8424;111.7490;3400000
haikou;Haikou;Хайкоу;в Хайкоу;CN;Asia/Shanghai;20.0440;110.1999;2900000
yinchuan;Yinchuan;Иньчуань;в Иньчуане;CN;Asia/Shanghai;38.4872;106.2309;2800000
xining;Xining;Синин;в Синине;CN;Asia/Shanghai;36.6171;101.7782;2500000
sanya;Sanya;Санья;в Санье;CN;Asia/Shanghai;18.2528;109.5120;1000000
lhasa;Lhasa;Лхаса;в Лхасе;CN;Asia/Shanghai;29.6520;91.1721;860000
hong-kong;Hong Kong;Гонконг;в Гонконге;HK;Asia/Hong_Kong;22.3193;114.1694;7500000
macau;Macau;Макао;в Макао;MO;Asia/Macau;22.1987;113.5439;680000
taichung;Taichung;Тайчжун;в Тайчжуне;TW;Asia/Taipei;24.1477;120.6736;2800000
kaohsiung;Kaohsiung;Гаосюн;в Гаосюне;TW;Asia/Taipei;22.6273;120.3014;2700000
taipei;Taipei;Тайбэй;в Тайбэе;TW;Asia/Taipei;25.0330;121.5654;2600000
ulaanbaatar;Ulaanbaatar;Улан-Батор;в Улан-Баторе;MN;Asia/Ulaanbaatar;47.8864;106.9057;1600000;1
khovd;Khovd;Ховд;в Ховде;MN;Asia/Hovd;48.0056;91.6419;30000
# ───── Japan, Koreas
tokyo;Tokyo;Токио;в Токио;JP;Asia/Tokyo;35.6762;139.6503;14000000;1
yokohama;Yokohama;Иокогама;в Иокогаме;JP;Asia/Tokyo;35.4437;139.6380;3700000
osaka;Osaka;Осака;в Осаке;JP;Asia/Tokyo;34.6937;135.5023;2700000
nagoya;Nagoya;Нагоя;в Нагое;JP;Asia/Tokyo;35.1815;136.9066;2300000
sapporo;Sapporo;Саппоро;в Саппоро;JP;Asia/Tokyo;43.0618;141.3545;1970000
fukuoka;Fukuoka;Фукуока;в Фукуоке;JP;Asia/Tokyo;33.5904;130.4017;1600000
kobe;Kobe;Кобе;в Кобе;JP;Asia/Tokyo;34.6901;135.1956;1500000
kawasaki;Kawasaki;Кавасаки;в Кавасаки;JP;Asia/Tokyo;35.5308;139.7029;1500000
kyoto;Kyoto;Киото;в Киото;JP;Asia/Tokyo;35.0116;135.7681;1460000
saitama;Saitama;Сайтама;в Сайтаме;JP;Asia/Tokyo;35.8617;139.6455;1300000
hiroshima;Hiroshima;Хиросима;в Хиросиме;JP;Asia/Tokyo;34.3853;132.4553;1200000
sendai;Sendai;Сендай;в Сендае;JP;Asia/Tokyo;38.2682;140.8694;1100000
seoul;Seoul;Сеул;в Сеуле;KR;Asia/Seoul;37.5665;126.9780;9700000;1
busan;Busan;Пусан;в Пусане;KR;Asia/Seoul;35.1796;129.0756;3400000
incheon;Incheon;Инчхон;в Инчхоне;KR;Asia/Seoul;37.4563;126.7052;2900000
daegu;Daegu;Тэгу;в Тэгу;KR;Asia/Seoul;35.8714;128.6014;2400000
daejeon;Daejeon;Тэджон;в Тэджоне;KR;Asia/Seoul;36.3504;127.3845;1500000
gwangju;Gwangju;Кванджу;в Кванджу;KR;Asia/Seoul;35.1595;126.8526;1450000
suwon;Suwon;Сувон;в Сувоне;KR;Asia/Seoul;37.2636;127.0286;1200000
ulsan;Ulsan;Ульсан;в Ульсане;KR;Asia/Seoul;35.5384;129.3114;1100000
jeju;Jeju;Чеджу;в Чеджу;KR;Asia/Seoul;33.4996;126.5312;490000
pyongyang;Pyongyang;Пхеньян;в Пхеньяне;KP;Asia/Pyongyang;39.0392;125.7625;2900000;1
# ───── Southeast Asia
bangkok;Bangkok;Бангкок;в Бангкоке;TH;Asia/Bangkok;13.7563;100.5018;10500000;1
chiang-mai;Chiang Mai;Чиангмай;в Чиангмае;TH;Asia/Bangkok;18.7883;98.9853;130000
pattaya;Pattaya;Паттайя;в Паттайе;TH;Asia/Bangkok;12.9236;100.8825;120000
phuket;Phuket;Пхукет;на Пхукете;TH;Asia/Bangkok;7.8804;98.3923;80000
koh-samui;Ko Samui;Самуи;на Самуи;TH;Asia/Bangkok;9.5120;100.0136;65000
ho-chi-minh-city;Ho Chi Minh City;Хошимин;в Хошимине;VN;Asia/Ho_Chi_Minh;10.8231;106.6297;9000000
hanoi;Hanoi;Ханой;в Ханое;VN;Asia/Ho_Chi_Minh;21.0278;105.8342;8000000;1
haiphong;Haiphong;Хайфон;в Хайфоне;VN;Asia/Ho_Chi_Minh;20.8449;106.6881;2000000
da-nang;Da Nang;Дананг;в Дананге;VN;Asia/Ho_Chi_Minh;16.0544;108.2022;1200000
nha-trang;Nha Trang;Нячанг;в Нячанге;VN;Asia/Ho_Chi_Minh;12.2388;109.1967;420000
phu-quoc;Phu Quoc;Фукуок;на Фукуоке;VN;Asia/Ho_Chi_Minh;10.2899;103.9840;180000
phnom-penh;Phnom Penh;Пномпень;в Пномпене;KH;Asia/Phnom_Penh;11.5564;104.9282;2200000;1
vientiane;Vientiane;Вьентьян;во Вьентьяне;LA;Asia/Vientiane;17.9757;102.6331;950000;1
yangon;Yangon;Янгон;в Янгоне;MM;Asia/Yangon;16.8661;96.1951;5600000
mandalay;Mandalay;Мандалай;в Мандалае;MM;Asia/Yangon;21.9588;96.0891;1300000
naypyidaw;Naypyidaw;Нейпьидо;в Нейпьидо;MM;Asia/Yangon;19.7633;96.0785;920000;1
kuala-lumpur;Kuala Lumpur;Куала-Лумпур;в Куала-Лумпуре;MY;Asia/Kuala_Lumpur;3.1390;101.6869;1900000;1
johor-bahru;Johor Bahru;Джохор-Бару;в Джохор-Бару;MY;Asia/Kuala_Lumpur;1.4927;103.7414;860000
kuching;Kuching;Кучинг;в Кучинге;MY;Asia/Kuching;1.5535;110.3593;570000
singapore;Singapore;Сингапур;в Сингапуре;SG;Asia/Singapore;1.3521;103.8198;5900000;1
jakarta;Jakarta;Джакарта;в Джакарте;ID;Asia/Jakarta;-6.2088;106.8456;10600000;1
surabaya;Surabaya;Сурабая;в Сурабае;ID;Asia/Jakarta;-7.2575;112.7521;2900000
bandung;Bandung;Бандунг;в Бандунге;ID;Asia/Jakarta;-6.9175;107.6191;2500000
medan;Medan;Медан;в Медане;ID;Asia/Jakarta;3.5952;98.6722;2400000
palembang;Palembang;Палембанг;в Палембанге;ID;Asia/Jakarta;-2.9761;104.7754;1700000
semarang;Semarang;Семаранг;в Семаранге;ID;Asia/Jakarta;-6.9667;110.4167;1650000
makassar;Makassar;Макасар;в Макасаре;ID;Asia/Makassar;-5.1477;119.4327;1500000
bali;Bali;Бали;на Бали;ID;Asia/Makassar;-8.6500;115.2167;4300000
jayapura;Jayapura;Джаяпура;в Джаяпуре;ID;Asia/Jayapura;-2.5337;140.7181;400000
quezon-city;Quezon City;Кесон-Сити;в Кесон-Сити;PH;Asia/Manila;14.6760;121.0437;2960000
manila;Manila;Манила;в Маниле;PH;Asia/Manila;14.5995;120.9842;1850000;1
davao;Davao;Давао;в Давао;PH;Asia/Manila;7.1907;125.4553;1800000
cebu;Cebu;Себу;в Себу;PH;Asia/Manila;10.3157;123.8854;960000
bandar-seri-begawan;Bandar Seri Begawan;Бандар-Сери-Бегаван;в Бандар-Сери-Бегаване;BN;Asia/Brunei;4.9031;114.9398;100000;1
dili;Dili;Дили;в Дили;TL;Asia/Dili;-8.5569;125.5603;280000;1
# ───── Oceania
sydney;Sydney;Сидней;в Сиднее;AU;Australia/Sydney;-33.8688;151.2093;5300000
melbourne;Melbourne;Мельбурн;в Мельбурне;AU;Australia/Melbourne;-37.8136;144.9631;5100000
brisbane;Brisbane;Брисбен;в Брисбене;AU;Australia/Brisbane;-27.4698;153.0251;2600000
perth;Perth;Перт;в Перте;AU;Australia/Perth;-31.9505;115.8605;2100000
adelaide;Adelaide;Аделаида;в Аделаиде;AU;Australia/Adelaide;-34.9285;138.6007;1400000
gold-coast;Gold Coast;Голд-Кост;в Голд-Косте;AU;Australia/Brisbane;-28.0167;153.4000;700000
canberra;Canberra;Канберра;в Канберре;AU;Australia/Sydney;-35.2809;149.1300;460000;1
hobart;Hobart;Хобарт;в Хобарте;AU;Australia/Hobart;-42.8821;147.3272;250000
darwin;Darwin;Дарвин;в Дарвине;AU;Australia/Darwin;-12.4634;130.8456;150000
auckland;Auckland;Окленд;в Окленде;NZ;Pacific/Auckland;-36.8485;174.7633;1700000
christchurch;Christchurch;Крайстчерч;в Крайстчерче;NZ;Pacific/Auckland;-43.5321;172.6362;390000
wellington;Wellington;Веллингтон;в Веллингтоне;NZ;Pacific/Auckland;-41.2865;174.7762;215000;1
port-moresby;Port Moresby;Порт-Морсби;в Порт-Морсби;PG;Pacific/Port_Moresby;-9.4438;147.1803;380000;1
suva;Suva;Сува;в Суве;FJ;Pacific/Fiji;-18.1248;178.4501;93000;1
honiara;Honiara;Хониара;в Хониаре;SB;Pacific/Guadalcanal;-9.4456;159.9729;85000;1
port-vila;Port Vila;Порт-Вила;в Порт-Виле;VU;Pacific/Efate;-17.7334;168.3273;51000;1
apia;Apia;Апиа;в Апиа;WS;Pacific/Apia;-13.8506;-171.7513;37000;1
nukualofa;Nukuʻalofa;Нукуалофа;в Нукуалофе;TO;Pacific/Tongatapu;-21.1394;-175.2049;23000;1
south-tarawa;South Tarawa;Южная Тарава;в Южной Тараве;KI;Pacific/Tarawa;1.3290;172.9790;63000;1
kiritimati;Kiritimati;Киритимати;на Киритимати;KI;Pacific/Kiritimati;1.8721;-157.4278;7000
funafuti;Funafuti;Фунафути;в Фунафути;TV;Pacific/Funafuti;-8.5211;179.1983;6000;1
yaren;Yaren;Ярен;в Ярене;NR;Pacific/Nauru;-0.5477;166.9209;1000;1
ngerulmud;Ngerulmud;Нгерулмуд;в Нгерулмуде;PW;Pacific/Palau;7.5006;134.6243;300;1
majuro;Majuro;Маджуро;в Маджуро;MH;Pacific/Majuro;7.0897;171.3803;28000;1
palikir;Palikir;Паликир;в Паликире;FM;Pacific/Pohnpei;6.9248;158.1610;7000;1
noumea;Nouméa;Нумеа;в Нумеа;NC;Pacific/Noumea;-22.2758;166.4580;94000
papeete;Papeete;Папеэте;в Папеэте;PF;Pacific/Tahiti;-17.5516;-149.5585;26000
hagatna;Hagåtña;Хагатна;в Хагатне;GU;Pacific/Guam;13.4757;144.7489;1000
# ───── Africa
cairo;Cairo;Каир;в Каире;EG;Africa/Cairo;30.0444;31.2357;10000000;1
alexandria;Alexandria;Александрия;в Александрии;EG;Africa/Cairo;31.2001;29.9187;5400000
giza;Giza;Гиза;в Гизе;EG;Africa/Cairo;30.0131;31.2089;4400000
hurghada;Hurghada;Хургада;в Хургаде;EG;Africa/Cairo;27.2579;33.8116;250000
sharm-el-sheikh;Sharm El Sheikh;Шарм-эш-Шейх;в Шарм-эш-Шейхе;EG;Africa/Cairo;27.9158;34.3299;73000
tripoli;Tripoli;Триполи;в Триполи;LY;Africa/Tripoli;32.8872;13.1913;1200000;1
tunis;Tunis;Тунис;в Тунисе;TN;Africa/Tunis;36.8065;10.1815;700000;1
algiers;Algiers;Алжир;в Алжире;DZ;Africa/Algiers;36.7538;3.0588;3400000;1
oran;Oran;Оран;в Оране;DZ;Africa/Algiers;35.6969;-0.6331;850000
casablanca;Casablanca;Касабланка;в Касабланке;MA;Africa/Casablanca;33.5731;-7.5898;3400000
fes;Fez;Фес;в Фесе;MA;Africa/Casablanca;34.0181;-5.0078;1100000
tangier;Tangier;Танжер;в Танжере;MA;Africa/Casablanca;35.7595;-5.8340;950000
marrakesh;Marrakesh;Марракеш;в Марракеше;MA;Africa/Casablanca;31.6295;-7.9811;930000
rabat;Rabat;Рабат;в Рабате;MA;Africa/Casablanca;34.0209;-6.8416;580000;1
khartoum;Khartoum;Хартум;в Хартуме;SD;Africa/Khartoum;15.5007;32.5599;5300000;1
omdurman;Omdurman;Омдурман;в Омдурмане;SD;Africa/Khartoum;15.6445;32.4777;2800000
juba;Juba;Джуба;в Джубе;SS;Africa/Juba;4.8594;31.5713;500000;1
addis-ababa;Addis Ababa;Аддис-Абеба;в Аддис-Абебе;ET;Africa/Addis_Ababa;9.0320;38.7469;5200000;1
asmara;Asmara;Асмэра;в Асмэре;ER;Africa/Asmara;15.3229;38.9251;960000;1
djibouti;Djibouti;Джибути;в Джибути;DJ;Africa/Djibouti;11.5721;43.1456;600000;1
mogadishu;Mogadishu;Могадишо;в Могадишо;SO;Africa/Mogadishu;2.0469;45.3182;2600000;1
nairobi;Nairobi;Найроби;в Найроби;KE;Africa/Nairobi;-1.2921;36.8219;4400000;1
mombasa;Mombasa;Момбаса;в Момбасе;KE;Africa/Nairobi;-4.0435;39.6682;1200000
kampala;Kampala;Кампала;в Кампале;UG;Africa/Kampala;0.3476;32.5825;1700000;1
dar-es-salaam;Dar es Salaam;Дар-эс-Салам;в Дар-эс-Саламе;TZ;Africa/Dar_es_Salaam;-6.7924;39.2083;5400000
dodoma;Dodoma;Додома;в Додоме;TZ;Africa/Dar_es_Salaam;-6.1630;35.7516;410000;1
zanzibar;Zanzibar;Занзибар;на Занзибаре;TZ;Africa/Dar_es_Salaam;-6.1659;39.2026;220000
kigali;Kigali;Кигали;в Кигали;RW;Africa/Kigali;-1.9441;30.0619;1200000;1
bujumbura;Bujumbura;Бужумбура;в Бужумбуре;BI;Africa/Bujumbura;-3.3614;29.3599;1000000
gitega;Gitega;Гитега;в Гитеге;BI;Africa/Bujumbura;-3.4271;29.9246;135000;1
kinshasa;Kinshasa;Киншаса;в Киншасе;CD;Africa/Kinshasa;-4.4419;15.2663;16000000;1
lubumbashi;Lubumbashi;Лубумбаши;в Лубумбаши;CD;Africa/Lubumbashi;-11.6876;27.5026;2600000
mbuji-mayi;Mbuji-Mayi;Мбужи-Майи;в Мбужи-Майи;CD;Africa/Lubumbashi;-6.1360;23.5898;2600000
kananga;Kananga;Кананга;в Кананге;CD;Africa/Lubumbashi;-5.8962;22.4166;1300000
kisangani;Kisangani;Кисангани;в Кисангани;CD;Africa/Lubumbashi;0.5153;25.1910;1300000
brazzaville;Brazzaville;Браззавиль;в Браззавиле;CG;Africa/Brazzaville;-4.2634;15.2429;2400000;1
libreville;Libreville;Либревиль;в Либревиле;GA;Africa/Libreville;0.4162;9.4673;800000;1
malabo;Malabo;Малабо;в Малабо;GQ;Africa/Malabo;3.7504;8.7371;300000
yaounde;Yaoundé;Яунде;в Яунде;CM;Africa/Douala;3.8480;11.5021;4100000;1
douala;Douala;Дуала;в Дуале;CM;Africa/Douala;4.0511;9.7679;3900000
bangui;Bangui;Банги;в Банги;CF;Africa/Bangui;4.3947;18.5582;890000;1
ndjamena;N'Djamena;Нджамена;в Нджамене;TD;Africa/Ndjamena;12.1348;15.0557;1500000;1
lagos;Lagos;Лагос;в Лагосе;NG;Africa/Lagos;6.5244;3.3792;15400000
kano;Kano;Кано;в Кано;NG;Africa/Lagos;12.0022;8.5920;4100000
abuja;Abuja;Абуджа;в Абудже;NG;Africa/Lagos;9.0765;7.3986;3800000;1
ibadan;Ibadan;Ибадан;в Ибадане;NG;Africa/Lagos;7.3775;3.9470;3600000
port-harcourt;Port Harcourt;Порт-Харкорт;в Порт-Харкорте;NG;Africa/Lagos;4.8156;7.0498;3200000
benin-city;Benin City;Бенин-Сити;в Бенин-Сити;NG;Africa/Lagos;6.3350;5.6037;1800000
kaduna;Kaduna;Кадуна;в Кадуне;NG;Africa/Lagos;10.5105;7.4165;1600000
niamey;Niamey;Ниамей;в Ниамее;NE;Africa/Niamey;13.5116;2.1254;1300000;1
bamako;Bamako;Бамако;в Бамако;ML;Africa/Bamako;12.6392;-8.0029;2800000;1
ouagadougou;Ouagadougou;Уагадугу;в Уагадугу;BF;Africa/Ouagadougou;12.3714;-1.5197;2800000;1
dakar;Dakar;Дакар;в Дакаре;SN;Africa/Dakar;14.7167;-17.4677;1400000;1
banjul;Banjul;Банжул;в Банжуле;GM;Africa/Banjul;13.4549;-16.5790;31000;1
bissau;Bissau;Бисау;в Бисау;GW;Africa/Bissau;11.8817;-15.6178;490000;1
conakry;Conakry;Конакри;в Конакри;GN;Africa/Conakry;9.6412;-13.5784;2000000;1
freetown;Freetown;Фритаун;во Фритауне;SL;Africa/Freetown;8.4657;-13.2317;1200000;1
monrovia;Monrovia;Монровия;в Монровии;LR;Africa/Monrovia;6.3156;-10.8074;1500000;1
abidjan;Abidjan;Абиджан;в Абиджане;CI;Africa/Abidjan;5.3600;-4.0083;5600000
yamoussoukro;Yamoussoukro;Ямусукро;в Ямусукро;CI;Africa/Abidjan;6.8276;-5.2893;360000;1
kumasi;Kumasi;Кумаси;в Кумаси;GH;Africa/Accra;6.6885;-1.6244;3500000
accra;Accra;Аккра;в Аккре;GH;Africa/Accra;5.6037;-0.1870;2500000;1
lome;Lomé;Ломе;в Ломе;TG;Africa/Lome;6.1375;1.2123;1800000;1
cotonou;Cotonou;Котону;в Котону;BJ;Africa/Porto-Novo;6.3703;2.3912;780000
porto-novo;Porto-Novo;Порто-Ново;в Порто-Ново;BJ;Africa/Porto-Novo;6.4969;2.6289;270000;1
nouakchott;Nouakchott;Нуакшот;в Нуакшоте;MR;Africa/Nouakchott;18.0735;-15.9582;1300000;1
praia;Praia;Прая;в Прае;CV;Atlantic/Cape_Verde;14.9330;-23.5133;160000;1
sao-tome;São Tomé;Сан-Томе;в Сан-Томе;ST;Africa/Sao_Tome;0.3365;6.7273;90000;1
luanda;Luanda;Луанда;в Луанде;AO;Africa/Luanda;-8.8390;13.2894;8300000;1
lusaka;Lusaka;Лусака;в Лусаке;ZM;Africa/Lusaka;-15.3875;28.3228;3000000;1
harare;Harare;Хараре;в Хараре;ZW;Africa/Harare;-17.8252;31.0335;2100000;1
lilongwe;Lilongwe;Лилонгве;в Лилонгве;MW;Africa/Blantyre;-13.9626;33.7741;1100000;1
maputo;Maputo;Мапуту;в Мапуту;MZ;Africa/Maputo;-25.9692;32.5732;1100000;1
antananarivo;Antananarivo;Антананариву;в Антананариву;MG;Indian/Antananarivo;-18.8792;47.5079;1300000;1
port-louis;Port Louis;Порт-Луи;в Порт-Луи;MU;Indian/Mauritius;-20.1609;57.5012;150000;1
victoria;Victoria;Виктория;в Виктории;SC;Indian/Mahe;-4.6191;55.4513;26000;1
moroni;Moroni;Морони;в Морони;KM;Indian/Comoro;-11.7172;43.2473;62000;1
saint-denis;Saint-Denis;Сен-Дени;в Сен-Дени;RE;Indian/Reunion;-20.8823;55.4504;150000
windhoek;Windhoek;Виндхук;в Виндхуке;NA;Africa/Windhoek;-22.5609;17.0658;430000;1
gaborone;Gaborone;Габороне;в Габороне;BW;Africa/Gaborone;-24.6282;25.9231;250000;1
johannesburg;Johannesburg;Йоханнесбург;в Йоханнесбурге;ZA;Africa/Johannesburg;-26.2041;28.0473;5600000
cape-town;Cape Town;Кейптаун;в Кейптауне;ZA;Africa/Johannesburg;-33.9249;18.4241;4700000
durban;Durban;Дурбан;в Дурбане;ZA;Africa/Johannesburg;-29.8587;31.0218;3700000
pretoria;Pretoria;Претория;в Претории;ZA;Africa/Johannesburg;-25.7479;28.2293;2500000;1
maseru;Maseru;Масеру;в Масеру;LS;Africa/Maseru;-29.3151;27.4869;330000;1
mbabane;Mbabane;Мбабане;в Мбабане;SZ;Africa/Mbabane;-26.3054;31.1367;95000;1
# ───── North America
new-york;New York;Нью-Йорк;в Нью-Йорке;US;America/New_York;40.7128;-74.0060;8300000
los-angeles;Los Angeles;Лос-Анджелес;в Лос-Анджелесе;US;America/Los_Angeles;34.0522;-118.2437;3900000
chicago;Chicago;Чикаго;в Чикаго;US;America/Chicago;41.8781;-87.6298;2700000
houston;Houston;Хьюстон;в Хьюстоне;US;America/Chicago;29.7604;-95.3698;2300000
phoenix;Phoenix;Финикс;в Финиксе;US;America/Phoenix;33.4484;-112.0740;1650000
philadelphia;Philadelphia;Филадельфия;в Филадельфии;US;America/New_York;39.9526;-75.1652;1570000
san-antonio;San Antonio;Сан-Антонио;в Сан-Антонио;US;America/Chicago;29.4241;-98.4936;1500000
san-diego;San Diego;Сан-Диего;в Сан-Диего;US;America/Los_Angeles;32.7157;-117.1611;1380000
dallas;Dallas;Даллас;в Далласе;US;America/Chicago;32.7767;-96.7970;1300000
austin;Austin;Остин;в Остине;US;America/Chicago;30.2672;-97.7431;980000
san-jose;San Jose;Сан-Хосе;в Сан-Хосе;US;America/Los_Angeles;37.3382;-121.8863;970000
indianapolis;Indianapolis;Индианаполис;в Индианаполисе;US;America/Indiana/Indianapolis;39.7684;-86.1581;880000
san-francisco;San Francisco;Сан-Франциско;в Сан-Франциско;US;America/Los_Angeles;37.7749;-122.4194;810000
seattle;Seattle;Сиэтл;в Сиэтле;US;America/Los_Angeles;47.6062;-122.3321;750000
denver;Denver;Денвер;в Денвере;US;America/Denver;39.7392;-104.9903;715000
nashville;Nashville;Нашвилл;в Нашвилле;US;America/Chicago;36.1627;-86.7816;690000
washington;Washington, D.C.;Вашингтон;в Вашингтоне;US;America/New_York;38.9072;-77.0369;690000;1
boston;Boston;Бостон;в Бостоне;US;America/New_York;42.3601;-71.0589;650000
las-vegas;Las Vegas;Лас-Вегас;в Лас-Вегасе;US;America/Los_Angeles;36.1699;-115.1398;650000
portland;Portland;Портленд;в Портленде;US;America/Los_Angeles;45.5152;-122.6784;640000
detroit;Detroit;Детройт;в Детройте;US;America/Detroit;42.3314;-83.0458;630000
louisville;Louisville;Луисвилл;в Луисвилле;US;America/Kentucky/Louisville;38.2527;-85.7585;620000
atlanta;Atlanta;Атланта;в Атланте;US;America/New_York;33.7490;-84.3880;500000
miami;Miami;Майами;в Майами;US;America/New_York;25.7617;-80.1918;450000
minneapolis;Minneapolis;Миннеаполис;в Миннеаполисе;US;America/Chicago;44.9778;-93.2650;430000
new-orleans;New Orleans;Новый Орлеан;в Новом Орлеане;US;America/Chicago;29.9511;-90.0715;380000
honolulu;Honolulu;Гонолулу;в Гонолулу;US;Pacific/Honolulu;21.3069;-157.8583;350000
orlando;Orlando;Орландо;в Орландо;US;America/New_York;28.5383;-81.3792;310000
anchorage;Anchorage;Анкоридж;в Анкоридже;US;America/Anchorage;61.2181;-149.9003;290000
boise;Boise;Бойсе;в Бойсе;US;America/Boise;43.6150;-116.2023;235000
salt-lake-city;Salt Lake City;Солт-Лейк-Сити;в Солт-Лейк-Сити;US;America/Denver;40.7608;-111.8910;200000
san-juan;San Juan;Сан-Хуан;в Сан-Хуане;PR;America/Puerto_Rico;18.4655;-66.1057;340000
toronto;Toronto;Торонто;в Торонто;CA;America/Toronto;43.6532;-79.3832;2800000
montreal;Montreal;Монреаль;в Монреале;CA;America/Toronto;45.5017;-73.5673;1760000
calgary;Calgary;Калгари;в Калгари;CA;America/Edmonton;51.0447;-114.0719;1300000
ottawa;Ottawa;Оттава;в Оттаве;CA;America/Toronto;45.4215;-75.6972;1000000;1
edmonton;Edmonton;Эдмонтон;в Эдмонтоне;CA;America/Edmonton;53.5461;-113.4938;1000000
winnipeg;Winnipeg;Виннипег;в Виннипеге;CA;America/Winnipeg;49.8951;-97.1384;750000
vancouver;Vancouver;Ванкувер;в Ванкувере;CA;America/Vancouver;49.2827;-123.1207;660000
quebec-city;Quebec City;Квебек;в Квебеке;CA;America/Toronto;46.8139;-71.2080;550000
halifax;Halifax;Галифакс;в Галифаксе;CA;America/Halifax;44.6488;-63.5752;440000
regina;Regina;Реджайна;в Реджайне;CA;America/Regina;50.4452;-104.6189;230000
st-johns;St. John's;Сент-Джонс;в Сент-Джонсе;CA;America/St_Johns;47.5615;-52.7126;110000
whitehorse;Whitehorse;Уайтхорс;в Уайтхорсе;CA;America/Whitehorse;60.7212;-135.0568;28000
nuuk;Nuuk;Нуук;в Нууке;GL;America/Nuuk;64.1814;-51.6941;19000
hamilton-bermuda;Hamilton;Гамильтон;в Гамильтоне;BM;Atlantic/Bermuda;32.2949;-64.7814;1000
mexico-city;Mexico City;Мехико;в Мехико;MX;America/Mexico_City;19.4326;-99.1332;9200000;1
tijuana;Tijuana;Тихуана;в Тихуане;MX;America/Tijuana;32.5149;-117.0382;1900000
puebla;Puebla;Пуэбла;в Пуэбле;MX;America/Mexico_City;19.0414;-98.2063;1700000
leon;León;Леон;в Леоне;MX;America/Mexico_City;21.1250;-101.6860;1700000
ciudad-juarez;Ciudad Juárez;Сьюдад-Хуарес;в Сьюдад-Хуаресе;MX;America/Ciudad_Juarez;31.6904;-106.4245;1500000
guadalajara;Guadalajara;Гвадалахара;в Гвадалахаре;MX;America/Mexico_City;20.6597;-103.3496;1400000
monterrey;Monterrey;Монтеррей;в Монтеррее;MX;America/Monterrey;25.6866;-100.3161;1100000
merida;Mérida;Мерида;в Мериде;MX;America/Merida;20.9674;-89.5926;990000
chihuahua;Chihuahua;Чиуауа;в Чиуауа;MX;America/Chihuahua;28.6320;-106.0691;940000
hermosillo;Hermosillo;Эрмосильо;в Эрмосильо;MX;America/Hermosillo;29.0729;-110.9559;930000
cancun;Cancún;Канкун;в Канкуне;MX;America/Cancun;21.1619;-86.8515;890000
mazatlan;Mazatlán;Масатлан;в Масатлане;MX;America/Mazatlan;23.2494;-106.4111;500000
guatemala-city;Guatemala City;Гватемала;в Гватемале;GT;America/Guatemala;14.6349;-90.5069;1000000;1
belmopan;Belmopan;Бельмопан;в Бельмопане;BZ;America/Belize;17.2510;-88.7590;25000;1
tegucigalpa;Tegucigalpa;Тегусигальпа;в Тегусигальпе;HN;America/Tegucigalpa;14.0723;-87.1921;1200000;1
san-salvador;San Salvador;Сан-Сальвадор;в Сан-Сальвадоре;SV;America/El_Salvador;13.6929;-89.2182;570000;1
managua;Managua;Манагуа;в Манагуа;NI;America/Managua;12.1140;-86.2362;1050000;1
san-jose-costa-rica;San José;Сан-Хосе;в Сан-Хосе;CR;America/Costa_Rica;9.9281;-84.0907;340000;1
panama-city;Panama City;Панама;в Панаме;PA;America/Panama;8.9824;-79.5199;880000;1
havana;Havana;Гавана;в Гаване;CU;America/Havana;23.1136;-82.3666;2100000;1
varadero;Varadero;Варадеро;в Варадеро;CU;America/Havana;23.1540;-81.2514;27000
kingston;Kingston;Кингстон;в Кингстоне;JM;America/Jamaica;18.0179;-76.8099;670000;1
port-au-prince;Port-au-Prince;Порт-о-Пренс;в Порт-о-Пренсе;HT;America/Port-au-Prince;18.5944;-72.3074;1200000;1
santo-domingo;Santo Domingo;Санто-Доминго;в Санто-Доминго;DO;America/Santo_Domingo;18.4861;-69.9312;3300000;1
punta-cana;Punta Cana;Пунта-Кана;в Пунта-Кане;DO;America/Santo_Domingo;18.5601;-68.3725;100000
nassau;Nassau;Нассау;в Нассау;BS;America/Nassau;25.0443;-77.3504;275000;1
bridgetown;Bridgetown;Бриджтаун;в Бриджтауне;BB;America/Barbados;13.0975;-59.6167;110000;1
port-of-spain;Port of Spain;Порт-оф-Спейн;в Порт-оф-Спейне;TT;America/Port_of_Spain;10.6549;-61.5019;37000;1
st-georges;St. George's;Сент-Джорджес;в Сент-Джорджесе;GD;America/Grenada;12.0561;-61.7488;34000;1
castries;Castries;Кастри;в Кастри;LC;America/St_Lucia;14.0101;-60.9875;20000;1
kingstown;Kingstown;Кингстаун;в Кингстауне;VC;America/St_Vincent;13.1600;-61.2248;13000;1
st-johns-antigua;St. John's;Сент-Джонс;в Сент-Джонсе;AG;America/Antigua;17.1274;-61.8468;22000;1
basseterre;Basseterre;Бастер;в Бастере;KN;America/St_Kitts;17.3026;-62.7177;14000;1
roseau;Roseau;Розо;в Розо;DM;America/Dominica;15.3092;-61.3794;15000;1
# ───── South America
sao-paulo;São Paulo;Сан-Паулу;в Сан-Паулу;BR;America/Sao_Paulo;-23.5505;-46.6333;12300000
rio-de-janeiro;Rio de Janeiro;Рио-де-Жанейро;в Рио-де-Жанейро;BR;America/Sao_Paulo;-22.9068;-43.1729;6700000
brasilia;Brasília;Бразилиа;в Бразилиа;BR;America/Sao_Paulo;-15.7975;-47.8919;4800000;1
salvador;Salvador;Салвадор;в Салвадоре;BR;America/Bahia;-12.9777;-38.5016;2900000
fortaleza;Fortaleza;Форталеза;в Форталезе;BR;America/Fortaleza;-3.7319;-38.5267;2700000
belo-horizonte;Belo Horizonte;Белу-Оризонти;в Белу-Оризонти;BR;America/Sao_Paulo;-19.9167;-43.9345;2500000
manaus;Manaus;Манаус;в Манаусе;BR;America/Manaus;-3.1190;-60.0217;2200000
curitiba;Curitiba;Куритиба;в Куритибе;BR;America/Sao_Paulo;-25.4284;-49.2733;1900000
recife;Recife;Ресифи;в Ресифи;BR;America/Recife;-8.0476;-34.8770;1650000
goiania;Goiânia;Гояния;в Гоянии;BR;America/Sao_Paulo;-16.6869;-49.2648;1500000
belem;Belém;Белен;в Белене;BR;America/Belem;-1.4558;-48.4902;1500000
porto-alegre;Porto Alegre;Порту-Алегри;в Порту-Алегри;BR;America/Sao_Paulo;-30.0346;-51.2177;1400000
campinas;Campinas;Кампинас;в Кампинасе;BR;America/Sao_Paulo;-22.9099;-47.0626;1200000
sao-luis;São Luís;Сан-Луис;в Сан-Луисе;BR;America/Fortaleza;-2.5307;-44.3068;1100000
maceio;Maceió;Масейо;в Масейо;BR;America/Maceio;-9.6658;-35.7353;1000000
cuiaba;Cuiabá;Куяба;в Куябе;BR;America/Cuiaba;-15.6014;-56.0979;650000
rio-branco;Rio Branco;Риу-Бранку;в Риу-Бранку;BR;America/Rio_Branco;-9.9754;-67.8249;420000
buenos-aires;Buenos Aires;Буэнос-Айрес;в Буэнос-Айресе;AR;America/Argentina/Buenos_Aires;-34.6037;-58.3816;3100000;1
cordoba;Córdoba;Кордова;в Кордове;AR;America/Argentina/Cordoba;-31.4201;-64.1888;1500000
rosario;Rosario;Росарио;в Росарио;AR;America/Argentina/Cordoba;-32.9442;-60.6505;1300000
mendoza;Mendoza;Мендоса;в Мендосе;AR;America/Argentina/Mendoza;-32.8895;-68.8458;1000000
ushuaia;Ushuaia;Ушуая;в Ушуае;AR;America/Argentina/Ushuaia;-54.8019;-68.3030;80000
santiago;Santiago;Сантьяго;в Сантьяго;CL;America/Santiago;-33.4489;-70.6693;6300000;1
punta-arenas;Punta Arenas;Пунта-Аренас;в Пунта-Аренасе;CL;America/Punta_Arenas;-53.1638;-70.9171;130000
easter-island;Easter Island;Остров Пасхи;на острове Пасхи;CL;Pacific/Easter;-27.1500;-109.4333;8000
lima;Lima;Лима;в Лиме;PE;America/Lima;-12.0464;-77.0428;10000000;1
arequipa;Arequipa;Арекипа;в Арекипе;PE;America/Lima;-16.4090;-71.5375;1100000
cusco;Cusco;Куско;в Куско;PE;America/Lima;-13.5320;-71.9675;430000
bogota;Bogotá;Богота;в Боготе;CO;America/Bogota;4.7110;-74.0721;7900000;1
medellin;Medellín;Медельин;в Медельине;CO;America/Bogota;6.2442;-75.5812;2600000
cali;Cali;Кали;в Кали;CO;America/Bogota;3.4516;-76.5320;2200000
barranquilla;Barranquilla;Барранкилья;в Барранкилье;CO;America/Bogota;10.9685;-74.7813;1300000
cartagena;Cartagena;Картахена;в Картахене;CO;America/Bogota;10.3910;-75.4794;1000000
caracas;Caracas;Каракас;в Каракасе;VE;America/Caracas;10.4806;-66.9036;2100000;1
maracaibo;Maracaibo;Маракайбо;в Маракайбо;VE;America/Caracas;10.6545;-71.6389;1600000
valencia-venezuela;Valencia;Валенсия;в Валенсии;VE;America/Caracas;10.1620;-68.0077;1500000
guayaquil;Guayaquil;Гуаякиль;в Гуаякиле;EC;America/Guayaquil;-2.1710;-79.9224;2700000
quito;Quito;Кито;в Кито;EC;America/Guayaquil;-0.1807;-78.4678;2000000;1
santa-cruz;Santa Cruz de la Sierra;Санта-Крус-де-ла-Сьерра;в Санта-Крус-де-ла-Сьерре;BO;America/La_Paz;-17.8146;-63.1561;1700000
la-paz;La Paz;Ла-Пас;в Ла-Пасе;BO;America/La_Paz;-16.4897;-68.1193;800000;1
sucre;Sucre;Сукре;в Сукре;BO;America/La_Paz;-19.0196;-65.2619;300000;1
asuncion;Asunción;Асунсьон;в Асунсьоне;PY;America/Asuncion;-25.2637;-57.5759;520000;1
montevideo;Montevideo;Монтевидео;в Монтевидео;UY;America/Montevideo;-34.9011;-56.1645;1400000;1
georgetown;Georgetown;Джорджтаун;в Джорджтауне;GY;America/Guyana;6.8013;-58.1551;200000;1
paramaribo;Paramaribo;Парамарибо;в Парамарибо;SR;America/Paramaribo;5.8520;-55.2038;240000;1
`;

const COUNTRIES = `
AD;Andorra;Андорра;в Андорре;andorra-la-vella
AE;United Arab Emirates;ОАЭ;в ОАЭ;abu-dhabi
AF;Afghanistan;Афганистан;в Афганистане;kabul
AG;Antigua and Barbuda;Антигуа и Барбуда;в Антигуа и Барбуде;st-johns-antigua
AL;Albania;Албания;в Албании;tirana
AM;Armenia;Армения;в Армении;yerevan
AO;Angola;Ангола;в Анголе;luanda
AR;Argentina;Аргентина;в Аргентине;buenos-aires
AT;Austria;Австрия;в Австрии;vienna
AU;Australia;Австралия;в Австралии;canberra
AZ;Azerbaijan;Азербайджан;в Азербайджане;baku
BA;Bosnia and Herzegovina;Босния и Герцеговина;в Боснии и Герцеговине;sarajevo
BB;Barbados;Барбадос;на Барбадосе;bridgetown
BD;Bangladesh;Бангладеш;в Бангладеш;dhaka
BE;Belgium;Бельгия;в Бельгии;brussels
BF;Burkina Faso;Буркина-Фасо;в Буркина-Фасо;ouagadougou
BG;Bulgaria;Болгария;в Болгарии;sofia
BH;Bahrain;Бахрейн;в Бахрейне;manama
BI;Burundi;Бурунди;в Бурунди;gitega
BJ;Benin;Бенин;в Бенине;porto-novo
BM;Bermuda;Бермудские Острова;на Бермудских Островах;hamilton-bermuda
BN;Brunei;Бруней;в Брунее;bandar-seri-begawan
BO;Bolivia;Боливия;в Боливии;la-paz
BR;Brazil;Бразилия;в Бразилии;brasilia
BS;Bahamas;Багамские Острова;на Багамских Островах;nassau
BT;Bhutan;Бутан;в Бутане;thimphu
BW;Botswana;Ботсвана;в Ботсване;gaborone
BY;Belarus;Беларусь;в Беларуси;minsk
BZ;Belize;Белиз;в Белизе;belmopan
CA;Canada;Канада;в Канаде;ottawa
CD;DR Congo;ДР Конго;в ДР Конго;kinshasa
CF;Central African Republic;ЦАР;в ЦАР;bangui
CG;Republic of the Congo;Республика Конго;в Республике Конго;brazzaville
CH;Switzerland;Швейцария;в Швейцарии;bern
CI;Côte d'Ivoire;Кот-д’Ивуар;в Кот-д’Ивуаре;yamoussoukro
CL;Chile;Чили;в Чили;santiago
CM;Cameroon;Камерун;в Камеруне;yaounde
CN;China;Китай;в Китае;beijing
CO;Colombia;Колумбия;в Колумбии;bogota
CR;Costa Rica;Коста-Рика;в Коста-Рике;san-jose-costa-rica
CU;Cuba;Куба;на Кубе;havana
CV;Cape Verde;Кабо-Верде;в Кабо-Верде;praia
CY;Cyprus;Кипр;на Кипре;nicosia
CZ;Czechia;Чехия;в Чехии;prague
DE;Germany;Германия;в Германии;berlin
DJ;Djibouti;Джибути;в Джибути;djibouti
DK;Denmark;Дания;в Дании;copenhagen
DM;Dominica;Доминика;в Доминике;roseau
DO;Dominican Republic;Доминиканская Республика;в Доминиканской Республике;santo-domingo
DZ;Algeria;Алжир;в Алжире;algiers
EC;Ecuador;Эквадор;в Эквадоре;quito
EE;Estonia;Эстония;в Эстонии;tallinn
EG;Egypt;Египет;в Египте;cairo
ER;Eritrea;Эритрея;в Эритрее;asmara
ES;Spain;Испания;в Испании;madrid
ET;Ethiopia;Эфиопия;в Эфиопии;addis-ababa
FI;Finland;Финляндия;в Финляндии;helsinki
FJ;Fiji;Фиджи;на Фиджи;suva
FM;Micronesia;Микронезия;в Микронезии;palikir
FO;Faroe Islands;Фарерские острова;на Фарерских островах;torshavn
FR;France;Франция;во Франции;paris
GA;Gabon;Габон;в Габоне;libreville
GB;United Kingdom;Великобритания;в Великобритании;london
GD;Grenada;Гренада;в Гренаде;st-georges
GE;Georgia;Грузия;в Грузии;tbilisi
GH;Ghana;Гана;в Гане;accra
GI;Gibraltar;Гибралтар;в Гибралтаре;gibraltar
GL;Greenland;Гренландия;в Гренландии;nuuk
GM;Gambia;Гамбия;в Гамбии;banjul
GN;Guinea;Гвинея;в Гвинее;conakry
GQ;Equatorial Guinea;Экваториальная Гвинея;в Экваториальной Гвинее;malabo
GR;Greece;Греция;в Греции;athens
GT;Guatemala;Гватемала;в Гватемале;guatemala-city
GU;Guam;Гуам;на Гуаме;hagatna
GW;Guinea-Bissau;Гвинея-Бисау;в Гвинее-Бисау;bissau
GY;Guyana;Гайана;в Гайане;georgetown
HK;Hong Kong;Гонконг;в Гонконге;hong-kong
HN;Honduras;Гондурас;в Гондурасе;tegucigalpa
HR;Croatia;Хорватия;в Хорватии;zagreb
HT;Haiti;Гаити;на Гаити;port-au-prince
HU;Hungary;Венгрия;в Венгрии;budapest
ID;Indonesia;Индонезия;в Индонезии;jakarta
IE;Ireland;Ирландия;в Ирландии;dublin
IL;Israel;Израиль;в Израиле;jerusalem
IN;India;Индия;в Индии;new-delhi
IQ;Iraq;Ирак;в Ираке;baghdad
IR;Iran;Иран;в Иране;tehran
IS;Iceland;Исландия;в Исландии;reykjavik
IT;Italy;Италия;в Италии;rome
JM;Jamaica;Ямайка;на Ямайке;kingston
JO;Jordan;Иордания;в Иордании;amman
JP;Japan;Япония;в Японии;tokyo
KE;Kenya;Кения;в Кении;nairobi
KG;Kyrgyzstan;Кыргызстан;в Кыргызстане;bishkek
KH;Cambodia;Камбоджа;в Камбодже;phnom-penh
KI;Kiribati;Кирибати;в Кирибати;south-tarawa
KM;Comoros;Коморы;на Коморах;moroni
KN;Saint Kitts and Nevis;Сент-Китс и Невис;в Сент-Китсе и Невисе;basseterre
KP;North Korea;Северная Корея;в Северной Корее;pyongyang
KR;South Korea;Южная Корея;в Южной Корее;seoul
KW;Kuwait;Кувейт;в Кувейте;kuwait-city
KZ;Kazakhstan;Казахстан;в Казахстане;astana
LA;Laos;Лаос;в Лаосе;vientiane
LB;Lebanon;Ливан;в Ливане;beirut
LC;Saint Lucia;Сент-Люсия;в Сент-Люсии;castries
LI;Liechtenstein;Лихтенштейн;в Лихтенштейне;vaduz
LK;Sri Lanka;Шри-Ланка;на Шри-Ланке;colombo
LR;Liberia;Либерия;в Либерии;monrovia
LS;Lesotho;Лесото;в Лесото;maseru
LT;Lithuania;Литва;в Литве;vilnius
LU;Luxembourg;Люксембург;в Люксембурге;luxembourg
LV;Latvia;Латвия;в Латвии;riga
LY;Libya;Ливия;в Ливии;tripoli
MA;Morocco;Марокко;в Марокко;rabat
MC;Monaco;Монако;в Монако;monaco
MD;Moldova;Молдова;в Молдове;chisinau
ME;Montenegro;Черногория;в Черногории;podgorica
MG;Madagascar;Мадагаскар;на Мадагаскаре;antananarivo
MH;Marshall Islands;Маршалловы Острова;на Маршалловых Островах;majuro
MK;North Macedonia;Северная Македония;в Северной Македонии;skopje
ML;Mali;Мали;в Мали;bamako
MM;Myanmar;Мьянма;в Мьянме;naypyidaw
MN;Mongolia;Монголия;в Монголии;ulaanbaatar
MO;Macau;Макао;в Макао;macau
MR;Mauritania;Мавритания;в Мавритании;nouakchott
MT;Malta;Мальта;на Мальте;valletta
MU;Mauritius;Маврикий;на Маврикии;port-louis
MV;Maldives;Мальдивы;на Мальдивах;male
MW;Malawi;Малави;в Малави;lilongwe
MX;Mexico;Мексика;в Мексике;mexico-city
MY;Malaysia;Малайзия;в Малайзии;kuala-lumpur
MZ;Mozambique;Мозамбик;в Мозамбике;maputo
NA;Namibia;Намибия;в Намибии;windhoek
NC;New Caledonia;Новая Каледония;в Новой Каледонии;noumea
NE;Niger;Нигер;в Нигере;niamey
NG;Nigeria;Нигерия;в Нигерии;abuja
NI;Nicaragua;Никарагуа;в Никарагуа;managua
NL;Netherlands;Нидерланды;в Нидерландах;amsterdam
NO;Norway;Норвегия;в Норвегии;oslo
NP;Nepal;Непал;в Непале;kathmandu
NR;Nauru;Науру;в Науру;yaren
NZ;New Zealand;Новая Зеландия;в Новой Зеландии;wellington
OM;Oman;Оман;в Омане;muscat
PA;Panama;Панама;в Панаме;panama-city
PE;Peru;Перу;в Перу;lima
PF;French Polynesia;Французская Полинезия;во Французской Полинезии;papeete
PG;Papua New Guinea;Папуа — Новая Гвинея;в Папуа — Новой Гвинее;port-moresby
PH;Philippines;Филиппины;на Филиппинах;manila
PK;Pakistan;Пакистан;в Пакистане;islamabad
PL;Poland;Польша;в Польше;warsaw
PR;Puerto Rico;Пуэрто-Рико;в Пуэрто-Рико;san-juan
PS;Palestine;Палестина;в Палестине;ramallah
PT;Portugal;Португалия;в Португалии;lisbon
PW;Palau;Палау;в Палау;ngerulmud
PY;Paraguay;Парагвай;в Парагвае;asuncion
QA;Qatar;Катар;в Катаре;doha
RE;Réunion;Реюньон;на Реюньоне;saint-denis
RO;Romania;Румыния;в Румынии;bucharest
RS;Serbia;Сербия;в Сербии;belgrade
RU;Russia;Россия;в России;moscow
RW;Rwanda;Руанда;в Руанде;kigali
SA;Saudi Arabia;Саудовская Аравия;в Саудовской Аравии;riyadh
SB;Solomon Islands;Соломоновы Острова;на Соломоновых Островах;honiara
SC;Seychelles;Сейшельские Острова;на Сейшельских Островах;victoria
SD;Sudan;Судан;в Судане;khartoum
SE;Sweden;Швеция;в Швеции;stockholm
SG;Singapore;Сингапур;в Сингапуре;singapore
SI;Slovenia;Словения;в Словении;ljubljana
SK;Slovakia;Словакия;в Словакии;bratislava
SL;Sierra Leone;Сьерра-Леоне;в Сьерра-Леоне;freetown
SM;San Marino;Сан-Марино;в Сан-Марино;san-marino
SN;Senegal;Сенегал;в Сенегале;dakar
SO;Somalia;Сомали;в Сомали;mogadishu
SR;Suriname;Суринам;в Суринаме;paramaribo
SS;South Sudan;Южный Судан;в Южном Судане;juba
ST;São Tomé and Príncipe;Сан-Томе и Принсипи;в Сан-Томе и Принсипи;sao-tome
SV;El Salvador;Сальвадор;в Сальвадоре;san-salvador
SY;Syria;Сирия;в Сирии;damascus
SZ;Eswatini;Эсватини;в Эсватини;mbabane
TD;Chad;Чад;в Чаде;ndjamena
TG;Togo;Того;в Того;lome
TH;Thailand;Таиланд;в Таиланде;bangkok
TJ;Tajikistan;Таджикистан;в Таджикистане;dushanbe
TL;Timor-Leste;Восточный Тимор;в Восточном Тиморе;dili
TM;Turkmenistan;Туркменистан;в Туркменистане;ashgabat
TN;Tunisia;Тунис;в Тунисе;tunis
TO;Tonga;Тонга;в Тонге;nukualofa
TR;Turkey;Турция;в Турции;ankara
TT;Trinidad and Tobago;Тринидад и Тобаго;в Тринидаде и Тобаго;port-of-spain
TV;Tuvalu;Тувалу;в Тувалу;funafuti
TW;Taiwan;Тайвань;на Тайване;taipei
TZ;Tanzania;Танзания;в Танзании;dodoma
UA;Ukraine;Украина;в Украине;kyiv
UG;Uganda;Уганда;в Уганде;kampala
US;United States;США;в США;washington
UY;Uruguay;Уругвай;в Уругвае;montevideo
UZ;Uzbekistan;Узбекистан;в Узбекистане;tashkent
VA;Vatican City;Ватикан;в Ватикане;vatican-city
VC;Saint Vincent and the Grenadines;Сент-Винсент и Гренадины;в Сент-Винсенте и Гренадинах;kingstown
VE;Venezuela;Венесуэла;в Венесуэле;caracas
VN;Vietnam;Вьетнам;во Вьетнаме;hanoi
VU;Vanuatu;Вануату;в Вануату;port-vila
WS;Samoa;Самоа;в Самоа;apia
XK;Kosovo;Косово;в Косово;pristina
YE;Yemen;Йемен;в Йемене;sanaa
ZA;South Africa;ЮАР;в ЮАР;pretoria
ZM;Zambia;Замбия;в Замбии;lusaka
ZW;Zimbabwe;Зимбабве;в Зимбабве;harare
`;

const RESERVED = new Set(["country", "zone", "convert", "clock", "flip", "analog", "utc", "gmt"]);

/* ───────────── parse ───────────── */

const problems = [];
const warn = [];

function lines(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

const cities = lines(CITIES).map((l, i) => {
  const f = l.split(";");
  if (f.length < 9 || f.length > 10) problems.push(`city line ${i + 1}: ${f.length} fields: ${l}`);
  const [slug, en, ru, ruIn, cc, tz, lat, lon, pop, cap] = f;
  const c = { slug, en, ru, ruIn, cc, tz, lat: Number(lat), lon: Number(lon), pop: Number(pop) };
  if (cap === "1") c.capital = true;
  return c;
});

const countries = lines(COUNTRIES).map((l, i) => {
  const f = l.split(";");
  if (f.length !== 5) problems.push(`country line ${i + 1}: ${l}`);
  const [cc, en, ru, ruIn, main] = f;
  return { cc, en, ru, ruIn, main };
});

/* ───────────── validate ───────────── */

const slugs = new Set();
const now = Date.now();
function offsetOf(tz, t) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
  const p = Object.fromEntries(f.formatToParts(new Date(t)).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)]));
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000) / 60000);
}
const year = new Date().getUTCFullYear();

for (const c of cities) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) problems.push(`bad slug ${c.slug}`);
  if (slugs.has(c.slug)) problems.push(`duplicate slug ${c.slug}`);
  slugs.add(c.slug);
  if (RESERVED.has(c.slug)) problems.push(`reserved slug ${c.slug}`);
  if (/[А-яЁё]/.test(c.en) || /[A-Za-z]/.test(c.ru) || /[A-Za-z]/.test(c.ruIn)) problems.push(`script mix ${c.slug}`);
  if (!/^(в|во|на) /.test(c.ruIn)) problems.push(`ruIn preposition ${c.slug}: ${c.ruIn}`);
  if (!/^[A-Z]{2}$/.test(c.cc)) problems.push(`cc ${c.slug}`);
  try {
    new Intl.DateTimeFormat("en", { timeZone: c.tz });
  } catch {
    problems.push(`unknown zone ${c.tz} (${c.slug})`);
  }
  if (!(Math.abs(c.lat) <= 90) || !(Math.abs(c.lon) <= 180) || (c.lat === 0 && c.lon === 0)) problems.push(`coords ${c.slug}`);
  if (!(c.pop > 0)) problems.push(`population ${c.slug}`);
  // Solar sanity: the zone's standard offset should be within ~3.5 h of the longitude-based offset.
  const std = Math.min(offsetOf(c.tz, Date.UTC(year, 0, 15)), offsetOf(c.tz, Date.UTC(year, 6, 15))) / 60;
  const solar = c.lon / 15;
  if (Math.abs(std - solar) > 3.5 && Math.abs(std - solar - 24) > 3.5 && Math.abs(std - solar + 24) > 3.5) warn.push(`zone/lon mismatch ${c.slug}: std ${std}, lon/15 ${solar.toFixed(1)}`);
}

const ccSet = new Set(countries.map((c) => c.cc));
const usedCc = new Set(cities.map((c) => c.cc));
for (const cc of usedCc) if (!ccSet.has(cc)) problems.push(`no country entry for ${cc}`);
for (const c of countries) {
  if (!usedCc.has(c.cc)) problems.push(`country without cities ${c.cc}`);
  const main = cities.find((x) => x.slug === c.main);
  if (!main) problems.push(`country ${c.cc}: main city ${c.main} missing`);
  else if (main.cc !== c.cc) problems.push(`country ${c.cc}: main city ${c.main} is in ${main.cc}`);
  if (!/^(в|во|на) /.test(c.ruIn)) problems.push(`country ruIn ${c.cc}`);
  if (/[A-Za-z]/.test(c.ru) || /[А-яЁё]/.test(c.en)) problems.push(`country script ${c.cc}`);
}
const ccDup = countries.map((c) => c.cc).filter((x, i, a) => a.indexOf(x) !== i);
if (ccDup.length) problems.push(`duplicate countries ${ccDup}`);

// Optional CLDR cross-check of Russian country names.
const cldrPaths = [join(ROOT, "scripts", "data", "node_modules"), "C:/Users/oatmeal/Desktop/ulti-tools-main/scripts/data/node_modules"];
const cldrRoot = cldrPaths.find((p) => existsSync(join(p, "cldr-localenames-full")));
if (cldrRoot) {
  const ru = JSON.parse(readFileSync(join(cldrRoot, "cldr-localenames-full/main/ru/territories.json"), "utf8")).main.ru.localeDisplayNames.territories;
  const diff = countries.filter((c) => ru[c.cc] !== c.ru && ru[`${c.cc}-alt-short`] !== c.ru).map((c) => `${c.cc}: ${c.ru} (CLDR: ${ru[`${c.cc}-alt-short`] ?? ru[c.cc]})`);
  if (diff.length) console.log(`CLDR name differences (curated names kept):\n  ${diff.join("\n  ")}`);
}

if (problems.length) {
  console.error(`PROBLEMS:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

/* ───────────── country zone lists + zone names (CLDR) ───────────── */

/** ICU canonicalises to legacy ids; publish the current IANA names. */
const MODERN = {
  "Europe/Kiev": "Europe/Kyiv", "Asia/Calcutta": "Asia/Kolkata", "Asia/Saigon": "Asia/Ho_Chi_Minh", "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon", "America/Godthab": "America/Nuuk", "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Louisville": "America/Kentucky/Louisville", "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Cordoba": "America/Argentina/Cordoba", "America/Mendoza": "America/Argentina/Mendoza", "America/Catamarca": "America/Argentina/Catamarca",
  "America/Jujuy": "America/Argentina/Jujuy", "Atlantic/Faeroe": "Atlantic/Faroe", "Pacific/Ponape": "Pacific/Pohnpei", "Pacific/Truk": "Pacific/Chuuk",
  "Pacific/Enderbury": "Pacific/Kanton", "America/Coral_Harbour": "America/Atikokan", "Asia/Ulan_Bator": "Asia/Ulaanbaatar", "Africa/Asmera": "Africa/Asmara",
};
const LEGACY = Object.fromEntries(Object.entries(MODERN).map(([a, b]) => [b, a]));
/** Zones deliberately not listed: official national time differs (China uses Beijing time) or the territory is disputed. */
const EXCLUDE = { CN: ["Asia/Urumqi"], UA: ["Europe/Simferopol"] };

for (const c of countries) {
  let zones = [];
  try {
    const loc = new Intl.Locale(`und-${c.cc}`);
    zones = (loc.getTimeZones ? loc.getTimeZones() : loc.timeZones) ?? [];
  } catch {
    zones = [];
  }
  zones = zones.map((z) => MODERN[z] ?? z).filter((z) => !(EXCLUDE[c.cc] ?? []).includes(z));
  for (const city of cities.filter((x) => x.cc === c.cc)) if (!zones.includes(city.tz)) zones.push(city.tz);
  c.zones = zones;
}

const zoneNames = {};
if (cldrRoot) {
  const dates = (loc) => JSON.parse(readFileSync(join(cldrRoot, `cldr-dates-full/main/${loc}/timeZoneNames.json`), "utf8")).main[loc].dates.timeZoneNames.zone;
  const ruZ = dates("ru");
  const enZ = dates("en");
  const pick = (tree, id) => id.split("/").reduce((n, k) => (n ? n[k] : undefined), tree)?.exemplarCity;
  const allZones = new Set(countries.flatMap((c) => c.zones));
  for (const z of allZones) {
    const legacy = LEGACY[z] ?? z;
    const fallback = z.split("/").pop().replace(/_/g, " ");
    const ru = pick(ruZ, z) ?? pick(ruZ, legacy);
    const en = pick(enZ, z) ?? pick(enZ, legacy) ?? fallback;
    if (!ru) warn.push(`no Russian exemplar city for ${z}`);
    zoneNames[z] = [ru ?? fallback, en];
  }
} else {
  console.log("CLDR not installed: zone-names.json not regenerated");
}

if (warn.length) console.log(`Warnings:\n  ${warn.join("\n  ")}`);

/* ───────────── write ───────────── */

cities.sort((a, b) => b.pop - a.pop || a.slug.localeCompare(b.slug));
countries.sort((a, b) => a.cc.localeCompare(b.cc));
mkdirSync(OUT, { recursive: true });
const dump = (arr) => `[\n${arr.map((x) => `  ${JSON.stringify(x)}`).join(",\n")}\n]\n`;
writeFileSync(join(OUT, "cities.json"), dump(cities));
writeFileSync(join(OUT, "countries.json"), dump(countries));
if (Object.keys(zoneNames).length) {
  const body = Object.entries(zoneNames)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(",\n");
  writeFileSync(join(OUT, "zone-names.json"), `{\n${body}\n}\n`);
}

const byCc = (cc) => cities.filter((c) => c.cc === cc).length;
console.log(`cities: ${cities.length}, countries: ${countries.length}`);
console.log(`RU ${byCc("RU")}, KZ ${byCc("KZ")}, US ${byCc("US")}, CN ${byCc("CN")}, IN ${byCc("IN")}`);
const zones = [...new Set(cities.map((c) => c.tz))].sort((a, b) => offsetOf(a, now) - offsetOf(b, now));
console.log(`zones: ${zones.length}`);
for (const z of zones) console.log(`  ${String(offsetOf(z, now) / 60).padStart(6)}  ${z}`);
