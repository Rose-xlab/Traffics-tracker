// src/services/ai-csv-processor.ts
import fs from 'fs';
import Papa from 'papaparse';
import OpenAI from 'openai';
import { createLogger } from '../utils/logger';
import { supabase } from '../utils/database';
import config from '../config';
import { metrics } from '../monitoring/metrics-manager';
import { recordTariffChange } from './tariff-history-service';
import { notifyProductWatchers } from './notification-service';
import { categorizeProduct } from './ai-service';
import { apiCache } from '../utils/cache';
import PQueue from 'p-queue';
import { sendAlert } from '../monitoring/alerting-service';

const logger = createLogger('ai-csv-processor');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || config.apis.openai.apiKey,
});

// Change tracking
type ChangeListener = (changeType: string, details: any) => void;
type ChangeTracker = {
  productsProcessed: number;
  newProducts: number;
  updatedProducts: number;
  rateChanges: number;
  descriptionChanges: number;
  totalDutyImpact: number;
  details: {
    newProducts: Array<{htsCode: string, name: string}>;
    rateChanges: Array<{htsCode: string, productId: string, oldRate: number, newRate: number}>;
    significantChanges: Array<{htsCode: string, description: string, impact: string}>;
  }
};

/**
 * Process HTS CSV file with AI enhancement
 */
export async function processHTSFile(
  filePath: string, 
  changeListener?: ChangeListener
): Promise<ChangeTracker> {
  // Initialize change tracker
  const changes: ChangeTracker = {
    productsProcessed: 0,
    newProducts: 0,
    updatedProducts: 0,
    rateChanges: 0,
    descriptionChanges: 0,
    totalDutyImpact: 0,
    details: {
      newProducts: [],
      rateChanges: [],
      significantChanges: []
    }
  };

  try {
    logger.info(`Processing HTS data file with AI enhancement: ${filePath}`);
    
    // Create import history record
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .insert({
        filename: filePath.split('/').pop(),
        file_size: fs.statSync(filePath).size,
        status: 'processing',
        import_date: new Date().toISOString(),
        processed_by: null // In a real system, this would be the current user
      })
      .select('id')
      .single();
      
    if (importError) {
      logger.error('Error creating import record', importError);
      throw importError;
    }
    
    const importId = importRecord.id;
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const { data, errors, meta } = results;
            
            if (errors.length > 0) {
              logger.error('CSV parsing errors:', errors);
              await updateImportStatus(importId, 'failed', errors[0].message);
              throw new Error(`Error parsing CSV: ${errors[0].message}`);
            }
            
            logger.info(`Successfully parsed ${data.length} HTS entries`);
            changes.productsProcessed = data.length;
            
            // Update row count in import record
            await supabase
              .from('import_history')
              .update({ row_count: data.length })
              .eq('id', importId);
            
            // Process in batches with concurrency limit
            const queue = new PQueue({ concurrency: config.sync.concurrency });
            const batchSize = 10; // Smaller batches for AI processing
            
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              
              queue.add(async () => {
                const batchChanges = await processBatchWithAI(batch, importId, changeListener);
                
                // Aggregate changes
                changes.newProducts += batchChanges.newProducts;
                changes.updatedProducts += batchChanges.updatedProducts;
                changes.rateChanges += batchChanges.rateChanges;
                changes.descriptionChanges += batchChanges.descriptionChanges;
                changes.totalDutyImpact += batchChanges.totalDutyImpact;
                
                // Add details
                changes.details.newProducts.push(...batchChanges.details.newProducts);
                changes.details.rateChanges.push(...batchChanges.details.rateChanges);
                changes.details.significantChanges.push(...batchChanges.details.significantChanges);
                
                // Update metrics
                metrics.jobsTotal.inc({ job_type: 'hts-processing', status: 'batch_completed' });
              });
              
              // Log progress periodically
              if (i % (batchSize * 10) === 0 && i > 0) {
                logger.info(`Processed ${i} of ${data.length} entries`);
              }
            }
            
            // Wait for all batches to complete
            await queue.onIdle();
            
            // Update import status
            await updateImportStatus(importId, 'completed', null, changes);
            
            // Send alerts for significant changes
            if (changes.rateChanges > 0) {
              await sendChangeAlerts(changes);
            }
            
            logger.info(`HTS data processing completed successfully. Changes: ${JSON.stringify({
              newProducts: changes.newProducts,
              updatedProducts: changes.updatedProducts,
              rateChanges: changes.rateChanges
            })}`);
            
            resolve(changes);
          } catch (error) {
            logger.error('Error processing HTS data', error);
            await updateImportStatus(importId, 'failed', error.message);
            reject(error);
          }
        },
        error: async (error) => {
          logger.error('CSV parsing error', error);
          await updateImportStatus(importId, 'failed', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    logger.error('Error processing HTS file', error);
    throw error;
  }
}

