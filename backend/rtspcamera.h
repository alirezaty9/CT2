#ifndef RTSPCAMERA_H
#define RTSPCAMERA_H
#include "camera.h"
#include <opencv2/opencv.hpp>
#include <QThread>
#include <QMutex>
#include <atomic>

class RtspCamera : public Camera {
    Q_OBJECT
public:
    explicit RtspCamera(const QString& rtspUrl, QObject* parent = nullptr);
    ~RtspCamera();
    bool isConnected() const override;
    bool grabFrame(cv::Mat& frame) override;
    QString getChannel() const override { return "monitoring"; }

public slots:
    void startStream(const QString& rtspUrl);
    void stopStream();

private:
    void captureLoop();
    cv::VideoCapture camera;
    QThread* workerThread;
    QMutex frameMutex;
    cv::Mat latestFrame;
    std::atomic<bool> running{false};
    QString currentUrl;
};
#endif // RTSPCAMERA_H
