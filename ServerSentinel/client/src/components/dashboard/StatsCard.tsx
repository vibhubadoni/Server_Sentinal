import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  total?: number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
  warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
  danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
};

export const StatsCard = ({ title, value, total, icon: Icon, color }: StatsCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
            {total !== undefined && (
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">
                / {total}
              </span>
            )}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
