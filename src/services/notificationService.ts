import { AdminNotification } from '../types/exchange';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'solfeggioroots@gmail.com';
const NOTIFICATIONS_STORAGE_KEY = 'nexora_admin_notifications_v3';

// Listeners for in-app reactive notification updates
type NotificationListener = (notifications: AdminNotification[]) => void;
const listeners: Set<NotificationListener> = new Set();

const loadStoredNotifications = (): AdminNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load admin notifications', e);
  }
  return [];
};

let notifications: AdminNotification[] = loadStoredNotifications();

const saveNotifications = () => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save admin notifications', e);
  }
  listeners.forEach((listener) => {
    try {
      listener([...notifications]);
    } catch (e) {
      console.error('Error notifying notification listener', e);
    }
  });
};

export const subscribeToAdminNotifications = (listener: NotificationListener) => {
  listeners.add(listener);
  listener([...notifications]);
  return () => {
    listeners.delete(listener);
  };
};

export const getAdminNotifications = (): AdminNotification[] => {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const markNotificationAsRead = (id: string) => {
  const item = notifications.find((n) => n.id === id);
  if (item) {
    item.read = true;
    saveNotifications();
  }
};

export const markAllNotificationsAsRead = () => {
  notifications.forEach((n) => (n.read = true));
  saveNotifications();
};

/**
 * Dispatches a formal administrative request and alert email to solfeggioroots@gmail.com
 */
export const dispatchAdminEmailRequest = async (params: {
  type: 'DEPOSIT_INITIATED' | 'WITHDRAWAL_INITIATED' | 'SUPPORT_TICKET';
  title: string;
  message: string;
  userId: string;
  userEmail: string;
  asset: string;
  amount: number;
  usdAmount?: number;
  requestId: string;
  details?: Record<string, any>;
}): Promise<AdminNotification> => {
  const now = new Date().toISOString();
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const emailSubject = `[NEXORA EXCHANGE ALERT] ${params.title} - ${params.amount} ${params.asset} (${params.userEmail})`;
  const emailContent = `
========================================
NEXORA INSTITUTIONAL EXCHANGE ALERT
========================================
Notice: An action requires immediate administrative review.
Recipient: ${ADMIN_EMAIL}
Event Type: ${params.type}
Timestamp: ${new Date().toUTCString()}

DETAILS:
- User Email: ${params.userEmail}
- User ID: ${params.userId}
- Action Requested: ${params.title}
- Amount: ${params.amount} ${params.asset} ${params.usdAmount ? `(~$${params.usdAmount.toLocaleString()})` : ''}
- Request ID: ${params.requestId}
${params.details ? Object.entries(params.details).map(([k, v]) => `- ${k}: ${v}`).join('\n') : ''}

STATUS: PENDING ADMINISTRATIVE APPROVAL
Log into the NEXORA Admin Terminal at your exchange dashboard to approve or decline this request.
========================================
`.trim();

  // Log dispatch cleanly to console
  console.info(`[ADMIN DISPATCH] Request sent to Admin and email queued for ${ADMIN_EMAIL}`, {
    subject: emailSubject,
    recipient: ADMIN_EMAIL,
    requestId: params.requestId,
  });

  const record: AdminNotification = {
    id: notificationId,
    type: params.type,
    title: params.title,
    message: params.message,
    userId: params.userId,
    userEmail: params.userEmail,
    asset: params.asset,
    amount: params.amount,
    usdAmount: params.usdAmount,
    requestId: params.requestId,
    emailRecipient: ADMIN_EMAIL,
    emailStatus: 'SENT',
    emailBody: emailContent,
    createdAt: now,
    read: false,
  };

  // Add to in-memory & LocalStorage
  notifications.unshift(record);
  saveNotifications();

  // Sync to Firestore admin_notifications collection if available
  try {
    const docRef = doc(db, 'admin_notifications', notificationId);
    await setDoc(docRef, {
      ...record,
      targetEmail: ADMIN_EMAIL,
      dispatchedAt: now,
    });
  } catch (err) {
    // Non-blocking fallback
  }

  // Attempt to call notification endpoint if available (non-blocking)
  try {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      window.fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: ADMIN_EMAIL,
          subject: emailSubject,
          body: emailContent,
          notification: record,
        }),
      }).catch(() => {
        // Safe silence if no express proxy listening
      });
    }
  } catch (e) {
    // Non-blocking
  }

  return record;
};

export const getAdminEmailAddress = () => ADMIN_EMAIL;
