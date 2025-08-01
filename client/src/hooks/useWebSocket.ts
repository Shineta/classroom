import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface ActiveSession {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  lastSeen: string;
}

export function useWebSocket(walkthroughId?: string) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!user || !walkthroughId) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Join walkthrough room
        newSocket.send(JSON.stringify({
          type: 'join-walkthrough',
          walkthroughId,
          userId: user.id,
        }));
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          if (message.type === 'active-sessions') {
            setActiveSessions(message.sessions || []);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [user, walkthroughId]);

  const disconnect = useCallback(() => {
    if (socket && user && walkthroughId) {
      socket.send(JSON.stringify({
        type: 'leave-walkthrough',
        walkthroughId,
        userId: user.id,
      }));
      socket.close();
    }
    setSocket(null);
    setConnectionStatus('disconnected');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [socket, user, walkthroughId]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  useEffect(() => {
    if (user && walkthroughId) {
      setConnectionStatus('connecting');
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, walkthroughId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    lastMessage,
    activeSessions,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  };
}