/**
 * Update import history status
 */
async function updateImportStatus(
  importId: string,
  status: 'processing' | 'completed' | 'failed' | 'rolled_back',
  errorMessage?: string | null,
  changes?: ChangeTracker
): Promise<void> {
  try {
    const updateData: any = {
      status,
      completed_date: ['completed', 'failed', 'rolled_back'].includes(status) ? new Date().toISOString() : null,
    };
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    if (changes) {
      updateData.change_summary = {
        productsProcessed: changes.productsProcessed,
        newProducts: changes.newProducts,
        updatedProducts: changes.updatedProducts,
        rateChanges: changes.rateChanges,
        descriptionChanges: changes.descriptionChanges,
        totalDutyImpact: changes.totalDutyImpact
      };
      
      // Add additional metrics from changes
      updateData.new_products = changes.newProducts;
      updateData.updated_products = changes.updatedProducts;
      updateData.rate_changes = changes.rateChanges;
      updateData.description_changes = changes.descriptionChanges;
    }
    
    await supabase
      .from('import_history')
      .update(updateData)
      .eq('id', importId);
  } catch (error) {
    logger.error('Error updating import status', error);
    // Non-critical error, continue processing
  }
}

/**
 * Process a batch of HTS entries with AI enhancement
 */
async function processBatchWithAI(
  htsEntries: any[], 
  importId: string,
  changeListener?: ChangeListener
): Promise<ChangeTracker> {
  // Initialize batch change tracker
  const batchChanges: ChangeTracker = {
    productsProcessed: htsEntries.length,
    newProducts: 0,
    updatedProducts: 0,
    rateChanges: 0,
    descriptionChanges: 0,
    totalDutyImpact: 0,
    details: {
      newProducts: [],
      rateChanges: [],
      significantChanges: []
    }
  };

  try {
    // Group entries to reduce API calls
    const groupSize = 5;
    const groups = [];
    
    for (let i = 0; i < htsEntries.length; i += groupSize) {
      groups.push(htsEntries.slice(i, i + groupSize));
    }
    
    // Process each group
    for (const group of groups) {
      const groupResults = await enhanceAndStoreGroupWithChangeDetection(
        group, 
        importId,
        changeListener
      );
      
      // Aggregate changes
      batchChanges.newProducts += groupResults.newProducts;
      batchChanges.updatedProducts += groupResults.updatedProducts;
      batchChanges.rateChanges += groupResults.rateChanges;
      batchChanges.descriptionChanges += groupResults.descriptionChanges;
      batchChanges.totalDutyImpact += groupResults.totalDutyImpact;
      
      // Add details
      batchChanges.details.newProducts.push(...groupResults.details.newProducts);
      batchChanges.details.rateChanges.push(...groupResults.details.rateChanges);
      batchChanges.details.significantChanges.push(...groupResults.details.significantChanges);
    }
    
    return batchChanges;
  } catch (error) {
    logger.error('Error processing batch with AI', error);
    throw error;
  }
}

/**
 * Enhance a group of HTS entries with AI and store in database, detecting changes
 */
