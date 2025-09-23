#include "normalcamera.h"
#include <QDebug>

NormalCamera::NormalCamera(int deviceId, QObject* parent)
    : Camera(parent), deviceId(deviceId) {
    camera.open(deviceId);
    if (camera.isOpened()) {
        camera.set(cv::CAP_PROP_FRAME_WIDTH, 640);
        camera.set(cv::CAP_PROP_FRAME_HEIGHT, 480);
        camera.set(cv::CAP_PROP_FPS, 30);
        qDebug() << "دوربین معمولی متصل شد - device:" << deviceId;
    } else {
        qDebug() << "خطا: دوربین معمولی متصل نشد - device:" << deviceId;
    }
}

NormalCamera::~NormalCamera() {
    if (camera.isOpened()) {
        camera.release();
        qDebug() << "دوربین معمولی آزاد شد";
    }
}

bool NormalCamera::isConnected() const {
    return camera.isOpened();
}

bool NormalCamera::grabFrame(cv::Mat& frame) {
    if (!isConnected()) return false;
    return camera.read(frame);
}
