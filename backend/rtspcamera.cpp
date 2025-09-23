#include "rtspcamera.h"
#include <QDebug>

RtspCamera::RtspCamera(const QString& rtspUrl, QObject* parent)
    : Camera(parent), workerThread(nullptr) {
    startStream(rtspUrl);
}

RtspCamera::~RtspCamera() {
    stopStream();
    if (workerThread) {
        workerThread->quit();
        workerThread->wait();
        delete workerThread;
        workerThread = nullptr;
    }
    if (camera.isOpened()) {
        camera.release();
    }
    qDebug() << "RTSP camera آزاد شد";
}

void RtspCamera::startStream(const QString& rtspUrl) {
    if (running) {
        stopStream();
    }
    currentUrl = rtspUrl;
    running = true;

    camera.open(rtspUrl.toStdString());
    if (!camera.isOpened()) {
        qWarning() << "خطا: RTSP stream باز نشد:" << rtspUrl;
        running = false;
        return;
    }

    workerThread = QThread::create([this]() { captureLoop(); });
    workerThread->start();
    qDebug() << "RTSP stream شروع شد:" << currentUrl;
}

void RtspCamera::stopStream() {
    running = false;
}

void RtspCamera::captureLoop() {
    cv::Mat frame;
    while (running) {
        if (!camera.read(frame)) {
            QThread::msleep(20); // Slightly longer delay to reduce CPU usage
            continue;
        }
        if (!frame.empty()) {
            QMutexLocker locker(&frameMutex);
            // Only update if we have a new frame
            if (latestFrame.empty() || frame.size() != latestFrame.size()) {
                frame.copyTo(latestFrame);
            } else {
                // Quick copy for same-size frames
                frame.copyTo(latestFrame);
            }
        } else {
            QThread::msleep(5); // Short delay for empty frames
        }
    }
}

bool RtspCamera::isConnected() const {
    return camera.isOpened();
}

bool RtspCamera::grabFrame(cv::Mat& frame) {
    if (!isConnected()) return false;
    QMutexLocker locker(&frameMutex);
    if (latestFrame.empty()) return false;
    latestFrame.copyTo(frame);
    return true;
}
