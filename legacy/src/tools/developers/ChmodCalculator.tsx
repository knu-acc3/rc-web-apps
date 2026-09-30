"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Warning } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type Role = "owner" | "group" | "others";
type Permission = "read" | "write" | "execute";

type PermissionState = Record<Role, Record<Permission, boolean>> & {
  special: { setuid: boolean; setgid: boolean; sticky: boolean };
};

const ROLES: Role[] = ["owner", "group", "others"];
const PERMISSIONS: Permission[] = ["read", "write", "execute"];

function digitToPermissions(digit: number) {
  return {
    read: Boolean(digit & 4),
    write: Boolean(digit & 2),
    execute: Boolean(digit & 1),
  };
}

function parseMode(mode: string): PermissionState {
  const padded = mode.padStart(4, "0").slice(-4).split("").map(Number);
  return {
    owner: digitToPermissions(padded[1]),
    group: digitToPermissions(padded[2]),
    others: digitToPermissions(padded[3]),
    special: {
      setuid: Boolean(padded[0] & 4),
      setgid: Boolean(padded[0] & 2),
      sticky: Boolean(padded[0] & 1),
    },
  };
}

function permissionDigit(value: Record<Permission, boolean>) {
  return (value.read ? 4 : 0) + (value.write ? 2 : 0) + (value.execute ? 1 : 0);
}

function serializeMode(state: PermissionState) {
  const special =
    (state.special.setuid ? 4 : 0) +
    (state.special.setgid ? 2 : 0) +
    (state.special.sticky ? 1 : 0);
  const ordinary = ROLES.map((role) => permissionDigit(state[role])).join("");
  return special ? `${special}${ordinary}` : ordinary;
}

