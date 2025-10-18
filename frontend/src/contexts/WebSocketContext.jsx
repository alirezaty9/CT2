import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import debugLogger from '../utils/debugLogger';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  // Log render
  debugLogger.logRender('WebSocketProvider');

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected', 'reconnecting'
  
  const listeners = useRef([]);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const isUnmounted = useRef(false);
  const socketRef = useRef(null); // اضافه شده برای مدیریت بهتر socket

  const WS_URL = "ws://localhost:12345";
  const MAX_RECONNECT_ATTEMPTS = 10; // حداکثر تلاش برای اتصال مجدد

  const cleanup = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (socketRef.current) {
      const currentSocket = socketRef.current;
      // Check if already closed/closing to avoid error logs
      if (currentSocket.readyState === WebSocket.OPEN ||
          currentSocket.readyState === WebSocket.CONNECTING) {
        currentSocket.close(1000, 'Cleanup');
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmounted.current) return;

    // Only cleanup if we have an existing connection
    if (socketRef.current) {
      cleanup();
    }

    setConnectionStatus('connecting');

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      if (isUnmounted.current) {
        ws.close(1000, 'Component unmounted');
        return;
      }

      debugLogger.logWebSocket('CONNECTED');
      console.log("✅ WebSocket connected");
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      if (isUnmounted.current) return;

      const message = event.data;
      // فراخوانی callback ها بدون تغییر state اضافی
      listeners.current.forEach((cb) => {
        try {
          cb(message);
        } catch (error) {
          console.error("❌ Error in message callback:", error);
        }
      });
    };

    ws.onerror = (err) => {
      // Only log if not unmounted (to reduce Strict Mode noise)
      if (!isUnmounted.current) {
        console.error("❌ WebSocket error:", err);
      }
      setConnectionStatus('disconnected');
    };

    ws.onclose = (event) => {
      if (isUnmounted.current) return;

      // Only log meaningful disconnects (not intentional closes)
      if (event.code !== 1000) {
        console.warn("⚠️ WebSocket disconnected", event.code);
      }

      setIsConnected(false);
      setConnectionStatus('disconnected');

      // فقط در صورتی که اتصال غیرمنتظره قطع شده باشد
      if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        attemptReconnect();
      }
    };
  }, [cleanup]);

  const attemptReconnect = useCallback(() => {
    if (isUnmounted.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error("❌ Max reconnection attempts reached");
      return;
    }

    const delay = Math.min(10000, 1000 * Math.pow(2, reconnectAttempts.current));
    console.log(`🔄 Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts.current + 1})`);
    
    setConnectionStatus('reconnecting');
    
    reconnectTimeout.current = setTimeout(() => {
      if (isUnmounted.current) return;
      reconnectAttempts.current += 1;
      connect();
    }, delay);
  }, [connect]);

  // اتصال اولیه فقط یک بار
  useEffect(() => {
    isUnmounted.current = false;
    connect();

    return () => {
      // Cleanup silently to reduce Strict Mode console noise
      isUnmounted.current = true;
      cleanup();
    };
  }, []); // dependency array خالی - فقط یک بار اجرا می‌شود

  const send = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(message);
        return true;
      } catch (error) {
        console.error("❌ Error sending message:", error);
        return false;
      }
    }
    console.warn("⚠️ WebSocket not ready to send. Current state:", 
      socketRef.current ? socketRef.current.readyState : 'null');
    return false;
  }, []);

  const addMessageCallback = useCallback((cb) => {
    if (typeof cb === 'function') {
      listeners.current.push(cb);
      return () => removeMessageCallback(cb); // cleanup function برمی‌گرداند
    }
  }, []);

  const removeMessageCallback = useCallback((cb) => {
    listeners.current = listeners.current.filter((fn) => fn !== cb);
  }, []);

  // اتصال دستی (در صورت نیاز)
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  const value = useMemo(() => ({
    isConnected,
    connectionStatus,
    send,
    addMessageCallback,
    removeMessageCallback,
    reconnect,
  }), [isConnected, connectionStatus, send, addMessageCallback, removeMessageCallback, reconnect]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};