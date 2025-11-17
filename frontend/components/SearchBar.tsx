import React, { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Busque por filmes ou séries...",
  debounceMs = 400,
  onDebouncedChange,
}) => {
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!onDebouncedChange) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onDebouncedChange(value);
    }, debounceMs);
    return () => window.clearTimeout(timer.current);
  }, [value, debounceMs, onDebouncedChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center gap-2 mb-12" role="search">
      <label htmlFor="search-input" className="sr-only">
        Buscar filmes ou séries
      </label>
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          flex-grow p-3 border border-gray-700 rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          text-white placeholder-gray-500
          bg-gray-800
        "
        aria-label="Campo de busca"
        autoComplete="off"
      />
      <button
        type="submit"
        className="
          bg-green-600 text-white p-3 rounded-lg shadow-md
          hover:bg-green-700 transition duration-300 ease-in-out
        "
        aria-label="Enviar busca"
      >
        Buscar
      </button>
    </form>
  );
};

export default SearchBar;
