// src/utils/prompt-templates.ts

/**
 * Generate a prompt for AI-enhanced search
 */
export function generateSearchPrompt(query: string): string {
  return `
You are an expert in US Harmonized Tariff Schedule (HTS) classification. 
I need help matching this natural language product description to the most likely HTS codes.

Product Query: "${query}"

Please analyze this query and provide:
1. The most likely HTS codes that match this description (up to 5 matches)
2. A confidence level for each match (high, medium, low)
3. Brief reasoning for each match
4. An enhanced search query that would work better for traditional search systems

Important context for brand names and consumer products:
- If the query contains brand names like "Samsung", "Toyota", "Apple", etc., determine the product category they represent
- If the query mentions consumer products like "Jordan Air 1" (sneakers) or "iPhone" (smartphone), map to appropriate HTS categories
- For vague queries, consider multiple possible interpretations and provide matches for each

Please format your response as a JSON object with the following structure:
{
  "htsMatches": [
    {
      "htsCode": "string",
      "confidence": "high|medium|low",
      "reasoning": "string"
    }
  ],
  "enhancedQuery": "string"
}

Return ONLY the JSON object, with no additional text.
`;
}

/**
 * Generate a prompt for tariff explanation
 */
export function generateExplanationPrompt(
  productInfo: any,
  countryInfo: any,
  rateInfo: any,
  historyData: any[] = []
): string {
  // Extract the necessary information
  const htsCode = productInfo.htsCode;
  const productName = productInfo.name;
  const description = productInfo.description;
  const baseRate = rateInfo.baseRate || productInfo.baseRate;
  const additionalRates = rateInfo.additionalRates || [];
  const totalRate = rateInfo.totalRate || 
    (baseRate + additionalRates.reduce((sum: number, rate: any) => sum + (parseFloat(rate.rate) || 0), 0));
  
  const countryName = countryInfo?.name || 'any country';
  const tradeAgreements = countryInfo?.tradeAgreements || [];
  const specialTariffs = countryInfo?.specialTariffs || [];
  
  // Add historical data if available
  let historyContext = '';
  if (historyData && historyData.length > 0) {
    const sortedHistory = [...historyData].sort((a, b) => 
      new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
    );
    
    historyContext = `
Historical Context:
- Previous Rates: ${sortedHistory.map(h => `${h.total_rate}% (effective ${new Date(h.effective_date).toLocaleDateString()})`).join(', ')}
- Rate Changes: ${sortedHistory.length} changes in the past ${sortedHistory.length > 0 ? 
      Math.round((new Date().getTime() - new Date(sortedHistory[0].effective_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0} months
`;
  }
  
  return `
You are an expert in explaining US import tariffs in plain language.

Please explain the following tariff information in a way that's easy for importers to understand:

Product Information:
- HTS Code: ${htsCode}
- Product Name: ${productName}
- Description: ${description}

Rate Information:
- Base Rate: ${baseRate}%
- Additional Duties: ${JSON.stringify(additionalRates)}
- Total Rate: ${totalRate}%

Country Information:
- Country: ${countryName}
- Trade Agreements: ${tradeAgreements.join(', ')}
- Special Tariffs: ${specialTariffs.join(', ')}

${historyContext}

Please provide:
1. A plain language explanation of what this tariff means
2. The cost impact with a practical example (assume a $1,000 shipment)
3. Alternative sourcing options that might have lower duties, if applicable
4. Technical details for customs professionals
${historyData && historyData.length > 0 ? '5. A brief analysis of how the rate has changed over time' : ''}

Format your response as a JSON object with these keys:
{
  "plainLanguage": "string",
  "costImpact": "string",
  "alternatives": "string",
  "technicalDetails": "string"
  ${historyData && historyData.length > 0 ? ',"historicalTrend": "string"' : ''}
}

Return ONLY the JSON object, with no additional text.
`;
}

/**
 * Generate a prompt for explaining tariff changes
 */
export function generateTariffChangePrompt(
  productInfo: any,
  oldRate: any,
  newRate: any,
  countryInfo?: any
): string {
  const productName = productInfo.name;
  const htsCode = productInfo.htsCode || productInfo.hts_code;
  const oldTotalRate = oldRate.totalRate || oldRate.total_rate || 0;
  const newTotalRate = newRate.totalRate || newRate.total_rate || 0;
  const rateChange = newTotalRate - oldTotalRate;
  const countryName = countryInfo?.name || 'any country';
  
  return `
You are an expert in explaining US import tariff changes in plain language.

Please explain the following tariff change in a way that's easy for businesses to understand:

Product Information:
- HTS Code: ${htsCode}
- Product Name: ${productName}

Rate Change:
- Previous Total Rate: ${oldTotalRate}%
- New Total Rate: ${newTotalRate}%
- Change: ${rateChange > 0 ? '+' : ''}${rateChange}%

Country Information:
- Country: ${countryName}

Please provide:
1. A clear explanation of what changed and why (if known)
2. The impact this will have on import costs, with an example
3. When this change takes effect
4. Any actions importers should consider

Respond in a concise, business-friendly format. Make sure to include dollar impact examples (e.g., "For a $10,000 shipment, this means an additional cost of $X").

Keep your response to 3-4 paragraphs maximum.
`;
}

/**
 * Generate a prompt for product categorization
 */
export function generateProductCategoryPrompt(
  htsCode: string,
  description: string
): string {
  return `
You are an expert in categorizing products based on Harmonized Tariff Schedule (HTS) codes.

Please categorize the following product:
- HTS Code: ${htsCode}
- Description: ${description}

I need you to:
1. Determine the most appropriate product category
2. Provide an optional sub-category if applicable
3. Generate keywords and search terms that consumers might use to find this product
4. List common or alternative names for this product
5. Create searchable terms (comma separated)

Common consumer terms are especially important - for example, HTS 8517.13.0000 "Smartphones" might have terms like "iPhone", "Galaxy", "mobile phone", "cell phone", etc.

Format your response as a JSON object with these keys:
{
  "category": "string",
  "subCategory": "string",
  "confidence": "high|medium|low",
  "keywords": ["string", "string"],
  "commonNames": ["string", "string"],
  "searchableTerms": "string"
}

Return ONLY the JSON object, with no additional text.
`;
}

/**
 * Generate a prompt for consumer product to HTS mapping
 */
export function generateBrandToHtsPrompt(
  productQuery: string
): string {
  return `
You are an expert in mapping consumer product descriptions to the appropriate Harmonized Tariff Schedule (HTS) classifications.

Consumer Product Query: "${productQuery}"

Please map this consumer product to appropriate HTS categories. If the query mentions brands (like Samsung, Toyota, Nike) or specific consumer products (like iPhone, Jordan Air 1), identify the product type and map to HTS categories.

Please determine:
1. The product type/category (e.g., "smartphone" for "iPhone 15")
2. The most likely HTS codes (up to 3)
3. Common consumer search terms related to this product
4. Technical product description as it would appear in HTS

Format your response as a JSON object with these keys:
{
  "productType": "string",
  "htsCodes": [
    {
      "code": "string",
      "description": "string",
      "confidence": "high|medium|low"
    }
  ],
  "consumerTerms": ["string", "string", "string"],
  "technicalDescription": "string"
}

Return ONLY the JSON object, with no additional text.
`;
}