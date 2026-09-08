'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown as ChevronDownSmall, Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../utils/cn';

/* ── Constants ─────────────────────────────────────────── */
const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/* ── Helpers ────────────────────────────────────────────── */
function toYMD(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseYMD(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts as [number, number, number];
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDisplay(str: string): string {
  const date = parseYMD(str);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Splits a `YYYY-MM-DDTHH:mm` value into its date and time parts. Falls back to the
 * current time when the value has no time component (e.g. a bare date default). */
function splitDateTime(str: string): { ymd: string; hour: number; minute: number } {
  const [ymd, time] = str.split('T');
  if (time) {
    const [h, m] = time.split(':').map(Number);
    return { ymd: ymd ?? '', hour: h ?? 0, minute: m ?? 0 };
  }
  const now = new Date();
  return { ymd: ymd ?? '', hour: now.getHours(), minute: now.getMinutes() };
}

function formatDisplayDateTime(ymd: string, hour: number, minute: number): string {
  const date = parseYMD(ymd);
  if (!date) return '';
  date.setHours(hour, minute);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Returns 42 cells (6 rows × 7 cols), Monday-first. */
function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0

  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  // Trailing days from prev month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  // Leading days from next month
  let next = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), inMonth: false });
  }
  return cells;
}

/** Returns a range of years centered around `center` with `radius` on each side. */
function getYearRange(center: number, radius = 6): number[] {
  const start = Math.floor(center / (radius * 2)) * (radius * 2);
  return Array.from({ length: radius * 2 }, (_, i) => start + i);
}

/* ── Types ──────────────────────────────────────────────── */
type PickerMode = 'day' | 'month' | 'year';

export interface DatePickerProps {
  /** Hidden input name submitted with the form. */
  name: string;
  /** `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` when `withTime` is set. */
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Highlights the trigger border red. */
  error?: boolean;
  id?: string;
  /** Called whenever the selected value changes (same format as `defaultValue`). */
  onChange?: (value: string) => void;
  /** Adds a time-of-day row below the calendar and submits `YYYY-MM-DDTHH:mm` — the
   * same shape the native `<input type="datetime-local">` it replaces already produced,
   * so no server-side parsing changes are needed. */
  withTime?: boolean;
}

