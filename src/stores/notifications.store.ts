import { create } from 'zustand';

/**
 * Tipo de notificación
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notificación
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Estado de notificaciones
 */
interface NotificationsState {
  // Estado
  notifications: Notification[];
  unreadCount: number;

  // Acciones
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

/**
 * Store de notificaciones con Zustand
 *
 * Maneja las notificaciones en tiempo real de la aplicación
 */
export const useNotificationsStore = create<NotificationsState>((set) => ({
  // Estado inicial
  notifications: [],
  unreadCount: 0,

  // Agregar nueva notificación
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      read: false,
      createdAt: new Date(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Marcar notificación como leída
  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  // Marcar todas como leídas
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  // Eliminar notificación
  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  // Limpiar todas las notificaciones
  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  // Establecer notificaciones (desde el servidor)
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;

    set({
      notifications,
      unreadCount,
    });
  },
}));

/**
 * Hook para obtener el contador de no leídas
 */
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount);
