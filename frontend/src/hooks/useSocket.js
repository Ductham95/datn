import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '@/utils/constants';
import { useTelemetryStore } from '@/stores/useTelemetryStore';

/**
 * Hook to manage Socket.IO connection and subscribe to realtime events.
 * Automatically connects on mount and disconnects on unmount.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const updateBatch = useTelemetryStore((s) => s.updateBatch);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    });

    // Subscribe to new telemetry data
    socket.on(SOCKET_EVENTS.NEW_TELEMETRY, (data) => {
      if (data?.readings) {
        updateBatch(data.readings);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [updateBatch]);

  return { socket: socketRef.current, isConnected };
}
