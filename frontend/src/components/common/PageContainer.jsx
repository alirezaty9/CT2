import React from 'react';

const PageContainer = ({ children, maxWidth = 'max-w-5xl' }) => {
  return (
    <div className="h-full bg-background dark:bg-background font-vazir overflow-auto">
      <div className={`${maxWidth} mx-auto p-2 sm:p-3 lg:p-4`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;