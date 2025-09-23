#include "backend.h"
#include "rtspcamera.h"
#include <QDebug>
#include <QAbstractSocket>
#include <QJsonDocument>
#include <QJsonObject>
#include <QElapsedTimer>
#include <QDateTime>
#include <opencv2/opencv.hpp>
#include <chrono>
#include <algorithm>

Backend::Backend(QWebEngineView* view, QObject* parent)
    : QObject(parent), frameCounter(0) {

    webSocketServer = new QWebSocketServer("FormServer", QWebSocketServer::NonSecureMode, this);
    connect(webSocketServer, &QWebSocketServer::newConnection, this, &Backend::onNewConnection);

    if (!webSocketServer->listen(QHostAddress::Any, 12345)) {
        qDebug() << "خطا: سرور WebSocket نتوانست روی پورت 12345 گوش کند";
    } else {
        qDebug() << "سرور WebSocket روی پورت 12345 شروع به کار کرد";
    }

    timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &Backend::processFrames);

    // اضافه کردن RTSP camera برای monitoring
    QString rtspUrl = "rtsp://admin:Admin12345@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0";
    cameras << new RtspCamera(rtspUrl, this);
    qDebug() << "RTSP camera اضافه شد:" << rtspUrl;

    // Optimized frame intervals for better performance
    cameraIntervals["monitoring"] = 40;  // 25 FPS for RTSP (more efficient)
    cameraIntervals["basler"] = 50;      // 20 FPS for Basler (consistent)

    // Initialize timing variables
    qint64 currentTime = QDateTime::currentMSecsSinceEpoch();
    for (Camera* camera : cameras) {
        QString channel = camera->getChannel();
        cameraCounters[channel] = 0;
        cameraFailed[channel] = !camera->isConnected();
        lastFrameTime[channel] = currentTime;
    }
    
    // Initialize fake Basler camera
    cameraCounters["basler"] = 0;
    cameraFailed["basler"] = false;
    lastFrameTime["basler"] = currentTime;
    
    // Performance monitoring initialization
    lastPerformanceReport = currentTime;
    processedFrames = 0;
    
    // Frame caching initialization
    frameChangeThreshold["monitoring"] = 5000; // 5% change threshold for RTSP
    frameChangeThreshold["basler"] = 2000; // 2% change threshold for Basler (more sensitive)
    
    // Client management initialization
    lastClientCleanup = currentTime;

    qDebug() << "Backend آماده است - تعداد دوربین‌ها:" << cameras.size();
}

Backend::~Backend() {
    for (QWebSocket* client : clients) {
        client->deleteLater();
    }
    qDeleteAll(cameras);
    webSocketServer->close();
    qDebug() << "Backend آزاد شد";
}

void Backend::onNewConnection() {
    QWebSocket* client = webSocketServer->nextPendingConnection();
    connect(client, &QWebSocket::disconnected, this, &Backend::onClientDisconnected);
    connect(client, &QWebSocket::textMessageReceived, this, &Backend::onTextMessageReceived);

    clients << client;
    qDebug() << "کلاینت جدید متصل شد. تعداد:" << clients.size();

    if (!timer->isActive()) {
        timer->start(timerInterval); // 1ms برای دقت بالا
        qDebug() << "تایمر شروع شد با فاصله" << timerInterval << "ms";
    }
}

void Backend::onClientDisconnected() {
    QWebSocket* client = qobject_cast<QWebSocket*>(sender());
    if (client) {
        clients.removeAll(client);
        client->deleteLater();
        qDebug() << "کلاینت قطع شد. تعداد:" << clients.size();

        if (clients.isEmpty()) {
            timer->stop();
            qDebug() << "تایمر متوقف شد - هیچ کلاینتی متصل نیست";
        }
    }
}

Camera* Backend::getCameraByChannel(const QString& channel) {
    for (Camera* camera : cameras) {
        if (camera->getChannel() == channel) {
            return camera;
        }
    }
    return nullptr;
}

