# Client Modules Deep Dive

## How getClientModules() Works

When you return a module path from `getClientModules()`, Docusaurus:

1. **Bundles it globally** into the client-side JavaScript
2. **Loads it before React** renders the initial UI
3. **Makes it available on every page** automatically
4. **Calls lifecycle hooks** when routes change

This is why you don't need manual imports in content files—the plugin's code is already present everywhere.

## The Image Zoom Plugin Pattern Explained

```typescript
// Plugin file: src/plugin.ts
module.exports = function(context, options) {
  return {
    name: 'docusaurus-plugin-image-zoom',
    getClientModules() {
      // This path is bundled into every page
      return [path.resolve(__dirname, './zoom')];
    }
  };
};

// Client file: src/zoom.ts
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import mediumZoom from 'medium-zoom';

export default (function() {
  // SSR guard - exit if running on server
  if (!ExecutionEnvironment.canUseDOM) {
    return null;
  }

  return {
    onRouteUpdate({ location }) {
      // This runs every time user navigates
      // Find all images in markdown content
      const selector = '.markdown img';

      // Initialize zoom on them
      mediumZoom(selector, {
        margin: 24,
        background: 'rgba(0, 0, 0, 0.9)'
      });
    }
  };
})();
```

## Why This Pattern is Elegant

1. **Infrastructure concern at app level**: Configured once in `docusaurus.config.js`
2. **No content pollution**: Markdown files stay clean, no imports
3. **Automatic enhancement**: Works on all existing and new images
4. **SPA-aware**: Reinitializes on client-side navigation
5. **SSR-safe**: Doesn't crash during server-side rendering

## When to Use Each Lifecycle Hook

### onRouteUpdate({ location, previousLocation })

**Timing**: During route transition (before page fully renders)

**Use for**:
- DOM manipulation that needs to happen ASAP
- Initializing third-party libraries on new content
- Cleaning up from previous route
- Setting up event listeners on new elements

**Example**:
```typescript
onRouteUpdate({ location }) {
  // Elements exist but may not be fully styled yet
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    highlightCode(block);
  });
}
```

### onRouteDidUpdate({ location, previousLocation })

**Timing**: After route transition completes

**Use for**:
- Analytics/tracking (you want the full page context)
- Scroll position restoration (DOM must be fully rendered)
- Operations that depend on computed styles or layout

**Example**:
```typescript
onRouteDidUpdate({ location, previousLocation }) {
  // Page is fully rendered and styled
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: location.pathname
    });
  }
}
```

## Advanced Patterns

### Pattern: Cleanup and Reinitialization

When using libraries that need explicit cleanup:

```typescript
let zoomInstance = null;

export default (function() {
  if (!ExecutionEnvironment.canUseDOM) return null;

  return {
    onRouteUpdate() {
      // Cleanup previous instance
      if (zoomInstance) {
        zoomInstance.detach();
        zoomInstance = null;
      }

      // Initialize new instance
      setTimeout(() => {
        zoomInstance = mediumZoom('.markdown img');
      }, 100);
    }
  };
})();
```

### Pattern: Configuration from Plugin Options

```typescript
// Plugin passes options to client via global data
export default function myPlugin(context, options) {
  return {
    name: 'my-plugin',

    async contentLoaded({ actions }) {
      actions.setGlobalData({
        config: options
      });
    },

    getClientModules() {
      return [require.resolve('./client')];
    },
  };
}

// Client reads config from global data
export default (function() {
  if (!ExecutionEnvironment.canUseDOM) return null;

  return {
    onRouteUpdate() {
      const globalData = (window as any).docusaurus?.globalData;
      const config = globalData?.['my-plugin']?.default?.config;

      if (config?.enabled) {
        // Use configuration
      }
    }
  };
})();
```

### Pattern: Conditional Enhancement by Route

```typescript
export default (function() {
  if (!ExecutionEnvironment.canUseDOM) return null;

  return {
    onRouteUpdate({ location }) {
      // Only enhance docs pages
      if (location.pathname.startsWith('/docs')) {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(addCopyButton);
      }
    }
  };
})();
```

### Pattern: Debounced Operations

```typescript
let debounceTimer: NodeJS.Timeout;

export default (function() {
  if (!ExecutionEnvironment.canUseDOM) return null;

  return {
    onRouteUpdate() {
      // Clear previous debounce
      clearTimeout(debounceTimer);

      // Debounce expensive operations
      debounceTimer = setTimeout(() => {
        const images = document.querySelectorAll('.markdown img');
        images.forEach(lazyLoadImage);
      }, 300);
    }
  };
})();
```

## Common Pitfalls and Solutions

### Pitfall 1: DOM Elements Not Ready

**Problem**: Elements don't exist when `onRouteUpdate` runs

**Solution**: Use `setTimeout` with small delay

```typescript
onRouteUpdate() {
  setTimeout(() => {
    const elements = document.querySelectorAll('.my-class');
    // Now elements exist
  }, 0);
}
```

### Pitfall 2: Memory Leaks from Event Listeners

**Problem**: Adding listeners on every route change without cleanup

**Solution**: Track and remove old listeners

```typescript
let listeners = [];

onRouteUpdate() {
  // Remove old listeners
  listeners.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler);
  });
  listeners = [];

  // Add new listeners
  document.querySelectorAll('.my-button').forEach(button => {
    const handler = () => console.log('clicked');
    button.addEventListener('click', handler);
    listeners.push({ element: button, event: 'click', handler });
  });
}
```

### Pitfall 3: Server-Side APIs in Client Code

**Problem**: Using Node.js APIs that don't exist in browser

**Solution**: Always check `ExecutionEnvironment.canUseDOM`

```typescript
// ❌ BAD - crashes during SSR
import fs from 'fs';

// ✅ GOOD - safe check
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (!ExecutionEnvironment.canUseDOM) {
  export default null;
}
```

### Pitfall 4: Heavy Operations Blocking Navigation

**Problem**: Long-running code delays page transitions

**Solution**: Use `requestIdleCallback` or web workers

```typescript
onRouteUpdate() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Do expensive work when browser is idle
    });
  } else {
    setTimeout(() => {
      // Fallback for browsers without requestIdleCallback
    }, 100);
  }
}
```

## Testing Your Client Module

### 1. Development Testing

```bash
npm run dev
# In another terminal
cd ../your-docusaurus-site
npm install ../docusaurus-plugin-starter
npm start
```

Open browser console and check for:
- Your debug logs
- No JavaScript errors
- Elements being enhanced correctly

### 2. Production Testing

```bash
npm run build
npm run serve
```

Check that:
- No SSR errors during build
- Client module works in production build
- No console errors

### 3. SSR Safety Testing

Look for these errors during build:

```
ReferenceError: window is not defined
ReferenceError: document is not defined
```

If you see these, you forgot the `ExecutionEnvironment.canUseDOM` check.

## Real-World Plugin Examples to Study

1. **docusaurus-plugin-image-zoom**
   - DOM enhancement with medium-zoom
   - Clean reinitialization pattern

2. **@docusaurus/plugin-google-gtag**
   - Analytics tracking
   - onRouteDidUpdate for page views

3. **docusaurus-plugin-sass**
   - Build-time processing (no client module)

4. **@docusaurus/plugin-pwa**
   - Service worker registration
   - Global state management

5. **docusaurus-lunr-search**
   - Search index loading
   - Global UI injection
