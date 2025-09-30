import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./styles/canvas-libraries.css";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WebChannelProvider } from "./contexts/WebChannelContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { FormDataProvider } from "./contexts/FormDataContext";
import { CameraProvider } from "./contexts/CameraContext";
import { HistogramProvider } from "./contexts/HistogramContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <WebChannelProvider>
          <WebSocketProvider>
            <FormDataProvider>
              <CameraProvider>
                <HistogramProvider>
                  <App />
                </HistogramProvider>
              </CameraProvider>
            </FormDataProvider>
          </WebSocketProvider>
        </WebChannelProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);