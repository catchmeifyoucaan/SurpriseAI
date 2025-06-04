
import React from 'react';
import EmailComposer from '../components/EmailComposer';

const ComposePage: React.FC = () => {
  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-2">Compose Message</h1>
      <EmailComposer />
    </div>
  );
};

export default ComposePage;
