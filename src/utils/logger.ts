// Logging Utilities
import { env } from '../config/env';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
  userId?: string;
  sessionId?: string;
}

// Logger class
class Logger {
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.enableConsole = env.LOG_CONSOLE;
  }

  private getLogLevelFromEnv(): LogLevel {
    switch (env.LOG_LEVEL) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string
  ): LogEntry {
    return {
      level,
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context or localStorage
    try {
      const user = localStorage.getItem('spes_user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('spes_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('spes_session_id', sessionId);
    }
    return sessionId;
  }

  private addToLogs(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const { level, message, data, context, timestamp } = entry;
    const prefix = `[${timestamp}] [${LogLevel[level]}]${context ? ` [${context}]` : ''}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data);
        break;
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Only send errors and warnings to external services in production
    if (import.meta.env.PROD && entry.level >= LogLevel.WARN) {
      try {
        // Here you would send to Sentry, LogRocket, etc.
        // For now, we'll just log to console
        console.log('Would send to external service:', entry);
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  private async log(level: LogLevel, message: string, data?: any, context?: string): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, context);
    
    this.addToLogs(entry);
    this.outputToConsole(entry);
    await this.sendToExternalService(entry);
  }

  // Public logging methods
  public async debug(message: string, data?: any, context?: string): Promise<void> {
    await this.log(LogLevel.DEBUG, message, data, context);
  }

  public async info(message: string, data?: any, context?: string): Promise<void> {
    await this.log(LogLevel.INFO, message, data, context);
  }

  public async warn(message: string, data?: any, context?: string): Promise<void> {
    await this.log(LogLevel.WARN, message, data, context);
  }

  public async error(message: string, data?: any, context?: string): Promise<void> {
    await this.log(LogLevel.ERROR, message, data, context);
  }

  // Specialized logging methods
  public async apiCall(method: string, url: string, data?: any): Promise<void> {
    await this.debug(`API ${method} ${url}`, data, 'API');
  }

  public async apiResponse(method: string, url: string, status: number, data?: any): Promise<void> {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    await this.log(level, `API ${method} ${url} - ${status}`, data, 'API');
  }

  public async userAction(action: string, data?: any): Promise<void> {
    await this.info(`User action: ${action}`, data, 'USER');
  }

  public async performance(operation: string, duration: number, data?: any): Promise<void> {
    await this.info(`Performance: ${operation} took ${duration}ms`, data, 'PERFORMANCE');
  }

  public async security(event: string, data?: any): Promise<void> {
    await this.warn(`Security event: ${event}`, data, 'SECURITY');
  }

  // Utility methods
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(entry => entry.level === level);
  }

  public getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(entry => entry.context === context);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public downloadLogs(): void {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, data?: any, context?: string) => 
  logger.debug(message, data, context);

export const logInfo = (message: string, data?: any, context?: string) => 
  logger.info(message, data, context);

export const logWarn = (message: string, data?: any, context?: string) => 
  logger.warn(message, data, context);

export const logError = (message: string, data?: any, context?: string) => 
  logger.error(message, data, context);

export const logApiCall = (method: string, url: string, data?: any) => 
  logger.apiCall(method, url, data);

export const logApiResponse = (method: string, url: string, status: number, data?: any) => 
  logger.apiResponse(method, url, status, data);

export const logUserAction = (action: string, data?: any) => 
  logger.userAction(action, data);

export const logPerformance = (operation: string, duration: number, data?: any) => 
  logger.performance(operation, duration, data);

export const logSecurity = (event: string, data?: any) => 
  logger.security(event, data);

export default logger;

