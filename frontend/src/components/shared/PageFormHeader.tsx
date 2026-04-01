import { HiArrowLeft } from 'react-icons/hi';

interface PageFormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export default function PageFormHeader({ title, subtitle, onBack }: PageFormHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <HiArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
