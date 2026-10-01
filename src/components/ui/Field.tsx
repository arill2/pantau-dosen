import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

interface FieldProps {
  label: string
  petunjuk?: string
  galat?: string
  opsional?: boolean
  children: (props: {
    id: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }) => ReactNode
}

export function Field({
  label,
  petunjuk,
  galat,
  opsional,
  children,
}: FieldProps) {
  const id = useId()
  const idPetunjuk = petunjuk ? `${id}-petunjuk` : undefined
  const idGalat = galat ? `${id}-galat` : undefined
  const describedBy = [idPetunjuk, idGalat].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
        {opsional ? (
          <span className="ml-1.5 font-normal text-muted">(opsional)</span>
        ) : null}
      </label>
      {children({
        id,
        'aria-invalid': galat ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {petunjuk && !galat ? (
        <p id={idPetunjuk} className="text-xs text-muted">
          {petunjuk}
        </p>
      ) : null}
      {galat ? (
        <p id={idGalat} className="flex items-center gap-1 text-xs font-medium text-alfa">
          <span aria-hidden="true">⚠</span>
          {galat}
        </p>
      ) : null}
    </div>
  )
}

export function Input({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`field ${className}`} />
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`field cursor-pointer pr-8 ${className}`}>
      {children}
    </select>
  )
}

export function Textarea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...rest} className={`field min-h-20 resize-y ${className}`} />
  )
}
