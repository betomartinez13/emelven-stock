import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiXCircle, HiX } from 'react-icons/hi';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const config: Record<AlertType, { icon: React.ElementType; classes: string }> = {
  success: { icon: HiCheckCircle,      classes: 'bg-green-50 text-green-800 border-green-200' },
  error:   { icon: HiXCircle,          classes: 'bg-red-50 text-red-800 border-red-200' },
  warning: { icon: HiExclamationCircle, classes: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  info:    { icon: HiInformationCircle, classes: 'bg-blue-50 text-blue-800 border-blue-200' },
};

export default function Alert({ type, message, onClose }: AlertProps) {
  const { icon: Icon, classes } = config[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-md border ${classes}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:opacity-70 transition-opacity"
        >
          <HiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
