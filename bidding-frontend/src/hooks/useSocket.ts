import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
};
const SOCKET_URL = getSocketURL();

// ── Module-level singleton: ONE socket connection shared across all useSocket() calls ──
let sharedSocket: Socket | null = null;
let listenerCount = 0;
const stateCallbacks = new Set<(n: any[]) => void>();
const toastCallbacks = new Set<(t: any[]) => void>();

// Track dismissed toast IDs (module-level so it persists across re-renders)
const dismissedToastIds = new Set<number>();

// Active toasts list (module-level)
let activeToasts: any[] = [];

function broadcastToasts() {
  toastCallbacks.forEach((cb) => cb([...activeToasts]));
}

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL);

    sharedSocket.on('notification', (data: any) => {
      console.log('Real-time Notification:', data);

      // 1. If notification is targeted to a specific user, only show to that user
      if (data.forUserId) {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.warn('Notification received with forUserId but no user in localStorage');
          return;
        }
        try {
          const userData = JSON.parse(userStr);
          // Standardize everything to trimmed lowercase hex string
          const currentUserId = (userData._id || userData.id || '').toString().trim().toLowerCase();
          const targetUserId = data.forUserId.toString().trim().toLowerCase();
          
          if (currentUserId !== targetUserId) {
             return; 
          }
          console.log('✅ Real-time Notification matched for this user:', data.type);
        } catch (e) {
          console.error('Error parsing user for notification check', e);
          return;
        }
      }

      // 2. Prevent duplicate notifications (only if exactly same message and carId in last 2 seconds)
      const existingRaw = localStorage.getItem('notifications');
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      
      // We'll relax this significantly to allow multiple bids or status updates
      // Only skip if the exact message was sent in the last 10 seconds (basic debounce)
      const isDuplicate = existing.some(
        (n) => n.message === data.message && 
               n.carId?.toString() === data.carId?.toString() &&
               (Date.now() - new Date(n.timestamp).getTime() < 10000)
      );
      
      if (isDuplicate && data.type !== 'NEW_BID') { 
        console.log('Skipping duplicate notification:', data.type);
        return;
      }

      // 3. Add the notification to localStorage (persists for bell icon)
      const newNotif = { ...data, id: Date.now() + Math.random(), seen: false, timestamp: new Date() };
      const updated = [newNotif, ...existing].slice(0, 20);
      localStorage.setItem('notifications', JSON.stringify(updated));

      // 4. Push to ALL mounted hook instances for bell dropdown
      stateCallbacks.forEach((cb) => cb(updated));

      // 5. Add to active toasts (temporary screen popup)
      activeToasts = [newNotif, ...activeToasts].slice(0, 5);
      broadcastToasts();

      // 6. Auto-dismiss toast after 6 seconds
      setTimeout(() => {
        dismissedToastIds.add(newNotif.id);
        activeToasts = activeToasts.filter((t) => t.id !== newNotif.id);
        broadcastToasts();
      }, 6000);
    });
  }
  return sharedSocket;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    // Load persisted notifications for bell icon
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch { /* ignore */ }
    }
    // Don't load toasts from storage — toasts are only for real-time popups

    const s = getSocket();
    setSocket(s);
    listenerCount++;

    stateCallbacks.add(setNotifications);
    toastCallbacks.add(setToasts);

    return () => {
      listenerCount--;
      stateCallbacks.delete(setNotifications);
      toastCallbacks.delete(setToasts);

      if (listenerCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        listenerCount = 0;
      }
    };
  }, []);

  // Dismiss toast from screen ONLY — notification stays in bell
  const dismissToast = useCallback((id: number) => {
    dismissedToastIds.add(id);
    activeToasts = activeToasts.filter((t) => t.id !== id);
    broadcastToasts();
  }, []);

  // Mark all as seen in bell (doesn't remove, just marks read)
  const markAllSeen = useCallback((type?: string) => {
    const raw = localStorage.getItem('notifications');
    const all: any[] = raw ? JSON.parse(raw) : [];
    const updated = all.map(n =>
      (!type || n.type === type) ? { ...n, seen: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    stateCallbacks.forEach((cb) => cb(updated));
  }, []);

  // Clear all from bell
  const clearAll = useCallback((type?: string) => {
    const raw = localStorage.getItem('notifications');
    const all: any[] = raw ? JSON.parse(raw) : [];
    const updated = type ? all.filter(n => n.type !== type) : [];
    localStorage.setItem('notifications', JSON.stringify(updated));
    stateCallbacks.forEach((cb) => cb(updated));
  }, []);

  // Remove a single notification from bell
  const clearNotification = useCallback((id: number) => {
    const raw = localStorage.getItem('notifications');
    const all: any[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter((n) => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(updated));
    stateCallbacks.forEach((cb) => cb(updated));
  }, []);

  return { socket, notifications, toasts, dismissToast, markAllSeen, clearAll, clearNotification };
};
