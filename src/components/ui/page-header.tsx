type Props = {
  title: string;
  description?: string;
  cta?: React.ReactNode;
};

export function PageHeader({ title, description, cta }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {cta ? <div className="flex items-center gap-2">{cta}</div> : null}
    </div>
  );
}
