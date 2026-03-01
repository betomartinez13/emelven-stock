import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function Card({ title, children, action, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
