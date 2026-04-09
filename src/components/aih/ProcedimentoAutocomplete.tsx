import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProcedimentoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function ProcedimentoAutocomplete({ value, onChange, className, placeholder }: ProcedimentoAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('procedimento_codigos')
      .select('codigo')
      .ilike('codigo', `%${term}%`)
      .order('uso_count', { ascending: false })
      .limit(10);
    setSuggestions(data?.map(d => d.codigo) ?? []);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const handleSelect = async (codigo: string) => {
    onChange(codigo);
    setShowSuggestions(false);
    // Incrementar uso_count
    try {
      await supabase
        .from('procedimento_codigos')
        .upsert({ codigo, uso_count: 1 }, { onConflict: 'codigo', ignoreDuplicates: false });
    } catch {
      // silently ignore
    }
  };

  const handleBlur = async () => {
    // Salvar novo código ao sair do campo se não existir ainda
    if (value && value.length > 3) {
      await supabase
        .from('procedimento_codigos')
        .upsert({ codigo: value }, { onConflict: 'codigo', ignoreDuplicates: true });
    }
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={handleChange}
        onFocus={() => value.length >= 2 && setShowSuggestions(true)}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto animate-fade-in">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-hospital-blue-light transition-colors",
                "font-mono border-b border-border/50 last:border-0"
              )}
              onMouseDown={() => handleSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
