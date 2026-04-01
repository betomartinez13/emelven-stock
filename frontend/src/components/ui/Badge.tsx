import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
}

const colorClasses: Record<BadgeColor, string> = {
  green:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
  gray:   'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export default function Badge({ color, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
