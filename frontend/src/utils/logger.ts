// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private getLevelPriority(level: LogLevel): number {
    const priorities = { debug: 0, info: 1, warn: 2, error: 3 };
    return priorities[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLevelPriority(level) >= this.getLevelPriority(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    let formatted = `${emoji[level]} [${level.toUpperCase()}] ${timestamp} - ${message}`;
    
    if (context) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return formatted;
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
    };
  }

  private getUserId(): string | undefined {
    try {
      // Try to get user ID from auth context or localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub;
      }
    } catch (error) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store critical logs in localStorage for debugging
    if (entry.level === 'error') {
      try {
        const errorLogs = JSON.parse(localStorage.getItem('persyste_error_logs') || '[]');
        errorLogs.push(entry);
        
        // Keep only last 50 error logs
        const trimmedLogs = errorLogs.slice(-50);
        localStorage.setItem('persyste_error_logs', JSON.stringify(trimmedLogs));
      } catch (error) {
        console.warn('Failed to store error log:', error);
      }
    }
  }

  private sendToRemote(entry: LogEntry): void {
    // Only send errors and warnings to remote logging service
    if (entry.level === 'error' || entry.level === 'warn') {
      // TODO: Implement remote logging service integration
      // Example: Send to your backend, Sentry, LogRocket, etc.
      if (!this.isDevelopment) {
        // fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // }).catch(() => {
        //   // Ignore remote logging errors
        // });
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context);
    this.storeLog(entry);

    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context);
    this.storeLog(entry);

    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context);
    this.storeLog(entry);
    this.sendToRemote(entry);

    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context);
    this.storeLog(entry);
    this.sendToRemote(entry);

    console.error(this.formatMessage('error', message, context));
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API request logging
  logApiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, {
      method,
      url,
      data: data ? JSON.stringify(data) : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  logApiResponse(method: string, url: string, status: number, data?: any, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
    
    this[level](`API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      data: data ? JSON.stringify(data) : undefined,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // User action logging
  logUserAction(action: string, details?: LogContext): void {
    this.info(`User Action: ${action}`, {
      action,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  // Error tracking helpers
  logComponentError(componentName: string, error: Error, props?: any): void {
    this.error(`Component Error in ${componentName}`, {
      componentName,
      error: error.message,
      stack: error.stack,
      props: props ? JSON.stringify(props) : undefined,
    });
  }

  logHookError(hookName: string, error: Error, dependencies?: any[]): void {
    this.error(`Hook Error in ${hookName}`, {
      hookName,
      error: error.message,
      stack: error.stack,
      dependencies: dependencies ? JSON.stringify(dependencies) : undefined,
    });
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('persyste_error_logs');
    this.info('Logs cleared');
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to: ${level}`);
  }
}

export const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global JavaScript Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason?.toString(),
    stack: event.reason?.stack,
  });
});

// Performance observer for monitoring
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) { // Log slow operations
        logger.warn('Slow Performance Detected', {
          name: entry.name,
          duration: `${entry.duration}ms`,
          entryType: entry.entryType,
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
}