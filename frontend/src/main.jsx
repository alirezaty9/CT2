import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./styles/canvas-libraries.css";
import "./i18n";
import "./utils/debugLogger"; // Enable debug logging
import { ThemeProvider } from "./contexts/ThemeContext";
import { WebChannelProvider } from "./contexts/WebChannelContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { FormDataProvider } from "./contexts/FormDataContext";
import { CameraProvider } from "./contexts/CameraContext";
import { HistogramProvider } from "./contexts/HistogramContext";
import { LayerProvider } from "./contexts/LayerContext";
import { IntensityProfileProvider } from "./contexts/IntensityProfileContext";
import { XrayProvider } from "./contexts/XrayContext";
import { ImageProcessingProvider } from "./contexts/ImageProcessingContext";

ReactDOM.createRoot(document.getElementById("root")).render(

    <HashRouter>
      <ThemeProvider>
        <XrayProvider>
          <WebChannelProvider>
            <WebSocketProvider>
              <FormDataProvider>
                <CameraProvider>
                  <HistogramProvider>
                    <IntensityProfileProvider>
                      <ImageProcessingProvider>
                        <LayerProvider>
                          <App />
                        </LayerProvider>
                      </ImageProcessingProvider>
                    </IntensityProfileProvider>
                  </HistogramProvider>
                </CameraProvider>
              </FormDataProvider>
            </WebSocketProvider>
          </WebChannelProvider>
        </XrayProvider>
      </ThemeProvider>
    </HashRouter>

);