import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Profile
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Update your personal information and preferences
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20">
              <Bell className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure alert notifications and channels
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-danger-50 dark:bg-danger-900/20">
              <Shield className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Security
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage password and security settings
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20">
              <Settings className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure system-wide settings and integrations
          </p>
        </motion.div>
      </div>
    </div>
  );
};
