'use client';
import { useSocket } from '../hooks/useSocket';
import { X, Bell } from 'lucide-react';
import styles from './NotificationToast.module.css';

export default function NotificationToast() {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((notif) => (
        <div key={notif.id} className={styles.toastItem}>
          <div className={styles.iconWrapper}>
            <Bell size={18} color="#ffffff" />
          </div>
          <div className={styles.content}>
            <p className={styles.message}>{notif.message}</p>
            <span className={styles.type}>{notif.type.replace(/_/g, ' ')}</span>
          </div>
          <button className={styles.closeBtn} onClick={() => dismissToast(notif.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