cv::Mat Backend::createFakeFrame(const QString& cameraType, int frameNumber) {
    static cv::Mat baslerTemplate; // Cache template for better performance
    
    if (cameraType == "basler") {
        // Create higher resolution frame for better quality
        cv::Mat frame = cv::Mat::zeros(480, 640, CV_8UC3);
        
        // Smooth gradient background with time-based animation
        float timePhase = frameNumber * 0.05f; // Smoother animation
        
        // Create gradient background
        for (int y = 0; y < frame.rows; ++y) {
            for (int x = 0; x < frame.cols; ++x) {
                float normalizedX = static_cast<float>(x) / frame.cols;
                float normalizedY = static_cast<float>(y) / frame.rows;
                
                // Dynamic gradient with smooth color transitions
                int r = static_cast<int>(120 + 60 * sin(timePhase + normalizedX * 2.0f) * cos(normalizedY * 1.5f));
                int g = static_cast<int>(100 + 40 * cos(timePhase * 0.8f + normalizedY * 2.0f));
                int b = static_cast<int>(80 + 50 * sin(timePhase * 1.2f + (normalizedX + normalizedY) * 1.8f));
                
                r = std::clamp(r, 50, 200);
                g = std::clamp(g, 40, 180);
                b = std::clamp(b, 30, 160);
                
                frame.at<cv::Vec3b>(y, x) = cv::Vec3b(b, g, r);
            }
        }
        
        // Professional-looking header
        cv::rectangle(frame, cv::Point(0, 0), cv::Point(frame.cols, 60), cv::Scalar(20, 20, 20), -1);
        cv::putText(frame, "BASLER acA1300-60gm (Simulated)", cv::Point(20, 25), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.6, cv::Scalar(200, 200, 200), 1);
        cv::putText(frame, "Frame: " + std::to_string(frameNumber), cv::Point(20, 45), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(150, 150, 150), 1);
        
        // Timestamp
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::string timeStr = std::to_string(time_t);
        cv::putText(frame, "TS: " + timeStr.substr(timeStr.length() - 6), 
                    cv::Point(frame.cols - 120, 25), cv::FONT_HERSHEY_SIMPLEX, 0.4, 
                    cv::Scalar(150, 150, 150), 1);
        
        // Animated crosshair in center
        int centerX = frame.cols / 2;
        int centerY = frame.rows / 2;
        int crossSize = 30 + 10 * sin(timePhase * 2.0f);
        cv::line(frame, cv::Point(centerX - crossSize, centerY), 
                 cv::Point(centerX + crossSize, centerY), cv::Scalar(0, 255, 0), 2);
        cv::line(frame, cv::Point(centerX, centerY - crossSize), 
                 cv::Point(centerX, centerY + crossSize), cv::Scalar(0, 255, 0), 2);
        
        // Orbiting circle (simulating detected object)
        float orbitRadius = 80.0f;
        float orbitAngle = timePhase;
        int orbitX = centerX + static_cast<int>(orbitRadius * cos(orbitAngle));
        int orbitY = centerY + static_cast<int>(orbitRadius * sin(orbitAngle));
        cv::circle(frame, cv::Point(orbitX, orbitY), 15, cv::Scalar(255, 100, 0), -1);
        cv::circle(frame, cv::Point(orbitX, orbitY), 20, cv::Scalar(255, 255, 255), 2);
        
        // Grid overlay for measurement reference
        cv::Scalar gridColor(80, 80, 80);
        for (int x = 80; x < frame.cols; x += 80) {
            cv::line(frame, cv::Point(x, 60), cv::Point(x, frame.rows), gridColor, 1);
        }
        for (int y = 80; y < frame.rows; y += 80) {
            cv::line(frame, cv::Point(0, y), cv::Point(frame.cols, y), gridColor, 1);
        }
        
        // Status indicators
        cv::rectangle(frame, cv::Point(frame.cols - 150, 70), 
                      cv::Point(frame.cols - 10, 120), cv::Scalar(40, 40, 40), -1);
        cv::putText(frame, "STATUS: ACTIVE", cv::Point(frame.cols - 140, 90), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.4, cv::Scalar(0, 255, 0), 1);
        cv::putText(frame, "FPS: 20", cv::Point(frame.cols - 140, 105), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.4, cv::Scalar(200, 200, 200), 1);
        
        return frame;
        
    } else if (cameraType == "monitoring") {
        cv::Mat frame = cv::Mat::zeros(240, 320, CV_8UC3);
        
        // Dark background with subtle pattern
        cv::Scalar bgColor(30, 30, 40);
        frame.setTo(bgColor);
        
        // Add noise pattern to simulate disconnected camera
        cv::Mat noise(frame.size(), CV_8UC3);
        cv::randu(noise, cv::Scalar(0, 0, 0), cv::Scalar(50, 50, 50));
        cv::addWeighted(frame, 0.8, noise, 0.2, 0, frame);
        
        // Warning message
        cv::putText(frame, "RTSP CONNECTION LOST", cv::Point(20, 100), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 100, 255), 1);
        cv::putText(frame, "Attempting reconnection...", cv::Point(30, 130), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.4, cv::Scalar(200, 200, 200), 1);
        
        // Animated connection indicator
        int phase = (frameNumber / 10) % 4;
        std::string dots(phase + 1, '.');
        cv::putText(frame, "Connecting" + dots, cv::Point(60, 160), 
                    cv::FONT_HERSHEY_SIMPLEX, 0.4, cv::Scalar(255, 255, 0), 1);
        
        // Pulsing indicator
        int pulseAlpha = 100 + 100 * sin(frameNumber * 0.2f);
        cv::circle(frame, cv::Point(160, 200), 8, cv::Scalar(0, pulseAlpha, 255), -1);
        
        return frame;
    }
    
    return cv::Mat::zeros(240, 320, CV_8UC3);
}

