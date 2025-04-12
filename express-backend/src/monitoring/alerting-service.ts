import axios from 'axios';
import logger, { createLogger } from '../utils/logger';

const loga = createLogger('alerting-service',logger);

// Types of alert severities
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Alert information structure
export interface AlertInfo {
  severity: AlertSeverity;
  title: string;
  message: string;
  component: string;
  details?: Record<string, any>;
}

// Configuration for the alerting system
const config = {
  enabled: process.env.ENABLE_ALERTS === 'true',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  emailTo: process.env.ALERT_EMAIL,
  environment: process.env.NODE_ENV || 'development',
  appName: 'Tariffs Tracker Data Service'
};

/**
 * Send an alert to configured channels
 */
export async function sendAlert(alertInfo: AlertInfo): Promise<void> {
  // Skip if alerts are disabled
  if (!config.enabled) {
    loga.info(`Alert would be sent (disabled): ${alertInfo.title}`);
    return;
  }

  try {
    loga.info(`Sending alert: ${alertInfo.severity} - ${alertInfo.title}`);
    
    // Create promises for each alert channel
    const promises: Promise<any>[] = [];
    
    if (config.slackWebhookUrl) {
      promises.push(sendSlackAlert(alertInfo));
    }
    
    if (config.emailTo) {
      promises.push(sendEmailAlert(alertInfo));
    }
    
    // Always log the alert
    logAlert(alertInfo);
    
    // Wait for all alert channels to complete
    await Promise.all(promises);
  } catch (error) {
    loga.error('Failed to send alert', error as any);
    // We don't want to throw here as alerting shouldn't break the main application
  }
}

/**
 * Log an alert to the application logs
 */
function logAlert(alertInfo: AlertInfo): void {
  const { severity, title, message, component, details } = alertInfo;
  
  switch (severity) {
    case 'info':
      loga.info(`ALERT [${component}]: ${title} - ${message}`, details);
      break;
    case 'warning':
      loga.warn(`ALERT [${component}]: ${title} - ${message}`, details);
      break;
    case 'error':
    case 'critical':
      loga.error(`ALERT [${component}]: ${title} - ${message}`, details as any);
      break;
  }
}

/**
 * Send an alert to Slack
 */
async function sendSlackAlert(alertInfo: AlertInfo): Promise<void> {
  if (!config.slackWebhookUrl) return;
  
  const { severity, title, message, component, details } = alertInfo;
  
  // Determine emoji based on severity
  let emoji = '📊';
  switch (severity) {
    case 'info': emoji = '📊'; break;
    case 'warning': emoji = '⚠️'; break;
    case 'error': emoji = '🔴'; break;
    case 'critical': emoji = '🚨'; break;
  }
  
  // Format details as JSON if present
  const detailsText = details ? `\n\`\`\`${JSON.stringify(details, null, 2)}\`\`\`` : '';
  
  // Create Slack message payload
  const payload = {
    text: `${emoji} *[${config.environment.toUpperCase()}] ${config.appName}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *[${config.environment.toUpperCase()}] ${config.appName}*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Alert:*\n${title}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${severity.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Component:*\n${component}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date().toISOString()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n${message}${detailsText}`
        }
      }
    ]
  };
  
  try {
    await axios.post(config.slackWebhookUrl, payload);
    logger.info('Slack alert sent successfully');
  } catch (error) {
    logger.error('Failed to send Slack alert', error as any);
  }
}

/**
 * Send an alert via email
 * Note: In a real implementation, you would integrate with a proper email service
 */
async function sendEmailAlert(alertInfo: AlertInfo): Promise<void> {
  if (!config.emailTo) return;
  
  const { severity, title, message } = alertInfo;
  
  // This is a simplified implementation. In a real system, you would:
  // 1. Use a proper email service (AWS SES, SendGrid, Mailgun, etc.)
  // 2. Have email templates
  // 3. Handle email deliverability, bounces, etc.
  
  logger.info(`Would send email alert to ${config.emailTo}: ${severity} - ${title}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Check if an alert should trigger based on configuration
 */
export function shouldTriggerAlert(severity: AlertSeverity): boolean {
  if (!config.enabled) return false;
  
  // In a real system, you might have more sophisticated rules here,
  // such as alert thresholds, rate limiting, etc.
  
  // For now, we'll trigger alerts for all severities in production,
  // but only error and critical in other environments
  if (config.environment === 'production') {
    return true;
  }
  
  return severity === 'error' || severity === 'critical';
}