import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { Home } from "./pages/Home";
import { CoursePage } from "./pages/CoursePage";
import { LessonPage } from "./pages/LessonPage";
import { MePage } from "./pages/MePage";
import { PinyinExercisePage } from "./pages/PinyinExercisePage";
import { WordSearchTeacher } from "./pages/WordSearchTeacher";
import { WordSearchGame } from "./pages/WordSearchGame";
import { BingoTeacher } from "./pages/BingoTeacher";
import { BingoGame } from "./pages/BingoGame";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="course/:courseId" element={<CoursePage />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="pinyin" element={<PinyinExercisePage />} />
          <Route path="word-search" element={<WordSearchTeacher />} />
          <Route path="word-search/:gameId" element={<WordSearchGame />} />
          <Route path="bingo" element={<BingoTeacher />} />
          <Route path="bingo/:gameId" element={<BingoGame />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