async function enhanceAndStoreGroupWithChangeDetection(
  htsEntries: any[],
  importId: string,
  changeListener?: ChangeListener
): Promise<ChangeTracker> {
  // Initialize group change tracker
  const groupChanges: ChangeTracker = {
    productsProcessed: htsEntries.length,
    newProducts: 0,
    updatedProducts: 0,
    rateChanges: 0,
    descriptionChanges: 0,
    totalDutyImpact: 0,
    details: {
      newProducts: [],
      rateChanges: [],
      significantChanges: []
    }
  };

  try {
    // Extract basic information
    const entriesInfo = htsEntries.map(entry => ({
      htsNumber: entry['HTS Number'],
      indent: entry['Indent'],
      description: entry['Description'],
      generalRate: entry['General Rate of Duty'],
      specialRate: entry['Special Rate of Duty'],
      additionalDuties: entry['Additional Duties']
    }));
    
    // Process each entry with AI enhancement
    const productsToInsert = [];
    
    for (const entry of htsEntries) {
      const htsCode = entry['HTS Number'].trim();
      
      try {
        // Get AI categorization
        const aiCategorizationResult = await categorizeProduct(
          htsCode,
          entry['Description'].trim()
        );
        
        // Find existing product by HTS code
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, name, description, base_rate, category')
          .eq('hts_code', htsCode)
          .single();
        
        // Parse the general rate
        const generalRate = parseRate(entry['General Rate of Duty']);
        
        // Create product object
        const product = {
          hts_code: htsCode,
          name: aiCategorizationResult.commonNames && aiCategorizationResult.commonNames.length > 0 
            ? aiCategorizationResult.commonNames[0] 
            : entry['Description'].trim(),
          description: entry['Description'].trim(),
          category: aiCategorizationResult.category || determineCategoryFromHtsCode(htsCode),
          sub_category: aiCategorizationResult.subCategory || null,
          base_rate: generalRate,
          unit: entry['Unit of Quantity'] || 'kg',
          additional_rates: parseAdditionalDuties(entry['Additional Duties']),
          special_rates: parseSpecialRates(entry['Special Rate of Duty']),
          keywords: aiCategorizationResult.keywords || [],
          common_names: aiCategorizationResult.commonNames || [],
          searchable_terms: aiCategorizationResult.searchableTerms || entry['Description'].toLowerCase(),
          ai_enhanced: true,
          last_updated: new Date().toISOString()
        };
        
        // Check for changes if product exists
        if (existingProduct) {
          groupChanges.updatedProducts++;
          let changeCount = 0;
          
          // Check for rate change
          if (existingProduct.base_rate !== generalRate) {
            groupChanges.rateChanges++;
            changeCount++;
            
            // Calculate duty impact (rough estimate)
            const impact = Math.abs(generalRate - existingProduct.base_rate);
            groupChanges.totalDutyImpact += impact;
            
            // Track change details
            groupChanges.details.rateChanges.push({
              htsCode,
              productId: existingProduct.id,
              oldRate: existingProduct.base_rate,
              newRate: generalRate
            });
            
            // Notify listener
            if (changeListener) {
              changeListener('rateChanges', {
                htsCode,
                oldRate: existingProduct.base_rate,
                newRate: generalRate
              });
            }
            
            // Record the change in history
            await recordTariffChange(
              existingProduct.id,
              null, // No specific country for general rate changes
              {
                baseRate: existingProduct.base_rate,
                additionalRates: [],
                totalRate: existingProduct.base_rate
              },
              {
                baseRate: generalRate,
                additionalRates: [],
                totalRate: generalRate
              },
              new Date().toISOString(),
              'csv-import',
              `Rate updated from CSV import: ${htsCode}`,
              importId
            );
            
            // Notify subscribers about the change if significant
            if (Math.abs(generalRate - existingProduct.base_rate) >= 1) {
              await notifyProductWatchers({
                title: `Tariff Rate Changed for ${existingProduct.name}`,
                message: `The base duty rate for ${existingProduct.name} (${htsCode}) has changed from ${existingProduct.base_rate}% to ${generalRate}%`,
                type: 'rate_change',
                productId: existingProduct.id
              });
              
              // Add to significant changes
              groupChanges.details.significantChanges.push({
                htsCode,
                description: existingProduct.name,
                impact: `Rate change from ${existingProduct.base_rate}% to ${generalRate}%`
              });
            }
            
            // Update country-specific rates if needed
            await updateCountryRatesForProduct(existingProduct.id, generalRate, importId);
          }
          
          // Check for description change
          if (existingProduct.description !== entry['Description'].trim()) {
            groupChanges.descriptionChanges++;
            changeCount++;
            
            // Notify listener
            if (changeListener) {
              changeListener('descriptionChanges', {
                htsCode,
                oldDescription: existingProduct.description,
                newDescription: entry['Description'].trim()
              });
            }
          }
          
          // Record import change
          await recordImportChange(
            importId,
            'update',
            htsCode,
            existingProduct.id,
            changeCount > 0 ? 'modified' : 'unchanged',
            {
              base_rate: existingProduct.base_rate,
              description: existingProduct.description,
              category: existingProduct.category
            },
            {
              base_rate: generalRate,
              description: entry['Description'].trim(),
              category: aiCategorizationResult.category || determineCategoryFromHtsCode(htsCode)
            }
          );
        } else {
          // New product
          groupChanges.newProducts++;
          
          // Track new product details
          groupChanges.details.newProducts.push({
            htsCode,
            name: product.name
          });
          
          // Notify listener
          if (changeListener) {
            changeListener('newProducts', {
              htsCode,
              name: product.name
            });
          }
          
          // Record import change
          await recordImportChange(
            importId,
            'create',
            htsCode,
            null,
            'new',
            null,
            {
              base_rate: generalRate,
              description: entry['Description'].trim(),
              category: aiCategorizationResult.category || determineCategoryFromHtsCode(htsCode)
            }
          );
        }
        
        // Add to products to insert/update
        productsToInsert.push(product);
      } catch (error) {
        logger.error(`Error processing HTS entry ${htsCode}`, error);
        // Continue with next entry
      }
    }
    
    // Upsert to database
    if (productsToInsert.length > 0) {
      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'hts_code'
        });
        
      if (error) throw error;
    }
    
    return groupChanges;
  } catch (error) {
    logger.error('Error enhancing and storing HTS entries', error);
    throw error;
  }
}

