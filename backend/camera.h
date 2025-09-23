#ifndef CAMERA_H
#define CAMERA_H
#include <QObject>
#include <opencv2/opencv.hpp>

class Camera : public QObject {
    Q_OBJECT
public:
    explicit Camera(QObject* parent = nullptr) : QObject(parent) {}
    virtual ~Camera() {}
    virtual bool isConnected() const = 0;
    virtual bool grabFrame(cv::Mat& frame) = 0;
    virtual QString getChannel() const = 0;
};
#endif // CAMERA_H
