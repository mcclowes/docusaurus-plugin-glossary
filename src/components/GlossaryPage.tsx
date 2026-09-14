import React from 'react';
import Layout from '@theme/Layout';
import Glossary from './Glossary.js';
import type { GlossaryData } from '../types.js';

export default function GlossaryPage({ glossaryData }: { glossaryData?: GlossaryData | null }) {
  return (
    <Layout
      title={glossaryData?.title || 'Glossary'}
      description="A glossary of terms and definitions"
    >
      <Glossary glossaryData={glossaryData} />
    </Layout>
  );
}