/**
 * Record import change
 */
async function recordImportChange(
  importId: string,
  operation: 'create' | 'update' | 'delete',
  htsCode: string,
  productId: string | null,
  changeType: 'new' | 'modified' | 'unchanged' | 'removed',
  oldValue: any,
  newValue: any
): Promise<void> {
  try {
    await supabase
      .from('import_changes')
      .insert({
        import_id: importId,
        hts_code: htsCode,
        product_id: productId,
        change_type: changeType,
        old_value: oldValue,
        new_value: newValue,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    logger.error(`Error recording import change for ${htsCode}`, error);
    // Non-critical error, continue processing
  }
}

/**
 * Update country-specific rates when base rate changes
 */
async function updateCountryRatesForProduct(
  productId: string, 
  newBaseRate: number,
  importId?: string
): Promise<void> {
  try {
    // Get all country-specific rates for this product
    const { data: countryRates } = await supabase
      .from('tariff_rates')
      .select('country_id, base_rate, additional_rates, total_rate')
      .eq('product_id', productId);
    
    if (!countryRates || countryRates.length === 0) {
      return;
    }
    
    // Update each country's rate
    for (const rate of countryRates) {
      // Calculate new total rate
      const additionalRateSum = rate.additional_rates.reduce(
        (sum, r) => sum + (parseFloat(r.rate) || 0), 
        0
      );
      
      const newTotalRate = newBaseRate + additionalRateSum;
      
      // Only update if there's a change
      if (rate.base_rate !== newBaseRate || rate.total_rate !== newTotalRate) {
        // Record the change
        await recordTariffChange(
          productId,
          rate.country_id,
          {
            baseRate: rate.base_rate,
            additionalRates: rate.additional_rates,
            totalRate: rate.total_rate
          },
          {
            baseRate: newBaseRate,
            additionalRates: rate.additional_rates,
            totalRate: newTotalRate
          },
          new Date().toISOString(),
          'csv-import-cascade',
          `Country rate updated due to base rate change from CSV import`,
          importId
        );
        
        // Update the rate
        await supabase
          .from('tariff_rates')
          .update({
            base_rate: newBaseRate,
            total_rate: newTotalRate,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('country_id', rate.country_id);
      }
    }
  } catch (error) {
    logger.error(`Error updating country rates for product ${productId}`, error);
    throw error;
  }
}

/**
 * Send alerts for significant changes
 */
async function sendChangeAlerts(changes: ChangeTracker): Promise<void> {
  try {
    // Determine alert severity based on number of changes
    const severity = changes.rateChanges > 20 ? 'warning' : 
                    changes.rateChanges > 5 ? 'info' : 'low';
    
    // Send alert through alerting service
    await sendAlert({
      severity: severity as any,
      title: `Tariff Rate Changes Detected`,
      message: `CSV import resulted in ${changes.rateChanges} rate changes and ${changes.newProducts} new products.`,
      component: 'import-process',
      details: {
        totalChanges: changes.rateChanges + changes.newProducts + changes.descriptionChanges,
        rateChanges: changes.rateChanges,
        newProducts: changes.newProducts,
        significantChanges: changes.details.significantChanges.slice(0, 5) // First 5 significant changes
      }
    });
    
    // If significant changes (rate changes >= 1%), notify administrators
    if (changes.details.significantChanges.length > 0) {
      // In a real implementation, this would email administrators
      logger.info(`Significant tariff changes detected: ${changes.details.significantChanges.length}`);
    }
  } catch (error) {
    logger.error('Error sending change alerts', error);
    // Non-critical error, continue processing
  }
}

/**
 * Parse rate from string
 */
function parseRate(rateString: string): number {
  // Handle "Free" rates
  if (rateString?.toLowerCase().includes('free')) {
    return 0;
  }
  
  // Extract percentages
  const percentMatch = rateString?.match(/(\d+\.?\d*)%/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }
  
  // Handle complex rates (simplified approach - in practice would be more complex)
  // For complex rates like "5.3¢/kg + 2.5%", just extract the percentage
  const complexMatch = rateString?.match(/.*\+\s*(\d+\.?\d*)%/);
  if (complexMatch) {
    return parseFloat(complexMatch[1]);
  }
  
  // Default
  return 0;
}

/**
 * Parse additional duties
 */
function parseAdditionalDuties(dutiesString: string): any[] {
  if (!dutiesString || dutiesString.trim() === '') {
    return [];
  }
  
  // In a real implementation, this would parse specific duty types
  // For now, just return as a single additional duty
  return [
    {
      type: 'additional',
      description: dutiesString.trim(),
      rate: 0 // Would extract rate in real implementation
    }
  ];
}

/**
 * Parse special rates from string
 */
function parseSpecialRates(specialRatesString: string): any[] {
  if (!specialRatesString || specialRatesString.trim() === '') {
    return [];
  }
  
  // Example: "Free (A,AU,BH,CA,CL,CO,D,E,IL,JO,KR,MA,MX,OM,P,PA,PE,S,SG)"
  const programs = specialRatesString.match(/\(([^)]+)\)/);
  if (programs && programs[1]) {
    const programCodes = programs[1].split(',').map(code => code.trim());
    
    // Convert program codes to special rates
    return programCodes.map(code => ({
      program: code,
      description: getProgramDescription(code),
      rate: specialRatesString.toLowerCase().includes('free') ? 0 : null
    }));
  }
  
  return [];
}

/**
 * Get description for a special program code
 */
function getProgramDescription(code: string): string {
  // Mapping of program codes to descriptions
  const programDescriptions: Record<string, string> = {
    'A': 'Generalized System of Preferences',
    'AU': 'Australia Free Trade Agreement',
    'BH': 'Bahrain Free Trade Agreement',
    'CA': 'Canada (USMCA/NAFTA)',
    'CL': 'Chile Free Trade Agreement',
    'CO': 'Colombia Trade Promotion Agreement',
    'D': 'African Growth and Opportunity Act',
    'E': 'Caribbean Basin Economic Recovery Act',
    'IL': 'Israel Free Trade Agreement',
    'JO': 'Jordan Free Trade Agreement',
    'KR': 'Korea Free Trade Agreement',
    'MA': 'Morocco Free Trade Agreement',
    'MX': 'Mexico (USMCA/NAFTA)',
    'OM': 'Oman Free Trade Agreement',
    'P': 'Dominican Republic-Central America FTA',
    'PA': 'Panama Trade Promotion Agreement',
    'PE': 'Peru Trade Promotion Agreement',
    'S': 'Singapore Free Trade Agreement',
    'SG': 'Singapore Free Trade Agreement'
  };
  
  return programDescriptions[code] || `Special Program ${code}`;
}

/**
 * Determine category from HTS code
 */
/**
 * Rollback an import
 */
export async function rollbackImport(importId: string): Promise<{
  totalChanges: number,
  successfulRollbacks: number,
  failedRollbacks: number,
  errors: any[]
}> {
  const result = {
    totalChanges: 0,
    successfulRollbacks: 0,
    failedRollbacks: 0,
    errors: []
  };
  
  try {
    logger.info(`Starting rollback for import ${importId}`);
    
    // Get import record to confirm it exists
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .single();
      
    if (importError) {
      throw new Error(`Import record not found: ${importId}`);
    }
    
    // Get all changes from this import
    const { data: changes, error } = await supabase
      .from('import_changes')
      .select('*')
      .eq('import_id', importId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    result.totalChanges = changes.length;
    logger.info(`Found ${changes.length} changes to rollback`);
    
    // Process each change
    for (const change of changes) {
      try {
        await rollbackChange(change, importId);
        result.successfulRollbacks++;
      } catch (error) {
        logger.error(`Error rolling back change ${change.id}`, error);
        result.failedRollbacks++;
        result.errors.push({
          changeId: change.id,
          error: error.message
        });
      }
    }
    
    // Update import status
    await supabase
      .from('import_history')
      .update({
        status: 'rolled_back',
        change_summary: {
          ...importRecord.change_summary || {},
          rollback_date: new Date().toISOString(),
          rollbackStats: result
        }
      })
      .eq('id', importId);
    
    logger.info(`Rollback completed for import ${importId}: ${result.successfulRollbacks}/${result.totalChanges} changes reversed`);
    
    // Send alert about rollback
    await sendAlert({
      severity: 'info',
      title: 'Import Rollback Completed',
      message: `Rollback of import ID ${importId} completed with ${result.successfulRollbacks}/${result.totalChanges} changes reversed.`,
      component: 'import-process',
      details: result
    });
    
    return result;
  } catch (error) {
    logger.error(`Error during import rollback ${importId}`, error);
    
    // Send alert about failed rollback
    await sendAlert({
      severity: 'error',
      title: 'Import Rollback Failed',
      message: `Rollback of import ID ${importId} failed: ${error.message}`,
      component: 'import-process',
      details: {
        importId,
        error: error.message,
        result
      }
    });
    
    throw error;
  }
}

/**
 * Rollback a specific change
 */
async function rollbackChange(change: any, importId: string): Promise<void> {
  const { hts_code, product_id, change_type, old_value, new_value } = change;
  
  switch (change_type) {
    case 'new':
      // New product - delete it
      if (!product_id) {
        // If no product ID, we can't do anything
        logger.warn(`Cannot rollback new product without product ID: ${hts_code}`);
        return;
      }
      
      await supabase
        .from('products')
        .delete()
        .eq('id', product_id);
      
      logger.info(`Rolled back new product: ${hts_code}`);
      break;
      
    case 'modified':
      // Modified product - restore previous values
      if (!product_id || !old_value) {
        logger.warn(`Cannot rollback modified product without product ID or old values: ${hts_code}`);
        return;
      }
      
      // Update product with old values
      await supabase
        .from('products')
        .update({
          ...old_value,
          last_updated: new Date().toISOString()
        })
        .eq('id', product_id);
      
      // If rate changed, we need to handle country-specific rates
      if (old_value.base_rate !== new_value.base_rate) {
        // Restore rate history
        await recordTariffChange(
          product_id,
          null, // No specific country for general rate changes
          {
            baseRate: new_value.base_rate, // Current rate (before rollback)
            additionalRates: [],
            totalRate: new_value.base_rate
          },
          {
            baseRate: old_value.base_rate, // Original rate (after rollback)
            additionalRates: [],
            totalRate: old_value.base_rate
          },
          new Date().toISOString(),
          'csv-import-rollback',
          `Rate restored during import rollback: ${hts_code}`,
          importId
        );
        
        // Restore country-specific rates
        await updateCountryRatesForProduct(product_id, old_value.base_rate, importId);
      }
      
      logger.info(`Rolled back modified product: ${hts_code}`);
      break;
      
    case 'unchanged':
      // No changes - nothing to rollback
      logger.debug(`No changes to rollback for product: ${hts_code}`);
      break;
      
    case 'removed':
      // Product was removed - restore it
      if (!old_value) {
        logger.warn(`Cannot rollback removed product without old values: ${hts_code}`);
        return;
      }
      
      await supabase
        .from('products')
        .insert({
          ...old_value,
          hts_code: hts_code,
          last_updated: new Date().toISOString()
        });
      
      logger.info(`Rolled back removed product: ${hts_code}`);
      break;
      
    default:
      logger.warn(`Unknown change type: ${change_type} for HTS code: ${hts_code}`);
  }
}

/**
 * Generate a statistical report of an import
 */
export async function generateImportReport(importId: string): Promise<any> {
  try {
    // Get import record
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .single();
      
    if (importError) {
      throw new Error(`Import record not found: ${importId}`);
    }
    
    // Get all changes for this import
    const { data: changes, error: changesError } = await supabase
      .from('import_changes')
      .select('*')
      .eq('import_id', importId);
      
    if (changesError) throw changesError;
    
    // Calculate statistics
    const stats = {
      total: changes.length,
      byType: {
        new: changes.filter(c => c.change_type === 'new').length,
        modified: changes.filter(c => c.change_type === 'modified').length,
        unchanged: changes.filter(c => c.change_type === 'unchanged').length,
        removed: changes.filter(c => c.change_type === 'removed').length
      },
      rateChanges: {
        count: 0,
        increases: 0,
        decreases: 0,
        noChange: 0,
        averageChange: 0,
        totalImpact: 0
      },
      significantChanges: []
    };
    
    // Calculate rate change statistics
    let totalRateChange = 0;
    let rateChangeCount = 0;
    
    for (const change of changes) {
      if (change.change_type === 'modified' && 
          change.old_value && 
          change.new_value && 
          change.old_value.base_rate !== change.new_value.base_rate) {
        
        const oldRate = change.old_value.base_rate || 0;
        const newRate = change.new_value.base_rate || 0;
        const rateChange = newRate - oldRate;
        
        stats.rateChanges.count++;
        totalRateChange += rateChange;
        
        if (rateChange > 0) {
          stats.rateChanges.increases++;
        } else if (rateChange < 0) {
          stats.rateChanges.decreases++;
        } else {
          stats.rateChanges.noChange++;
        }
        
        // Track significant changes
        if (Math.abs(rateChange) >= 1) {
          stats.significantChanges.push({
            htsCode: change.hts_code,
            oldRate,
            newRate,
            change: rateChange,
            productId: change.product_id
          });
        }
        
        rateChangeCount++;
      }
    }
    
    if (rateChangeCount > 0) {
      stats.rateChanges.averageChange = totalRateChange / rateChangeCount;
      stats.rateChanges.totalImpact = totalRateChange;
    }
    
    // Sort significant changes by absolute magnitude
    stats.significantChanges.sort((a, b) => 
      Math.abs(b.change) - Math.abs(a.change)
    );
    
    return {
      import: importRecord,
      stats
    };
  } catch (error) {
    logger.error(`Error generating import report for ${importId}`, error);
    throw error;
  }
}