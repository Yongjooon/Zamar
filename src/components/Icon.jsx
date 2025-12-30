import React from 'react';

export default function Icon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (name) {
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'chevLeft':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'chevRight':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path
            d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16v4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path
            d="M20 14a4 4 0 0 1-4 4H9l-5 3V6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 18a2.5 2.5 0 1 1-1-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 16a2.5 2.5 0 1 1-1-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