/* ── Component ──────────────────────────────────────────── */
export function DatePicker({
  name,
  defaultValue = '',
  disabled = false,
  placeholder,
  error = false,
  id,
  onChange,
  withTime = false,
}: DatePickerProps) {
  const initial = splitDateTime(defaultValue);
  const seed = parseYMD(initial.ymd) ?? new Date();

  const [selected, setSelected] = useState<string>(initial.ymd);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>('day');
  const [viewYear, setViewYear] = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());

  const todayYMD = toYMD(new Date());

  /* ── Navigation ── */
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  /* ── Selection ── */
  function emit(ymd: string, h: number, m: number) {
    onChange?.(withTime ? `${ymd}T${pad2(h)}:${pad2(m)}` : ymd);
  }

  function selectDay(date: Date) {
    const ymd = toYMD(date);
    setSelected(ymd);
    emit(ymd, hour, minute);
    if (!withTime) setOpen(false);
  }

  function selectMonth(month: number) {
    setViewMonth(month);
    setMode('day');
  }

  function selectYear(year: number) {
    setViewYear(year);
    setMode('month');
  }

  function cycleMode() {
    setMode((m) => (m === 'day' ? 'year' : 'day'));
  }

  function adjustHour(delta: number) {
    setHour((h) => {
      const next = (h + delta + 24) % 24;
      emit(selected, next, minute);
      return next;
    });
  }

  function adjustMinute(delta: number) {
    setMinute((m) => {
      const next = (m + delta + 60) % 60;
      emit(selected, hour, next);
      return next;
    });
  }

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? 'AM' : 'PM';
  function setPeriod(next: 'AM' | 'PM') {
    if ((next === 'AM' && hour < 12) || (next === 'PM' && hour >= 12)) return;
    const nextHour = next === 'AM' ? hour - 12 : hour + 12;
    setHour(nextHour);
    emit(selected, nextHour, minute);
  }

  const display = withTime ? formatDisplayDateTime(selected, hour, minute) : formatDisplay(selected);
  const submittedValue = withTime && selected ? `${selected}T${pad2(hour)}:${pad2(minute)}` : selected;
  const cells = getCalendarCells(viewYear, viewMonth);
  const years = getYearRange(viewYear);

  return (
    <>
      <input type="hidden" name={name} value={submittedValue} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={id}
              disabled={disabled}
              className={cn(
                'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-left transition-all',
                'hover:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !display && 'text-muted-foreground',
                error && 'border-destructive',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{display || placeholder || (withTime ? 'Pick a date & time' : 'Pick a date')}</span>
              {display && <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />}
            </button>
          }
        />

        <PopoverContent align="start" className="w-72 p-0 overflow-hidden">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
            {mode === 'day' && (
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={cycleMode}
              className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors mx-auto"
            >
              {mode === 'day'
                ? `${MONTHS[viewMonth]} ${viewYear}`
                : mode === 'month'
                  ? String(viewYear)
                  : 'Select Year'}
              <ChevronDown
                className={cn('size-3.5 transition-transform', mode !== 'day' && 'rotate-180')}
              />
            </button>

            {mode === 'day' && (
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>

          {/* ── Day grid ── */}
          {mode === 'day' && (
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-[10px] font-medium text-muted-foreground/60 text-center py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map(({ date, inMonth }) => {
                  const ymd = toYMD(date);
                  const isSelected = ymd === selected;
                  const isToday = ymd === todayYMD;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => selectDay(date)}
                      className={cn(
                        'size-8 rounded-lg text-xs flex items-center justify-center transition-colors relative',
                        !inMonth && 'text-muted-foreground/30',
                        inMonth && !isSelected && !isToday && 'hover:bg-muted/60',
                        isToday &&
                          !isSelected && [
                            'font-semibold text-primary',
                            'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                            'after:size-1 after:rounded-full after:bg-primary',
                          ],
                        isSelected && 'bg-primary text-primary-foreground font-semibold shadow-sm',
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Time row ── */}
          {mode === 'day' && withTime && (
            <div className="flex items-center justify-center gap-4 border-t border-border/50 px-3 py-3">
              <TimeStepper label="Hour" value={pad2(hour12)} onInc={() => adjustHour(1)} onDec={() => adjustHour(-1)} />
              <span className="pb-4 text-lg font-semibold text-muted-foreground">:</span>
              <TimeStepper label="Min" value={pad2(minute)} onInc={() => adjustMinute(5)} onDec={() => adjustMinute(-5)} />
              <div className="flex flex-col gap-1 pb-1">
                {(['AM', 'PM'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
                      period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Month grid ── */}
          {mode === 'month' && (
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonth(i)}
                  className={cn(
                    'rounded-lg py-2 text-xs font-medium transition-colors',
                    i === viewMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60',
                  )}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* ── Year grid ── */}
          {mode === 'year' && (
            <div className="grid grid-cols-4 gap-1.5 p-3">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => selectYear(y)}
                  className={cn(
                    'rounded-lg py-2 text-xs font-medium transition-colors',
                    y === viewYear
                      ? 'bg-primary text-primary-foreground'
                      : y === new Date().getFullYear()
                        ? 'border border-primary/40 text-primary'
                        : 'hover:bg-muted/60',
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/20">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                setViewYear(t.getFullYear());
                setViewMonth(t.getMonth());
                setMode('day');
                if (withTime) {
                  setHour(t.getHours());
                  setMinute(t.getMinutes());
                }
                selectDay(t);
              }}
              className="text-xs text-primary hover:underline underline-offset-2 font-medium"
            >
              Today
            </button>
            <div className="flex items-center gap-3">
              {selected && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected('');
                    onChange?.('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
              {withTime && selected && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

function TimeStepper({
  label,
  value,
  onInc,
  onDec,
}: {
  label: string;
  value: string;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onInc}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronUp className="size-3.5" />
      </button>
      <span className="w-9 text-center font-mono text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <button
        type="button"
        onClick={onDec}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronDownSmall className="size-3.5" />
      </button>
    </div>
  );
}

/** `DatePicker` with `withTime` pre-set — same props, clearer call-site name for
 * scheduling fields (cohorts, events, masterclasses). */
export function DateTimePicker(props: Omit<DatePickerProps, 'withTime'>) {
  return <DatePicker {...props} withTime />;
}
