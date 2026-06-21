import { characterMatches } from '../lib/scriptParser';

interface CharacterPickerProps {
  characters: string[];
  value: string[];
  onChange: (characters: string[]) => void;
  disabled?: boolean;
}

function isSelected(name: string, selected: string[]): boolean {
  return selected.some((c) => characterMatches(c, name));
}

export function CharacterPicker({
  characters,
  value,
  onChange,
  disabled,
}: CharacterPickerProps) {
  if (characters.length === 0) {
    return (
      <div className="picker-card">
        <h2>Your characters</h2>
        <p className="hint muted">Upload a script to see available characters.</p>
      </div>
    );
  }

  const toggleCharacter = (name: string) => {
    if (disabled) return;
    if (isSelected(name, value)) {
      onChange(value.filter((c) => !characterMatches(c, name)));
      return;
    }
    onChange([...value, name]);
  };

  return (
    <div className="picker-card">
      <h2>Your characters</h2>
      <p className="hint">
        Select the characters you&apos;re playing, or leave all unchecked to hear
        the full scene read aloud.
      </p>
      <ul className="character-list" role="group" aria-label="Characters you are playing">
        {characters.map((name) => {
          const checked = isSelected(name, value);
          const inputId = `character-${name.replace(/\s+/g, '-').toLowerCase()}`;
          return (
            <li key={name}>
              <label
                htmlFor={inputId}
                className={`character-option ${checked ? 'character-option-selected' : ''}`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleCharacter(name)}
                />
                <span>{name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
