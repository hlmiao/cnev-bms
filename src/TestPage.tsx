import React from 'react';

export const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
      <h1>测试页面</h1>
      <p>如果你能看到这个页面，说明React基本渲染正常</p>
      <p>当前时间: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestPage;