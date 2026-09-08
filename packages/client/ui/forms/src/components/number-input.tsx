'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { InputGroup, InputGroupButton, InputGroupInput } from './input-group';

export interface NumberInputProps {
  name: string;
  id?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  className?: string;
  onChange?: (value: number | null) => void;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/** A real stepper for numeric fields — +/- buttons flanking a still-directly-typable
 * center input, instead of the browser's inconsistently-styled native number spinner.
 * Uncontrolled toward the surrounding form (submits via a real `name`d input, same as
 * a plain `<input type="number">`), so it drops into `'use server'` form actions as-is. */
export function NumberInput({
  name,
  id,
  defaultValue,
  min,
  max,
  step = 1,
  placeholder,
  disabled,
  required,
  error,
  className,
  onChange,
}: NumberInputProps) {
  const [value, setValue] = useState<number | ''>(defaultValue ?? '');

  function commit(next: number | '') {
    setValue(next);
    onChange?.(next === '' ? null : next);
  }

  function adjust(delta: number) {
    const base = value === '' ? (min ?? 0) : value;
    commit(clamp(base + delta, min, max));
  }

  return (
    <InputGroup
      className={cn('h-10 rounded-lg', error && 'border-destructive ring-3 ring-destructive/20', className)}
    >
      <InputGroupButton
        type="button"
        size="icon-sm"
        aria-label="Decrease"
        disabled={disabled || (min !== undefined && value !== '' && value <= min)}
        onClick={() => adjust(-step)}
        className="rounded-l-lg rounded-r-none"
      >
        <Minus />
      </InputGroupButton>
      <InputGroupInput
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error || undefined}
        className="text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        onChange={(e) => {
          const raw = e.target.value;
          commit(raw === '' ? '' : Number(raw));
        }}
      />
      <InputGroupButton
        type="button"
        size="icon-sm"
        aria-label="Increase"
        disabled={disabled || (max !== undefined && value !== '' && value >= max)}
        onClick={() => adjust(step)}
        className="rounded-l-none rounded-r-lg"
      >
        <Plus />
      </InputGroupButton>
    </InputGroup>
  );
}
