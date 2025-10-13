import React from 'react';
import BaslerDisplay from '../components/Camera/BaslerDisplay';
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
        <BaslerDisplay />
      </div>
    </PageContainer>
  );
};

export default CanvasTest;
