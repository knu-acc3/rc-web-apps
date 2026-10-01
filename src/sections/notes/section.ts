import type { Block } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { FAQ, L, LL } from "../text/defs/util";
import { PACKING, templateItems } from "./content/templates";

/**
 * Notes and to-do lists stored only in the user's browser.
 * /notes — the notepad itself (the section id "notes" is the query), /todo-list — the to-do list.
 */
export const notesSection = defineToolSection({
  id: "notes",
  name: { ru: "Заметки и задачи", en: "Notes & to-do" },
  description: {
    ru: "Заметки и список дел онлайн, которые хранятся только в вашем браузере",
    en: "Online notes and to-do lists that are stored only in your own browser",
  },
  icon: "NotebookPen",
  hue: 50,
  category: "text",
  order: 3,
  tools: [
    {
      slug: "",
      component: "notes/notepad",
      icon: "NotebookPen",
      popular: true,
      wide: true,
      name: L("Блокнот онлайн", "Online notepad"),
      title: L("Блокнот онлайн — заметки с автосохранением в браузере", "Online Notepad — notes that autosave in your browser"),
      h1: L("Блокнот онлайн", "Online notepad"),
      description: L(
        "Пишите заметки прямо в браузере: автосохранение при каждом вводе, несколько заметок, Markdown, экспорт в .txt и .md, синхронизация вкладок. Без регистрации.",
        "Write notes right in your browser: autosave on every keystroke, multiple notes, Markdown preview, .txt and .md export and sync between tabs. No sign-up.",
      ),
      lead: L("Начните печатать — текст сохранится в этом браузере автоматически.", "Start typing — the text is saved in this browser automatically."),
      keywords: LL(["заметки онлайн", "онлайн блокнот", "записная книжка", "блокнот без регистрации"], ["notepad online", "online notes", "note taking"]),
      howTo: LL(
        [
          "Начните печатать — заметка создастся и сохранится сама.",
          "Кнопка «Новая заметка» добавляет ещё одну; все заметки — в списке слева.",
          "Переключитесь на «Markdown», чтобы увидеть заголовки, списки и таблицы оформленными.",
          "Скачайте заметку в .txt или .md, а все заметки — файлом .json для резервной копии.",
        ],
        [
          "Start typing — a note is created and saved on its own.",
          "“New note” adds another one; all notes are listed on the left.",
          "Switch to “Markdown” to see headings, lists and tables rendered.",
          "Download a note as .txt or .md, or all notes as a .json backup.",
        ],
      ),
      about: LL(
        [
          "Заметки хранятся в памяти вашего браузера (localStorage) и не отправляются на сервер — поэтому не нужны ни регистрация, ни пароль. Каждое изменение сохраняется сразу, а если блокнот открыт в нескольких вкладках, правки синхронизируются между ними.",
          "Счётчик внизу показывает слова и символы по тем же правилам, что и счётчик символов на сайте. Для переноса заметок на другое устройство скачайте резервную копию .json и откройте её там кнопкой «Открыть файл».",
        ],
        [
          "Notes are kept in your browser’s storage (localStorage) and never uploaded, so there’s no sign-up and no password. Every change is saved immediately, and if the notepad is open in several tabs, edits sync between them.",
          "The counter at the bottom shows words and characters using the same rules as the site’s word counter. To move notes to another device, download the .json backup and open it there with “Open file”.",
        ],
      ),
      faq: FAQ(
        [
          ["Где хранятся заметки?", "В памяти этого браузера на вашем устройстве. На сервер они не отправляются, поэтому в другом браузере или на другом устройстве их не будет — для переноса скачайте .json и откройте его там."],
          ["Не пропадут ли заметки, если закрыть вкладку?", "Нет, каждое изменение сохраняется сразу. Заметки исчезнут, только если очистить данные сайта в настройках браузера или писать в режиме инкогнито — там хранилище очищается при закрытии окна."],
          ["Можно ли открыть блокнот в двух вкладках?", "Да, правка в одной вкладке сразу появляется в другой."],
          ["Поддерживается ли Markdown?", "Да, переключатель «Markdown» показывает заголовки, списки, таблицы, флажки задач и блоки кода. Сам текст хранится как есть."],
          ["Сколько текста можно хранить?", "Браузеры обычно выделяют сайту около 5 МБ в localStorage — это несколько миллионов символов. Если место закончится, появится предупреждение."],
        ],
        [
          ["Where are my notes stored?", "In this browser’s storage on your device. They are never uploaded, so they won’t appear in another browser or device — to move them, download the .json backup and open it there."],
          ["Will notes disappear when I close the tab?", "No, every change is saved immediately. Notes are lost only if you clear the site’s data in browser settings or write in a private window, whose storage is wiped on close."],
          ["Can I use the notepad in two tabs?", "Yes, an edit in one tab shows up in the other right away."],
          ["Is Markdown supported?", "Yes, the “Markdown” switch renders headings, lists, tables, task checkboxes and code blocks. The text itself is stored as typed."],
          ["How much can I store?", "Browsers usually give a site about 5 MB of localStorage — several million characters. You’ll see a warning if space runs out."],
        ],
      ),
      related: ["todo-list", "markdown-editor", "word-counter"],
    },
    {
      slug: "todo-list",
      component: "notes/todo",
      icon: "ListChecks",
      popular: true,
      name: L("Список дел", "To-do list"),
      title: L("Список дел онлайн — простой to-do list со сроками", "To-Do List Online — simple task list with due dates"),
      h1: L("Список дел онлайн", "Online to-do list"),
      description: L(
        "Простой список дел в браузере: несколько списков, сроки с подсветкой просроченных, перестановка мышью, пальцем или с клавиатуры, экспорт в Markdown. Без регистрации.",
        "A simple to-do list in your browser: several lists, due dates with overdue highlighting, reordering by mouse, touch or keyboard, Markdown export. No sign-up.",
      ),
      lead: L("Впишите задачу и нажмите Enter — список сохранится в этом браузере.", "Type a task and press Enter — the list is saved in this browser."),
      keywords: LL(["to do list", "чек-лист", "список задач", "планировщик задач"], ["todo list", "task list", "checklist online"]),
      howTo: LL(
        [
          "Впишите задачу и нажмите Enter; при желании укажите срок.",
          "Отмечайте выполненное флажком — текст можно править прямо в строке.",
          "Меняйте порядок, перетаскивая за ручку ⋮⋮, или стрелками ↑ ↓, когда ручка в фокусе.",
          "Фильтруйте активные и выполненные задачи, а в дополнительных настройках — переименуйте список или экспортируйте его.",
        ],
        [
          "Type a task and press Enter; add a due date if you like.",
          "Tick tasks off as you finish them — edit the text right in the row.",
          "Reorder by dragging the ⋮⋮ handle, or with ↑ ↓ while the handle is focused.",
          "Filter active and completed tasks; rename or export the list in More options.",
        ],
      ),
      about: LL(
        [
          "Списки хранятся только в вашем браузере (localStorage) и синхронизируются между открытыми вкладками. Можно вести несколько списков — например, «Работа», «Дом» и «Покупки» — и переключаться между ними.",
          "Просроченные задачи подсвечиваются красным. Порядок меняется перетаскиванием на компьютере и телефоне, а с клавиатуры — стрелками на ручке перетаскивания; экранные дикторы озвучивают новую позицию. Экспорт в Markdown сохраняет флажки в формате - [ ] и - [x].",
        ],
        [
          "Lists live only in your browser (localStorage) and sync between open tabs. Keep several lists — say “Work”, “Home” and “Shopping” — and switch between them.",
          "Overdue tasks are highlighted in red. Reorder by dragging on desktop and phone, or with the arrow keys on the drag handle; screen readers announce the new position. Markdown export keeps checkboxes as - [ ] and - [x].",
        ],
      ),
      faq: FAQ(
        [
          ["Нужна ли регистрация?", "Нет. Список хранится в этом браузере на вашем устройстве и никуда не отправляется."],
          ["Будут ли напоминания о сроках?", "Нет, уведомлений нет — просроченные задачи просто подсвечиваются, когда вы открываете список."],
          ["Как перенести список на другое устройство?", "Скачайте .json или .md в дополнительных настройках и откройте файл на другом устройстве кнопкой «Открыть файл» — задачи добавятся в текущий список."],
          ["Можно ли менять порядок задач без мыши?", "Да: переведите фокус на ручку ⋮⋮ клавишей Tab и нажимайте стрелки вверх и вниз."],
        ],
        [
          ["Do I need an account?", "No. The list is stored in this browser on your device and never uploaded."],
          ["Are there reminders?", "No notifications — overdue tasks are simply highlighted when you open the list."],
          ["How do I move a list to another device?", "Download .json or .md in More options and open the file on the other device with “Open file” — the tasks are added to the current list."],
          ["Can I reorder tasks without a mouse?", "Yes: Tab to the ⋮⋮ handle and press the up and down arrows."],
        ],
      ),
      related: ["notes", "markdown-editor", "sort-lines"],
      variants: {
        title: L("Готовые списки", "Ready-made lists"),
        list: () => [
          {
            slug: "packing-list",
            name: L("Вещи в поездку", "Packing list"),
            title: L("Список вещей в поездку — чек-лист онлайн", "Packing List for a Trip — online checklist"),
            h1: L("Список вещей в поездку", "Travel packing list"),
            description: L(
              `Готовый чек-лист вещей в дорогу: документы, техника, одежда, гигиена и аптечка — ${templateItems("packing", "ru").length} пунктов. Создайте из него свой список и отмечайте собранное.`,
              `A ready packing checklist: documents, electronics, clothes, toiletries and first aid — ${templateItems("packing", "en").length} items. Turn it into your own list and tick things off.`,
            ),
            lead: L("Нажмите «Создать список из шаблона» — и отмечайте, что уже в чемодане.", "Press “Create a list from the template” and tick off what’s packed."),
            props: { template: "packing" },
            blocks: (locale): Block[] =>
              PACKING[locale].groups.map((g) => ({ type: "list", title: g.title, items: g.items }) as Block),
            faq: FAQ(
              [
                ["Можно ли изменить шаблон?", "Да, после создания это обычный список: удаляйте лишнее, добавляйте свои пункты и ставьте сроки."],
                ["Что взять в поездку в первую очередь?", "Документы, деньги и лекарства — их сложнее всего заменить в дороге. Остальное при необходимости можно купить на месте."],
              ],
              [
                ["Can I change the template?", "Yes, once created it’s a normal list: delete what you don’t need, add your own items and due dates."],
                ["What matters most?", "Documents, money and medication — they’re the hardest to replace on the road. Most other things can be bought at your destination."],
              ],
            ),
          },
        ],
      },
    },
  ],
});
