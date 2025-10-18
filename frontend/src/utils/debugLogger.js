/**
 * Debug Logger Utility
 * برای track کردن renders و performance
 */

const DEBUG_ENABLED = true; // تنظیم روی false در production

const colors = {
  render: '#9C27B0',      // بنفش - برای renders
  context: '#2196F3',     // آبی - برای context updates
  effect: '#FF9800',      // نارنجی - برای useEffect
  websocket: '#4CAF50',   // سبز - برای WebSocket
  performance: '#F44336', // قرمز - برای performance issues
  info: '#607D8B'         // خاکستری - برای اطلاعات عمومی
};

class DebugLogger {
  constructor() {
    this.renderCounts = {};
    this.startTime = Date.now();
  }

  /**
   * Log کردن render یک component
   */
  logRender(componentName, props = {}, reason = '') {
    if (!DEBUG_ENABLED) return;

    // شمارش تعداد renders
    this.renderCounts[componentName] = (this.renderCounts[componentName] || 0) + 1;
    const count = this.renderCounts[componentName];

    const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(
      `%c[RENDER #${count}] %c${componentName} %c(${timestamp}s)`,
      `color: ${colors.render}; font-weight: bold`,
      'color: #333; font-weight: bold',
      'color: #999; font-size: 0.9em'
    );

    if (reason) {
      console.log(`  └─ Reason: ${reason}`);
    }

    if (Object.keys(props).length > 0) {
      console.log('  └─ Props:', props);
    }

    // Warning برای renders زیاد
    if (count > 10 && count % 5 === 0) {
      console.warn(
        `%c⚠️ ${componentName} rendered ${count} times!`,
        `color: ${colors.performance}; font-weight: bold`
      );
    }
  }

  /**
   * Log کردن Context update
   */
  logContext(contextName, updates = {}) {
    if (!DEBUG_ENABLED) return;

    const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(
      `%c[CONTEXT] %c${contextName} %c(${timestamp}s)`,
      `color: ${colors.context}; font-weight: bold`,
      'color: #333; font-weight: bold',
      'color: #999; font-size: 0.9em'
    );

    if (Object.keys(updates).length > 0) {
      console.log('  └─ Updates:', updates);
    }
  }

  /**
   * Log کردن useEffect
   */
  logEffect(componentName, effectName, dependencies = []) {
    if (!DEBUG_ENABLED) return;

    const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(
      `%c[EFFECT] %c${componentName}.${effectName} %c(${timestamp}s)`,
      `color: ${colors.effect}; font-weight: bold`,
      'color: #333',
      'color: #999; font-size: 0.9em'
    );

    if (dependencies.length > 0) {
      console.log('  └─ Dependencies:', dependencies);
    }
  }

  /**
   * Log کردن WebSocket events
   */
  logWebSocket(event, data = {}) {
    if (!DEBUG_ENABLED) return;

    const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(
      `%c[WEBSOCKET] %c${event} %c(${timestamp}s)`,
      `color: ${colors.websocket}; font-weight: bold`,
      'color: #333; font-weight: bold',
      'color: #999; font-size: 0.9em'
    );

    if (Object.keys(data).length > 0) {
      console.log('  └─ Data:', data);
    }
  }

  /**
   * Log کردن Performance metrics
   */
  logPerformance(operation, duration) {
    if (!DEBUG_ENABLED) return;

    const color = duration > 100 ? colors.performance : colors.info;
    const icon = duration > 100 ? '🐌' : '⚡';

    console.log(
      `%c[PERFORMANCE] ${icon} %c${operation}: ${duration.toFixed(2)}ms`,
      `color: ${color}; font-weight: bold`,
      `color: ${color}`
    );

    if (duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * نمایش خلاصه statistics
   */
  logStats() {
    if (!DEBUG_ENABLED) return;

    console.group('%c📊 Render Statistics', 'color: #2196F3; font-weight: bold; font-size: 14px');

    const sorted = Object.entries(this.renderCounts)
      .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([component, count]) => {
      const color = count > 10 ? colors.performance : colors.info;
      console.log(
        `%c${component}: %c${count} renders`,
        'color: #333; font-weight: bold',
        `color: ${color}`
      );
    });

    console.groupEnd();
  }

  /**
   * Reset کردن counters
   */
  reset() {
    this.renderCounts = {};
    this.startTime = Date.now();
    console.clear();
    console.log('%c🔄 Debug Logger Reset', 'color: #4CAF50; font-weight: bold; font-size: 14px');
  }

  /**
   * Group logging
   */
  group(name, color = colors.info) {
    if (!DEBUG_ENABLED) return;
    console.group(`%c${name}`, `color: ${color}; font-weight: bold`);
  }

  groupEnd() {
    if (!DEBUG_ENABLED) return;
    console.groupEnd();
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Make it globally accessible for console debugging
if (typeof window !== 'undefined') {
  window.debugLogger = debugLogger;
  window.showRenderStats = () => debugLogger.logStats();
  window.resetDebugLogger = () => debugLogger.reset();

  console.log('%c🔍 Debug Logger Active', 'color: #4CAF50; font-weight: bold; font-size: 14px');
  console.log('%cCommands available:', 'color: #2196F3; font-weight: bold');
  console.log('  • showRenderStats() - نمایش آمار renders');
  console.log('  • resetDebugLogger() - ریست کردن counters');
  console.log('  • debugLogger - دسترسی مستقیم به logger');
}

// Export برای استفاده در components
export default debugLogger;

// Helper hooks
export const useRenderLogger = (componentName, props = {}) => {
  if (!DEBUG_ENABLED) return;

  // Log در هر render
  debugLogger.logRender(componentName, props);
};

export const useEffectLogger = (componentName, effectName, dependencies) => {
  if (!DEBUG_ENABLED) return () => {};

  return () => {
    debugLogger.logEffect(componentName, effectName, dependencies);
  };
};
