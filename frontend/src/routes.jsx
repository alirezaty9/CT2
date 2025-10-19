import React from 'react';
import Home from "./pages/Home";
import InitialParameters from "./pages/InitialParameters";
import PositionAndOptimization from "./pages/PositionAndOptimization";
import ProjectionAcquisition from "./pages/ProjectionAcquisition";
import PostProcessing from "./pages/PostProcessing";
import Reconstruction from "./pages/Reconstruction";
import Layout from "./components/Layout";
import SettingsPage from "./pages/SettingsPage"; // صفحه جدید
import CanvasTest from "./pages/CanvasTest"; // صفحه تست Canvas


const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "initial", element: <InitialParameters /> },
      { path: "position", element: <PositionAndOptimization /> },
      { path: "projection", element: <ProjectionAcquisition /> },
      { path: "post-processing", element: <PostProcessing /> },
      { path: "reconstruction", element: <Reconstruction /> },
      { path: "settings", element: <SettingsPage /> }, // مسیر جدید
      { path: "canvas-test", element: <CanvasTest /> }, // تست Canvas پیشرفته

    ],
  },
];

export default routes;