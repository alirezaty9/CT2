#include <QApplication>
#include <QWebEngineView>
#include <QDir>
#include <QUrl>
#include "backend.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    QWebEngineView view;
    Backend backend(&view);

    QString exeDir = QCoreApplication::applicationDirPath();
    QString indexPath = QDir(exeDir).filePath("dist/index.html");

    view.load(QUrl::fromLocalFile(indexPath));
    view.resize(1024, 768);
    view.show();

    return app.exec();
}
