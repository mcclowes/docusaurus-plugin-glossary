import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import GlossaryTerm from '@theme/GlossaryTerm';

// Export a function to avoid potential init order issues
export default function MDXComponentsWrapper() {
  return {
    ...MDXComponents,
    GlossaryTerm,
  };
}


