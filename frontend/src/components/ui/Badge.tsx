import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
}

const colorClasses: Record<BadgeColor, string> = {
  green:  'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray:   'bg-gray-100 text-gray-800',
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