void Backend::encodeAndSendFrame(cv::Mat& frame, const QString& channel) {
    if (frame.empty() || clients.isEmpty()) {
        return;
    }

    // Check if frame has changed significantly (skip encoding if not)
    if (!hasFrameChanged(frame, channel)) {
        // Reuse cached encoded frame
        if (lastEncodedFrames.contains(channel)) {
            sendImage(channel, lastEncodedFrames[channel]);
            return;
        }
    }

    // Use static buffers to avoid repeated allocations
    static thread_local std::vector<uchar> buffer;
    buffer.clear();
    buffer.reserve(frame.cols * frame.rows); // Pre-allocate reasonable size
    
    // Optimized encoding parameters per channel
    static const std::vector<int> monitoringParams = {
        cv::IMWRITE_JPEG_QUALITY, 55, 
        cv::IMWRITE_JPEG_OPTIMIZE, 1,
        cv::IMWRITE_JPEG_PROGRESSIVE, 0
    };
    static const std::vector<int> baslerParams = {
        cv::IMWRITE_JPEG_QUALITY, 75, 
        cv::IMWRITE_JPEG_OPTIMIZE, 1,
        cv::IMWRITE_JPEG_PROGRESSIVE, 0
    };

    const std::vector<int>& encodeParams = (channel == "monitoring") ? monitoringParams : baslerParams;

    if (!cv::imencode(".jpg", frame, buffer, encodeParams)) {
        qDebug() << "خطا: رمزگذاری JPEG برای کانال" << channel << "ناموفق بود";
        return;
    }

    // Create byte array and cache it
    QByteArray byteArray(reinterpret_cast<const char*>(buffer.data()), 
                         static_cast<int>(buffer.size()));
    
    // Cache the frame and encoded data
    cacheFrame(frame, byteArray, channel);
    
    // Send the image
    sendImage(channel, byteArray);
}

void Backend::sendImage(const QString& channel, const QByteArray& imageData) {
    if (clients.isEmpty()) {
        return;
    }

    // Use static buffer for base64 encoding to avoid repeated allocations
    static thread_local QByteArray base64Buffer;
    base64Buffer.clear();
    base64Buffer.reserve(imageData.size() * 4 / 3 + 4); // Base64 expansion factor
    
    // Efficient base64 encoding
    base64Buffer = imageData.toBase64(QByteArray::Base64Encoding | QByteArray::OmitTrailingEquals);
    
    // Build message with efficient string operations
    static thread_local QString messageBuffer;
    messageBuffer.clear();
    messageBuffer.reserve(channel.length() + base64Buffer.length() + 1);
    messageBuffer = channel + ":" + QString::fromLatin1(base64Buffer);

    // Send to connected clients only (disconnected ones handled by periodic cleanup)
    int sentCount = 0;
    for (QWebSocket* client : clients) {
        if (client->state() == QAbstractSocket::ConnectedState) {
            client->sendTextMessage(messageBuffer);
            sentCount++;
        }
    }
    
    // Optional: Log if no clients received the message
    if (sentCount == 0 && !clients.isEmpty()) {
        qDebug() << "Warning: No active clients to receive" << channel << "frame";
    }
}

