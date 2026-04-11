type Props = {
  label: string;
  value: string | number;
  suffix?: string;
};

export function Metric({ label, value, suffix }: Props) {
  return (
    <div className="wg-metric">
      <div className="wg-metric__label">{label}</div>
      <div className="wg-metric__value">
        {value}
        {suffix && <span className="wg-metric__suffix">{suffix}</span>}
      </div>
    </div>
  );
}
