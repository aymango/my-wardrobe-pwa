export function MultiSelectTags({ options, value, onChange, ariaLabel }: {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
  ariaLabel: string
}) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
  }

  return (
    <div className="chip-list" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip ${value.includes(option) ? 'chip--selected' : ''}`}
          onClick={() => toggle(option)}
          aria-pressed={value.includes(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
