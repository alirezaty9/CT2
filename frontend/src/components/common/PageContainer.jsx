import React from 'react';

const PageContainer = ({ children, maxWidth = 'max-w-5xl' }) => {
  return (
    <div className="min-h-screen bg-background dark:bg-background font-vazir p-6">
      <div className={`${maxWidth} mx-auto`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;