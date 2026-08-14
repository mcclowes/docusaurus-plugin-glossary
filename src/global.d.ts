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

declare module '@docusaurus/Link' {
  import type { AnchorHTMLAttributes, ComponentType, PropsWithChildren } from 'react';

  type LinkProps = PropsWithChildren<
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }
  >;
  const Link: ComponentType<LinkProps>;
  export default Link;
}