void Backend::processFrames() {
    if (clients.isEmpty()) {
        return;
    }

    frameCounter++;
    qint64 currentTime = QDateTime::currentMSecsSinceEpoch();

    // Connection check with reduced frequency
    connectionCheckCounter += timerInterval;
    if (connectionCheckCounter >= connectionCheckInterval) {
        checkCameraConnections();
        connectionCheckCounter = 0;
    }

    bool anyActive = false;
    
    // Process RTSP monitoring camera
    QString rtspChannel = "monitoring";
    if (currentTime - lastFrameTime[rtspChannel] >= cameraIntervals[rtspChannel]) {
        Camera* rtspCamera = getCameraByChannel(rtspChannel);
        cv::Mat frame;

        if (rtspCamera && rtspCamera->isConnected() && rtspCamera->grabFrame(frame) && !frame.empty()) {
            // Resize for optimal performance
            cv::Mat resizedFrame;
            cv::resize(frame, resizedFrame, cv::Size(320, 240), 0, 0, cv::INTER_LINEAR);
            encodeAndSendFrame(resizedFrame, rtspChannel);
            cameraFailed[rtspChannel] = false;
            anyActive = true;
            processedFrames++;
        } else {
            // Fallback to fake frame
            cv::Mat fakeFrame = createFakeFrame("monitoring", frameCounter);
            encodeAndSendFrame(fakeFrame, rtspChannel);
            cameraFailed[rtspChannel] = true;
        }
        lastFrameTime[rtspChannel] = currentTime;
    } else {
        if (!cameraFailed[rtspChannel]) {
            anyActive = true;
        }
    }

    // Process fake Basler camera
    QString baslerChannel = "basler";
    if (currentTime - lastFrameTime[baslerChannel] >= cameraIntervals[baslerChannel]) {
        cv::Mat fakeFrame = createFakeFrame("basler", frameCounter);
        encodeAndSendFrame(fakeFrame, baslerChannel);
        cameraFailed[baslerChannel] = false;
        anyActive = true;
        processedFrames++;
        lastFrameTime[baslerChannel] = currentTime;
    } else {
        anyActive = true; // Basler fake is always considered active
    }

    // Performance monitoring (every 10 seconds)
    if (currentTime - lastPerformanceReport >= 10000) {
        double fps = processedFrames / 10.0;
        qDebug() << "Performance: Processed" << processedFrames << "frames in 10s, avg FPS:" << fps;
        processedFrames = 0;
        lastPerformanceReport = currentTime;
    }
    
    // Client cleanup (every 30 seconds)
    if (currentTime - lastClientCleanup >= clientCleanupInterval) {
        cleanupDisconnectedClients();
        lastClientCleanup = currentTime;
    }

    if (!anyActive) {
        timer->stop();
        qDebug() << "Timer stopped: All cameras disconnected";
    }
}

bool Backend::hasFrameChanged(const cv::Mat& newFrame, const QString& channel) {
    if (!lastRawFrames.contains(channel) || lastRawFrames[channel].empty()) {
        return true; // First frame or no cached frame
    }
    
    const cv::Mat& lastFrame = lastRawFrames[channel];
    
    // Quick size check
    if (newFrame.size() != lastFrame.size() || newFrame.type() != lastFrame.type()) {
        return true;
    }
    
    // Calculate difference using efficient method
    cv::Mat diff;
    cv::absdiff(newFrame, lastFrame, diff);
    cv::Scalar meanDiff = cv::mean(diff);
    
    // Calculate total difference (sum of all channels)
    double totalDiff = meanDiff[0] + meanDiff[1] + meanDiff[2];
    int threshold = frameChangeThreshold.value(channel, 3000);
    
    return totalDiff > threshold;
}

void Backend::cacheFrame(const cv::Mat& frame, const QByteArray& encodedData, const QString& channel) {
    // Cache the raw frame for comparison
    frame.copyTo(lastRawFrames[channel]);
    
    // Cache the encoded data
    lastEncodedFrames[channel] = encodedData;
}

void Backend::cleanupDisconnectedClients() {
    QList<QWebSocket*> disconnectedClients;
    
    for (QWebSocket* client : clients) {
        if (client->state() != QAbstractSocket::ConnectedState) {
            disconnectedClients.append(client);
        }
    }
    
    if (!disconnectedClients.isEmpty()) {
        for (QWebSocket* client : disconnectedClients) {
            clients.removeAll(client);
            client->deleteLater();
        }
        qDebug() << "Periodic cleanup: removed" << disconnectedClients.size() << "disconnected clients";
        qDebug() << "Active clients:" << clients.size();
    }
}

void Backend::checkCameraConnections() {
    // Quick RTSP reconnection attempt
    Camera* rtspCamera = getCameraByChannel("monitoring");
    if (rtspCamera && !rtspCamera->isConnected()) {
        qDebug() << "Attempting RTSP reconnection";
        static_cast<RtspCamera*>(rtspCamera)->startStream("rtsp://admin:Admin12345@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0");
        cameraFailed["monitoring"] = !rtspCamera->isConnected();
    }
}

void Backend::onTextMessageReceived(const QString& message) {
    qDebug() << "پیام دریافتی:" << message;

    int separatorIndex = message.indexOf(':');
    if (separatorIndex == -1) {
        sendResponse("Error: Invalid message format");
        return;
    }

    QString type = message.left(separatorIndex);
    QString data = message.mid(separatorIndex + 1);

    if (type == "AllFormData") {
        QJsonDocument doc = QJsonDocument::fromJson(data.toUtf8());
        if (!doc.isNull() && doc.isObject()) {
            qDebug() << "داده‌های فرم دریافت شد";
            sendResponse("داده‌های فرم با موفقیت دریافت شد");
        } else {
            sendResponse("Error: Invalid JSON");
        }
    } else {
        qDebug() << "نوع پیام ناشناخته:" << type;
        sendResponse("پیام دریافت شد: " + type);
    }
}

void Backend::sendResponse(const QString& response) {
    for (QWebSocket* client : clients) {
        if (client->state() == QAbstractSocket::ConnectedState) {
            client->sendTextMessage("response:" + response);
        }
    }
}
