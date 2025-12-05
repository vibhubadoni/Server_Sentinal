import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Server, AlertTriangle, Settings } from 'lucide-react';
import { useAlertsStore } from '@/store/alerts-store';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Server, label: 'Clients' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = () => {
  const { alerts } = useAlertsStore();
  const openAlertsCount = alerts.length;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          ServerSentinel
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Real-Time Monitoring
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.label === 'Alerts' && openAlertsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto badge badge-danger"
                  >
                    {openAlertsCount}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          v1.0.0 • © 2025
        </p>
      </div>
    </motion.aside>
  );
};
