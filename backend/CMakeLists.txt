cmake_minimum_required(VERSION 3.16)
project(backend LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets WebEngineWidgets WebSockets)
find_package(OpenCV REQUIRED)

add_executable(backend
    main.cpp
    backend.cpp
    backend.h
    camera.h
    normalcamera.cpp
    normalcamera.h
    rtspcamera.cpp
    rtspcamera.h
)

target_include_directories(backend PRIVATE ${OpenCV_INCLUDE_DIRS})

target_link_libraries(backend PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::WebSockets
    ${OpenCV_LIBS}
)

add_custom_command(TARGET backend POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/dist $<TARGET_FILE_DIR:backend>/dist
    COMMENT "Copying dist folder to output directory"
)
