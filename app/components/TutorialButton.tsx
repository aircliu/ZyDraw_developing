import React from 'react';

const TutorialButton: React.FC = () => {
  const openTutorialVideo = () => {
    window.open('https://youtu.be/z_VnUCVN6tI', '_blank');
  };

  return (
    <button 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 1000000,
        fontSize: '16px',
        fontWeight: 'bold'
      }}
      onClick={openTutorialVideo}
    >
      Tutorial
    </button>
  );
};

export default TutorialButton;
