import React from 'react';
import EnhancedBaslerDisplay from '../components/Camera/EnhancedBaslerDisplay';
import PageContainer from '../components/common/PageContainer';

/**
 * صفحه تست برای Canvas پیشرفته
 */
const CanvasTest = () => {
  return (
    <PageContainer 
      title="تست Canvas پیشرفته"
      description="آزمایش ابزارهای رسم و ویرایش با کتابخانه‌های حرفه‌ای"
    >
      <div className="h-full">
        <EnhancedBaslerDisplay />
      </div>
    </PageContainer>
  );
};

export default CanvasTest;
