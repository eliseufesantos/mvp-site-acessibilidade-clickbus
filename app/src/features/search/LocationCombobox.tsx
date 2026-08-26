import { ChevronDown, MapPin } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { signLibras } from '../../components/accessibility/signLibras';

const cities = [
  'São Paulo (SP)',
  'Rio de Janeiro (RJ)',
  'Belo Horizonte (MG)',
  'Curitiba (PR)',
  'Campinas (SP)',
  'Florianópolis (SC)',
];

interface LocationComboboxProps {
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

export function LocationCombobox({ label, name, onChange, value }: LocationComboboxProps) {
  const inputId = useId();
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCities = useMemo(() => {
    const query = value.trim().toLocaleLowerCase('pt-BR');
    if (!query || cities.includes(value)) return cities;
    return cities.filter((city) => city.toLocaleLowerCase('pt-BR').includes(query));
  }, [value]);

  // O VLibras traduz texto selecionado com o mouse, e ninguém consegue
  // selecionar dentro de uma lista que fecha ao primeiro clique. Então a opção
  // em foco é enviada direto ao avatar, com uma pausa curta para não disparar
  // uma tradução a cada tecla digitada.
  const activeCity = isOpen ? filteredCities[activeIndex] : undefined;

  useEffect(() => {
    if (!activeCity) return undefined;
    const timer = window.setTimeout(() => signLibras(activeCity), 250);
    return () => window.clearTimeout(timer);
  }, [activeCity]);

  const selectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredCities.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && isOpen && filteredCities[activeIndex]) {
      event.preventDefault();
      selectCity(filteredCities[activeIndex]);
    }
    if (event.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className="field combobox">
      <label htmlFor={inputId}>{label}</label>
      <div className="field__control">
        <MapPin aria-hidden="true" size={20} />
        <input
          id={inputId}
          name={name}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={isOpen ? `${listboxId}-${activeIndex}` : undefined}
          autoComplete="off"
          required
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={handleKeyDown}
        />
        <ChevronDown aria-hidden="true" size={18} />
      </div>
      {isOpen ? (
        <ul className="combobox__list" id={listboxId} role="listbox">
          {filteredCities.length > 0 ? (
            filteredCities.map((city, index) => (
              <li
                id={`${listboxId}-${index}`}
                className={index === activeIndex ? 'combobox__option combobox__option--active' : 'combobox__option'}
                key={city}
                role="option"
                aria-selected={city === value}
                onMouseDown={() => selectCity(city)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <MapPin aria-hidden="true" size={18} />
                {city}
              </li>
            ))
          ) : (
            <li className="combobox__empty">Nenhuma cidade encontrada.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

