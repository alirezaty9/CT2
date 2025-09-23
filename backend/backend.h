#ifndef BACKEND_H
#define BACKEND_H

#include <QObject>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QWebEngineView>
#include <QJsonDocument>
#include <QJsonObject>
#include <QTimer>
#include <QMap>
#include <opencv2/opencv.hpp>

class Camera;

class Backend : public QObject {
    Q_OBJECT

public:
    explicit Backend(QWebEngineView* view, QObject* parent = nullptr);
    ~Backend();

private slots:
    void onNewConnection();
    void onClientDisconnected();
    void onTextMessageReceived(const QString& message);
    void processFrames();

private:
    void processInitialParameters(const QString& data);
    void sendResponse(const QString& response);
    cv::Mat createFakeFrame(const QString& cameraType, int frameNumber);
    void sendImage(const QString& channel, const QByteArray& imageData);
    void encodeAndSendFrame(cv::Mat& frame, const QString& channel);
    void checkCameraConnections();
    Camera* getCameraByChannel(const QString& channel);
    bool hasFrameChanged(const cv::Mat& newFrame, const QString& channel);
    void cacheFrame(const cv::Mat& frame, const QByteArray& encodedData, const QString& channel);
    void cleanupDisconnectedClients();

    QWebSocketServer* webSocketServer;
    QList<QWebSocket*> clients;
    QTimer* timer;
    QList<Camera*> cameras;
    int frameCounter;

    // Optimized timing settings for better performance
    const int timerInterval = 5; // Reduced to 5ms for better CPU efficiency
    
    // Smart timing management
    QMap<QString, int> cameraIntervals; // Frame intervals per camera
    QMap<QString, int> cameraCounters;  // Frame counters per camera
    QMap<QString, bool> cameraFailed;   // Error status per camera
    QMap<QString, qint64> lastFrameTime; // Last frame timestamp for each camera
    
    // Connection management optimization
    int connectionCheckCounter = 0;
    const int connectionCheckInterval = 5000; // Check every 5 seconds (reduced overhead)
    
    // Performance monitoring
    qint64 lastPerformanceReport = 0;
    int processedFrames = 0;
    
    // Frame caching for optimization
    QMap<QString, QByteArray> lastEncodedFrames; // Cache last encoded frame per channel
    QMap<QString, int> frameChangeThreshold; // Threshold for frame change detection
    QMap<QString, cv::Mat> lastRawFrames; // Cache raw frames for comparison
    
    // Client connection management
    qint64 lastClientCleanup = 0;
    const int clientCleanupInterval = 30000; // Clean up every 30 seconds
};

#endif // BACKEND_H
