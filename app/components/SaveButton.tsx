import React from 'react';

const SaveButton: React.FC = () => {

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
    >
      Save Design
    </button>
  );
};

export default SaveButton;
