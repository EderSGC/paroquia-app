import { useState, useEffect, type CSSProperties } from "react";
import { PastoralRepository } from "../../pastoral/repository/pastoral.repository";

interface Props {
  value: string;
  onChange: (value: string) => void;
  style?: CSSProperties;
  placeholder?: string;
}

export function ComunidadeSelect({ value, onChange, style, placeholder = "Selecione a comunidade..." }: Props) {
  const [comunidades, setComunidades] = useState<string[]>([]);

  useEffect(() => {
    PastoralRepository.comunidades.findNomes()
      .then(r => setComunidades(r.map(c => c.nome)))
      .catch(() => {});
  }, []);

  return (
    <select style={style} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {comunidades.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
