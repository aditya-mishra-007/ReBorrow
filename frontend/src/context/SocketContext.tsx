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
import { TOKEN_STORAGE_KEY } from '@/lib/api';

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
  // connecting to the same origin Vite is proxying from (works
  // automatically because Socket.io, like axios, respects the Vite
  // dev proxy when given a relative/empty URL... actually Socket.io
  // needs an explicit origin, so we fall back to localhost:5000
  // directly for local dev, matching the backend's default PORT).
  if (!apiUrl) return 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up any existing connection on logout.
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
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