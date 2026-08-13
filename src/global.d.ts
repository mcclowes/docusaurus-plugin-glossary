declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '@theme/Layout' {
  import type { ComponentType, PropsWithChildren } from 'react';

  const Layout: ComponentType<PropsWithChildren<{ title?: string; description?: string }>>;
  export default Layout;
}

declare module '@docusaurus/useGlobalData' {
  export function usePluginData(pluginName: string): unknown;
}
