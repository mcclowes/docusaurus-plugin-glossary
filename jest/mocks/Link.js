import React from 'react';

export default function MockLink({ to, children, ...props }) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}
