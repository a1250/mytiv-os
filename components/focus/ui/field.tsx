"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * Fields (§6.2): a fixed label above the control (placeholder is never the label), help text below, and an error that
 * replaces the help text in the same place — text + symbol, not colour only. A field the viewer may not edit is
 * rendered as plain text (ReadOnlyValue), never as a grey control.
 */
type FieldShell = { label: ReactNode; note?: ReactNode; help?: ReactNode; error?: string | null; className?: string; labelClassName?: string };

function useFieldIds(error?: string | null, help?: ReactNode) {
  const id = useId();
  const describedBy = error ? `${id}-err` : help ? `${id}-help` : undefined;
  return { id, describedBy };
}

function Shell({ id, label, note, help, error, className, labelClassName, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={cx("f-field", className)}>
      <label htmlFor={id} className={cx("f-field__label", labelClassName)}>
        {label}{note && <> <span className="f-field__label-note">{note}</span></>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-err`} className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span>
      ) : help ? (
        <span id={`${id}-help`} className="f-field__help">{help}</span>
      ) : null}
    </div>
  );
}

export function TextField({ label, note, help, error, className, labelClassName, inputClassName, ...input }: FieldShell & { inputClassName?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const { id, describedBy } = useFieldIds(error, help);
  return (
    <Shell id={id} label={label} note={note} help={help} error={error} className={className} labelClassName={labelClassName}>
      <input id={id} {...input} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cx("f-input", inputClassName)} />
    </Shell>
  );
}

export function TextAreaField({ label, note, help, error, className, labelClassName, inputClassName, ...input }: FieldShell & { inputClassName?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, describedBy } = useFieldIds(error, help);
  return (
    <Shell id={id} label={label} note={note} help={help} error={error} className={className} labelClassName={labelClassName}>
      <textarea id={id} {...input} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cx("f-input", inputClassName)} />
    </Shell>
  );
}

export function SelectField({ label, note, help, error, className, labelClassName, inputClassName, options, ...input }: FieldShell & { inputClassName?: string; options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  const { id, describedBy } = useFieldIds(error, help);
  return (
    <Shell id={id} label={label} note={note} help={help} error={error} className={className} labelClassName={labelClassName}>
      <select id={id} {...input} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cx("f-input", "f-select", inputClassName)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  );
}

/** A value the viewer can see but not edit — text, not a disabled control. */
export function ReadOnlyValue({ label, children, why }: { label: ReactNode; children: ReactNode; why?: ReactNode }) {
  return (
    <div className="f-field">
      <span className="f-field__label">{label}</span>
      <span className="f-readonly">{children}</span>
      {why && <span className="f-field__help">{why}</span>}
    </div>
  );
}

/** Checkbox with its sentence as the label (the whole row is clickable). */
export function Checkbox({ checked, onChange, children, className, boxClassName, size, round, ...rest }: {
  checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; className?: string; boxClassName?: string; size?: "sm"; round?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "size">) {
  return (
    <label className={cx("f-check", className)}>
      <input
        type="checkbox"
        {...rest}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cx("f-check__box", size === "sm" && "f-check__box--sm", round && "f-check__box--round", boxClassName)}
      />
      <span className="f-check__text">{children}</span>
    </label>
  );
}
