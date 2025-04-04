// src/scripts/run-ai-hts-import.ts
import path from 'path';
import fs from 'fs';
import { processHTSFile, rollbackImport, generateImportReport } from '../services/ai-csv-processor';
import { createLogger } from '../utils/logger';
import { closeConnections } from '../utils/database';
import { sendAlert } from '../monitoring/alerting-service';

const logger = createLogger('ai-hts-import');

/**
 * Script to run AI-enhanced HTS CSV import
 * 
 * Usage: 
 *   npm run ai:import:hts -- --file=./data/hts_2025_revision_5_csv.csv
 *   npm run ai:import:hts -- --file=./data/htsdata_1.csv
 *   npm run ai:import:hts -- --rollback=123e4567-e89b-12d3-a456-426614174000
 *   npm run ai:import:hts -- --report=123e4567-e89b-12d3-a456-426614174000
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    // Check for rollback request
    const rollbackArg = args.find(arg => arg.startsWith('--rollback='));
    if (rollbackArg) {
      const importId = rollbackArg.split('=')[1];
      
      if (!importId) {
        logger.error('Invalid import ID for rollback');
        process.exit(1);
      }
      
      logger.info(`Starting rollback of import ${importId}`);
      
      // Send start alert
      await sendAlert({
        severity: 'info',
        title: 'Import Rollback Started',
        message: `Starting rollback of import ID ${importId}`,
        component: 'hts-import'
      });
      
      // Perform rollback
      const result = await rollbackImport(importId);
      
      logger.info(`Rollback completed: ${result.successfulRollbacks}/${result.totalChanges} changes reverted`);
      await closeConnections();
      process.exit(0);
      return;
    }
    
    // Check for report generation request
    const reportArg = args.find(arg => arg.startsWith('--report='));
    if (reportArg) {
      const importId = reportArg.split('=')[1];
      
      if (!importId) {
        logger.error('Invalid import ID for report');
        process.exit(1);
      }
      
      logger.info(`Generating report for import ${importId}`);
      
      // Generate report
      const report = await generateImportReport(importId);
      
      // Write report to file
      const reportDir = path.resolve(process.cwd(), './reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      const reportPath = path.resolve(reportDir, `import-${importId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      logger.info(`Report generated at ${reportPath}`);
      await closeConnections();
      process.exit(0);
      return;
    }
    
    // Regular import process
    const fileArg = args.find(arg => arg.startsWith('--file='));
    
    if (!fileArg) {
      logger.error('Missing required argument: --file=/path/to/hts_file.csv');
      process.exit(1);
    }
    
    const filePath = fileArg.split('=')[1];
    
    if (!filePath) {
      logger.error('Invalid file path');
      process.exit(1);
    }
    
    // Resolve absolute path
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      logger.error(`File not found: ${absolutePath}`);
      process.exit(1);
    }
    
    logger.info(`Starting AI-enhanced HTS import from ${absolutePath}`);
    
    // Send start alert
    await sendAlert({
      severity: 'info',
      title: 'AI HTS Import Started',
      message: `Starting AI-enhanced import of HTS data from ${path.basename(absolutePath)}`,
      component: 'hts-import'
    });
    
    // Process the file
    const changeTracker = await processHTSFile(
      absolutePath,
      (changeType, details) => {
        // This callback logs significant changes in real-time
        if (changeType === 'rateChanges' && Math.abs(details.newRate - details.oldRate) >= 5) {
          logger.info(`Significant rate change detected: ${details.htsCode} from ${details.oldRate}% to ${details.newRate}%`);
        }
      }
    );
    
    // Generate summary report
    logger.info(`Import completed with ${changeTracker.newProducts} new products and ${changeTracker.rateChanges} rate changes`);
    
    // Send completion alert
    await sendAlert({
      severity: 'info',
      title: 'AI HTS Import Completed',
      message: `Successfully imported HTS data with AI enhancements from ${path.basename(absolutePath)}`,
      component: 'hts-import',
      details: {
        productsProcessed: changeTracker.productsProcessed,
        newProducts: changeTracker.newProducts,
        rateChanges: changeTracker.rateChanges,
        significantChanges: changeTracker.details.significantChanges.length
      }
    });
    
    logger.info('AI-enhanced HTS import completed successfully');
    await closeConnections();
    process.exit(0);
  } catch (error) {
    logger.error('AI-enhanced HTS import failed', error);
    
    // Send error alert
    await sendAlert({
      severity: 'error',
      title: 'AI HTS Import Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      component: 'hts-import',
      details: {
        error: error instanceof Error ? error.stack : String(error)
      }
    });
    
    await closeConnections();
    process.exit(1);
  }
}

// Run the script
main();