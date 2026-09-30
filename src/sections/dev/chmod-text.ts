import type { NoteCode } from "./chmod";

type L = { ru: string; en: string };

export const NOTE_TEXT: Record<NoteCode, L> = {
  "world-writable-dir": {
    ru: "Каталог: любой пользователь может создавать, удалять и переименовывать в нём чужие файлы. Для общих каталогов добавьте sticky-бит (1777).",
    en: "Directory: any user can create, delete and rename other people's files in it. For shared directories add the sticky bit (1777).",
  },
  "world-writable-file": {
    ru: "Файл: любой пользователь системы может изменить его содержимое. Для конфигураций и скриптов это опасно.",
    en: "File: any user on the system can change its contents. That's dangerous for configs and scripts.",
  },
  "sticky-tmp": {
    ru: "Sticky-бит на общем каталоге (как /tmp с правами 1777): писать могут все, но удалять и переименовывать файлы — только их владельцы и root. Это нормальная настройка.",
    en: "Sticky bit on a shared directory (like /tmp with 1777): everyone can write, but only owners and root can delete or rename files. This is a normal setting.",
  },
  setuid: {
    ru: "SUID: исполняемый файл запускается с правами владельца (часто root), как passwd. Ставьте его только на проверенные программы.",
    en: "SUID: the executable runs with its owner's privileges (often root), like passwd. Only set it on trusted programs.",
  },
  "setgid-dir": {
    ru: "SGID на каталоге: новые файлы наследуют группу каталога — удобно для общих рабочих папок (2775).",
    en: "SGID on a directory: new files inherit the directory's group — handy for shared team folders (2775).",
  },
  "setgid-file": {
    ru: "SGID на файле: программа запускается с правами группы файла.",
    en: "SGID on a file: the program runs with the file's group privileges.",
  },
  "setid-writable": {
    ru: "Опасно: SUID/SGID вместе с правом записи для группы или остальных позволяет подменить программу и получить чужие привилегии.",
    en: "Dangerous: SUID/SGID combined with group or world write access lets someone replace the program and gain its privileges.",
  },
  "special-no-exec": {
    ru: "Специальный бит без права выполнения (S в выводе ls -l) на файле обычно ничего не делает — вероятно, это ошибка.",
    en: "A special bit without execute permission (S in ls -l) usually does nothing on a file — probably a mistake.",
  },
  "no-access": {
    ru: "Никто, кроме root, не может читать, изменять или запускать файл.",
    en: "Nobody except root can read, modify or run the file.",
  },
  private: {
    ru: "Доступ только у владельца — подходит для приватных ключей SSH (600) и личных каталогов (700).",
    en: "Only the owner has access — right for private SSH keys (600) and personal directories (700).",
  },
  "owner-cant-read": {
    ru: "Владелец не может читать файл, хотя у других есть доступ — нетипичная и, скорее всего, ошибочная настройка.",
    en: "The owner can't read the file while others have access — unusual and most likely a mistake.",
  },
};
