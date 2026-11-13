import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getValidToken } from '@/lib/api';

/**
 * SocketContext.tsx
 * ------------------------------------------------------------------
 * Owns a single Socket.io connection for the whole app, established
 * only when the user is authenticated (mirrors AuthContext's
 * isAuthenticated state) and torn down on logout.
 *
 * The socket URL is derived the same way as the REST API's base URL
 * (VITE_API_URL) — but Socket.io connects to the server's ORIGIN, not
 * a '/api'-suffixed path, so we strip that suffix if present.
 *
 * FIX: socket is stored in useState (reactive) so consumers re-render
 * when it connects, AND in useRef (for stable cleanup). Previously,
 * only useRef was used and passed directly to context — which meant
 * consumers always received null since ref mutations don't trigger
 * re-renders.
 */

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  // Strip a trailing '/api' if present, since Socket.io connects to
  // the server's base origin, not a REST-style sub-path. In local
  // dev, VITE_API_URL is typically unset, so we fall back to
  // connecting to localhost:5000 directly (matching the backend's
  // default PORT).
  if (!apiUrl) return 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up any existing connection on logout.
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getValidToken();
    if (!token) return;

    // Avoid creating duplicate connections if one is already active.
    if (socketRef.current?.connected) return;

    const newSocket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // KEY FIX: update state on connect so all consumers re-render
      // and receive the live socket reference (not null).
      setSocket(newSocket);
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    // Also set immediately so the socket is available to consumers
    // before the 'connect' event fires (e.g. for emitting pre-connect
    // messages that socket.io queues internally).
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
