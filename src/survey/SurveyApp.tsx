import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SurveyPage } from './views/SurveyPage';
import './survey.css';

function NotFound() {
  return (
    <div className="center-msg">
      <p>설문 링크가 올바르지 않습니다.</p>
    </div>
  );
}

/** 설문 모드(VITE_APP_MODE=survey)의 루트. 기존 JoyCraft 화면은 여기서 전혀 로드되지 않는다 */
export default function SurveyApp() {
  useEffect(() => {
    document.title = '설문 조사';
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:code" element={<SurveyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
