// src/contexts/WebChannelContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const WebChannelContext = createContext();

export const WebChannelProvider = ({ children }) => {
  const [backend, setBackend] = useState(null);

  useEffect(() => {
    const initWebChannel = () => {
      if (window.qt && window.qt.webChannelTransport && window.QWebChannel) {
        new window.QWebChannel(window.qt.webChannelTransport, (channel) => {
          if (channel?.objects?.backend) {
            setBackend(channel.objects.backend);
          } else {
            console.error("WebChannel backend object not found.");
          }
        });
      } else {
        // Retry after short delay if not ready
        setTimeout(initWebChannel, 100);
      }
    };

    initWebChannel();
  }, []);

  return (
    <WebChannelContext.Provider value={{ backend }}>
      {children}
    </WebChannelContext.Provider>
  );
};

export const useWebChannel = () => useContext(WebChannelContext);
