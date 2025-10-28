import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: number;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort by newest first
      notificationsArray.sort((a, b) => b.createdAt - a.createdAt);
      
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter(n => !n.read).length);
      
      // Show toast for new unread notifications (only if not first load)
      const latestUnread = notificationsArray.find(n => !n.read);
      if (latestUnread && notifications.length > 0) {
        toast({
          title: latestUnread.title,
          description: latestUnread.message,
          variant: latestUnread.type === 'error' ? 'destructive' : 'default',
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const notifRef = doc(db, 'notifications', notificationId);
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      await setDoc(notifRef, { ...notification, read: true }, { merge: true });
    }
  };

  const createNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      title,
      message,
      type,
      read: false,
      createdAt: Date.now(),
    });
  };

  return { notifications, unreadCount, markAsRead, createNotification };
};
