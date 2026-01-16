import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Notification } from '@/types/index';
import { useToast } from '@/components/ui/toast';

export function useNotifications() {
    const { user } = useAuth();
    const { push: toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !supabase) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const fetchNotifications = async () => {
            if (!supabase) return; // Guard against undefined
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10); // Fetch last 10

                if (error) throw error;

                if (data) {
                    setNotifications(data as Notification[]);
                    setUnreadCount(data.filter((n: Notification) => !n.read_at).length);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to real-time changes
        if (!supabase) return;

        const subscription = supabase
            .channel('notifications_feed')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Show toast for new notification
                    toast({
                        title: newNotification.title,
                        description: newNotification.message,
                        variant: 'default', // or 'info' if available
                        duration: 5000,
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = payload.new as Notification;
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === updated.id ? updated : n))
                    );

                    // Re-calculate unread count from the updated list logic is simplified here
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, toast]);

    const markAsRead = async (id: string) => {
        if (!supabase) return;
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert changes if needed (omitted for simplicity)
        }
    };

    const markAllAsRead = async () => {
        if (!supabase) return;
        // Optimistic update
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        setUnreadCount(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', user?.id)
                .is('read_at', null);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