function symbolicMode(state: PermissionState) {
  const parts = ROLES.map((role) => [
    state[role].read ? "r" : "-",
    state[role].write ? "w" : "-",
    state[role].execute ? "x" : "-",
  ]);
  if (state.special.setuid) parts[0][2] = parts[0][2] === "x" ? "s" : "S";
  if (state.special.setgid) parts[1][2] = parts[1][2] === "x" ? "s" : "S";
  if (state.special.sticky) parts[2][2] = parts[2][2] === "x" ? "t" : "T";
  return parts.flat().join("");
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

const PRESETS = [
  {
    mode: "755",
    ru: "Папка или исполняемый файл",
    en: "Directory or executable",
  },
  { mode: "644", ru: "Обычный файл", en: "Regular file" },
  { mode: "600", ru: "Приватный файл", en: "Private file" },
  { mode: "700", ru: "Приватная папка", en: "Private directory" },
];

export default function ChmodCalculator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [modeInput, setModeInput] = useState("755");
  const [permissions, setPermissions] = useState<PermissionState>(() =>
    parseMode("755"),
  );
  const [path, setPath] = useState("path/to/file");
  const [recursive, setRecursive] = useState(false);
  const [copied, setCopied] = useState(false);

  const mode = serializeMode(permissions);
  const validMode = /^[0-7]{3,4}$/.test(modeInput);
  const validPath = path.trim().length > 0 && !/[\r\n\0]/.test(path);
  const command =
    validMode && validPath
      ? `chmod ${recursive ? "-R " : ""}${mode} -- ${shellQuote(path.trim())}`
      : "";
  const worldWritable = permissions.others.write;
  const symbolic = useMemo(() => symbolicMode(permissions), [permissions]);

  const changeMode = (value: string) => {
    const cleaned = value.replace(/[^0-7]/g, "").slice(0, 4);
    setModeInput(cleaned);
    if (/^[0-7]{3,4}$/.test(cleaned)) setPermissions(parseMode(cleaned));
    setCopied(false);
  };

  const updatePermissions = (next: PermissionState) => {
    setPermissions(next);
    setModeInput(serializeMode(next));
    setCopied(false);
  };

  const togglePermission = (role: Role, permission: Permission) => {
    updatePermissions({
      ...permissions,
      [role]: {
        ...permissions[role],
        [permission]: !permissions[role][permission],
      },
    });
  };

  const copyCommand = async () => {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const roleLabel = (role: Role) => {
    const labels = {
      owner: isEn ? "Owner" : "Владелец",
      group: isEn ? "Group" : "Группа",
      others: isEn ? "Others" : "Остальные",
    };
    return labels[role];
  };

  const permissionLabel = (permission: Permission) => {
    const labels = {
      read: isEn ? "Read" : "Чтение",
      write: isEn ? "Write" : "Запись",
      execute: isEn ? "Execute" : "Выполнение",
    };
    return labels[permission];
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <div>
            <Label htmlFor="chmod-mode" className="text-sm font-semibold">
              {isEn ? "Permissions" : "Права"}
            </Label>
            <Input
              id="chmod-mode"
              value={modeInput}
              onChange={(event) => changeMode(event.target.value)}
              inputMode="numeric"
              maxLength={4}
              className={cn(
                "mt-2 h-12 font-mono text-xl font-bold tracking-[0.2em]",
                !validMode && "border-[var(--color-danger)]",
              )}
              aria-invalid={!validMode}
            />
          </div>
          <div>
            <Label htmlFor="chmod-path" className="text-sm font-semibold">
              {isEn ? "File or directory path" : "Путь к файлу или папке"}
            </Label>
            <Input
              id="chmod-path"
              value={path}
              onChange={(event) => {
                setPath(event.target.value);
                setCopied(false);
              }}
              className={cn(
                "mt-2 h-12 font-mono",
                !validPath && "border-[var(--color-danger)]",
              )}
              aria-invalid={!validPath}
            />
          </div>
        </div>

        {!validMode ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {isEn
              ? "Enter 3 or 4 octal digits from 0 to 7."
              : "Введите 3 или 4 восьмеричные цифры от 0 до 7."}
          </p>
        ) : null}
        {!validPath ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {isEn
              ? "Enter a path without line breaks."
              : "Введите путь без переносов строк."}
          </p>
        ) : null}

        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {isEn ? "Safe shell command" : "Безопасная команда shell"}
          </div>
          <code className="mt-1 block break-all font-mono text-sm font-semibold">
            {command || "—"}
          </code>
        </div>

        {worldWritable ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <Warning size={19} weight="fill" className="mt-0.5 shrink-0" />
            <span>
              {isEn
                ? "Others can write to this target. Avoid this permission on production files."
                : "Остальные пользователи смогут изменять объект. Не используйте такие права для рабочих файлов без необходимости."}
            </span>
          </div>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!command}
          onClick={copyCommand}
          leadingIcon={
            copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
          }
        >
          {copied
            ? isEn
              ? "Command copied"
              : "Команда скопирована"
            : isEn
              ? "Copy command"
              : "Скопировать команду"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={
            isEn ? "Permission matrix and options" : "Матрица прав и параметры"
          }
          description={
            isEn
              ? `Symbolic form: ${symbolic}`
              : `Символьная форма: ${symbolic}`
          }
        >
          <div className="hidden overflow-x-auto sm:block">
            <div className="min-w-[33rem]">
              <div className="grid grid-cols-[9rem_repeat(3,1fr)] gap-2 pb-2 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                <span />
                {PERMISSIONS.map((permission) => (
                  <span key={permission}>{permissionLabel(permission)}</span>
                ))}
              </div>
              {ROLES.map((role) => (
                <div
                  key={role}
                  className="mb-2 grid grid-cols-[9rem_repeat(3,1fr)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2"
                >
                  <span className="text-sm font-semibold">
                    {roleLabel(role)} · {permissionDigit(permissions[role])}
                  </span>
                  {PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex min-h-11 cursor-pointer items-center justify-center"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[role][permission]}
                        onChange={() => togglePermission(role, permission)}
                        aria-label={`${roleLabel(role)}: ${permissionLabel(permission)}`}
                        className="size-5 accent-[var(--color-primary)]"
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:hidden">
            {ROLES.map((role) => (
              <fieldset
                key={role}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"
              >
                <legend className="px-1 text-sm font-semibold">
                  {roleLabel(role)} · {permissionDigit(permissions[role])}
                </legend>
                <div className="mt-1 grid gap-2">
                  {PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 text-sm"
                    >
                      <span>{permissionLabel(permission)}</span>
                      <input
                        type="checkbox"
                        checked={permissions[role][permission]}
                        onChange={() => togglePermission(role, permission)}
                        aria-label={`${roleLabel(role)}: ${permissionLabel(permission)}`}
                        className="size-5 accent-[var(--color-primary)]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["setuid", "SUID"],
                ["setgid", "SGID"],
                ["sticky", "Sticky"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={permissions.special[key]}
                  onChange={() =>
                    updatePermissions({
                      ...permissions,
                      special: {
                        ...permissions.special,
                        [key]: !permissions.special[key],
                      },
                    })
                  }
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span className="font-semibold">{label}</span>
              </label>
            ))}
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={recursive}
              onChange={() => setRecursive((value) => !value)}
              className="size-5 accent-[var(--color-primary)]"
            />
            <span>
              {isEn ? "Apply recursively (-R)" : "Применить рекурсивно (-R)"}
            </span>
          </label>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.mode}
                type="button"
                onClick={() => changeMode(preset.mode)}
                className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
              >
                <span className="mr-2 font-mono font-bold text-[var(--color-primary)]">
                  {preset.mode}
                </span>
                {isEn ? preset.en : preset.ru}
              </button>
            ))}
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
