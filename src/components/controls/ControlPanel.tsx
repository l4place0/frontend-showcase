import type { SpecimenControl } from "../../app/types";

interface Props {
  controls: SpecimenControl[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
}

function NumberField({ control, value, onChange }: { control: SpecimenControl; value: unknown; onChange: (value: number) => void }) {
  const number = typeof value === "number" ? value : Number(value || 0);
  return (
    <div className="control-field">
      <label htmlFor={`control-${control.key}`}><span>{control.label}</span><output>{number}{control.unit}</output></label>
      <input id={`control-${control.key}`} type={control.type} value={number} min={control.min} max={control.max} step={control.step} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
    </div>
  );
}

export function ControlPanel({ controls, values, onChange, onReset }: Props) {
  if (!controls.length) return <p className="muted">这件展品没有可调参数。</p>;
  return (
    <div className="control-panel" data-testid="control-panel">
      {controls.map((control) => {
        const value = values[control.key];
        if (control.type === "range" || control.type === "number") return <NumberField key={control.key} control={control} value={value} onChange={(next) => onChange(control.key, next)} />;
        if (control.type === "boolean") return (
          <label className="toggle-field" key={control.key} htmlFor={`control-${control.key}`}>
            <span>{control.label}</span><input id={`control-${control.key}`} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(control.key, event.currentTarget.checked)} />
          </label>
        );
        if (control.type === "select") return (
          <label className="control-field" key={control.key} htmlFor={`control-${control.key}`}><span>{control.label}</span>
            <select id={`control-${control.key}`} value={String(value ?? "")} onChange={(event) => onChange(control.key, event.currentTarget.value)}>
              {(control.options || []).map((option) => {
                const normalized = typeof option === "object" ? option : { label: String(option), value: option };
                return <option value={normalized.value} key={String(normalized.value)}>{normalized.label}</option>;
              })}
            </select>
          </label>
        );
        if (control.type === "button") return <button className="button secondary full" type="button" key={control.key} onClick={() => onChange(control.key, Date.now())}>{control.label}</button>;
        if (control.type === "vector2") {
          const vector = Array.isArray(value) ? value : [0, 0];
          return <fieldset className="vector-field" key={control.key}><legend>{control.label}</legend>{[0, 1].map((axis) => <input aria-label={`${control.label} ${axis ? "Y" : "X"}`} type="number" value={Number(vector[axis] || 0)} min={control.min} max={control.max} step={control.step} onChange={(event) => { const next = [...vector]; next[axis] = event.currentTarget.valueAsNumber; onChange(control.key, next); }} key={axis} />)}</fieldset>;
        }
        return (
          <label className="control-field" key={control.key} htmlFor={`control-${control.key}`}><span>{control.label}</span>
            <input id={`control-${control.key}`} type={control.type === "color" ? "color" : "text"} value={String(value ?? "")} onChange={(event) => onChange(control.key, event.currentTarget.value)} />
          </label>
        );
      })}
      <button className="text-button" type="button" onClick={onReset}>恢复默认参数</button>
    </div>
  );
}
