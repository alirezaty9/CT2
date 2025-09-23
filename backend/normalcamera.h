#ifndef NORMALCAMERA_H
#define NORMALCAMERA_H
#include "camera.h"
#include <opencv2/opencv.hpp>

class NormalCamera : public Camera {
    Q_OBJECT
public:
    explicit NormalCamera(int deviceId = 0, QObject* parent = nullptr);
    ~NormalCamera();
    bool isConnected() const override;
    bool grabFrame(cv::Mat& frame) override;
    QString getChannel() const override { return "basler"; }

private:
    cv::VideoCapture camera;
    int deviceId;
};
#endif // NORMALCAMERA_H
