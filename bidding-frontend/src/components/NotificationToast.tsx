'use client';
import { useSocket } from '../hooks/useSocket';
import { X, Bell, Trophy, CreditCard, Truck, Package, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './NotificationToast.module.css';

function getToastStyle(type: string): { bg: string; icon: React.ReactNode } {
  if (type === 'AUCTION_WIN') return { bg: 'linear-gradient(135deg, #166534, #16a34a)', icon: <Trophy size={18} color="#fff" /> };
  if (type === 'PAYMENT_REQUIRED') return { bg: 'linear-gradient(135deg, #92400e, #d97706)', icon: <CreditCard size={18} color="#fff" /> };
  if (type === 'PAYMENT_COMPLETE') return { bg: 'linear-gradient(135deg, #065f46, #059669)', icon: <CheckCircle size={18} color="#fff" /> };
  if (type === 'STATUS_UPDATE_SHIPPED') return { bg: 'linear-gradient(135deg, #1e3a8a, #2563eb)', icon: <Truck size={18} color="#fff" /> };
  if (type === 'STATUS_UPDATE_DELIVERED') return { bg: 'linear-gradient(135deg, #14532d, #22c55e)', icon: <CheckCircle size={18} color="#fff" /> };
  if (type === 'STATUS_UPDATE_SOLD' || type === 'STATUS_UPDATE_COMPLETED') return { bg: 'linear-gradient(135deg, #064e3b, #10b981)', icon: <Package size={18} color="#fff" /> };
  if (type === 'AUCTION_LOST') return { bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)', icon: <AlertCircle size={18} color="#fff" /> };
  if (type === 'AUCTION_ENDED') return { bg: 'linear-gradient(135deg, #4c1d95, #7c3aed)', icon: <Bell size={18} color="#fff" /> };
  if (type === 'BID_LOST') return { bg: 'linear-gradient(135deg, #7f1d1d, #ef4444)', icon: <AlertCircle size={18} color="#fff" /> };
  return { bg: 'linear-gradient(135deg, #1e3a5f, #3b4b89)', icon: <Bell size={18} color="#fff" /> };
}

export default function NotificationToast() {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((notif) => {
        const { bg, icon } = getToastStyle(notif.type);
        return (
          <div key={notif.id} className={styles.toastItem} style={{ background: bg }}>
            <div className={styles.iconWrapper}>
              {icon}
            </div>
            <div className={styles.content}>
              <p className={styles.message}>{notif.message}</p>
              <span className={styles.type}>{notif.type.replace(/_/g, ' ')}</span>
            </div>
            <button className={styles.closeBtn} onClick={() => dismissToast(notif.id)}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
