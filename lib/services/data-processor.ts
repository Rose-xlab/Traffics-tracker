import { createLogger } from '@/lib/services/logger';
import { Configuration, OpenAIApi } from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { ProductData, TradeUpdate } from '@/types/api';

const logger = createLogger('data-processor');

export class DataProcessor {
  private readonly supabase = createClient();
  private readonly openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  async processDocument(text: string): Promise<{
    htsCodes: string[];
    summary: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Extract HTS codes, summarize key points, and assess impact level from trade documents."
          },
          {
            role: "user",
            content: text
          }
        ],
        functions: [
          {
            name: "processTradeDocument",
            parameters: {
              type: "object",
              properties: {
                htsCodes: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of HTS codes mentioned in the document"
                },
                summary: {
                  type: "string",
                  description: "Concise summary of key changes and implications"
                },
                impact: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  description: "Assessment of impact level on trade"
                }
              },
              required: ["htsCodes", "summary", "impact"]
            }
          }
        ],
        function_call: { name: "processTradeDocument" }
      });

      const result = JSON.parse(
        completion.data.choices[0].message?.function_call?.arguments || '{}'
      );

      return result;
    } catch (error) {
      logger.error('Error processing document', error as Error);
      throw error;
    }
  }

  async validateProductData(data: ProductData): Promise<boolean> {
    try {
      // Validate HTS code format
      if (!/^\d{4}\.\d{2}\.\d{4}$/.test(data.hts_code)) {
        return false;
      }

      // Validate rates
      if (data.base_rate < 0 || data.total_rate < 0) {
        return false;
      }

      // Validate dates
      const now = new Date();
      const lastUpdated = new Date(data.last_updated);
      if (lastUpdated > now) {
        return false;
      }

      // Validate JSON structures
      try {
        JSON.stringify(data.additional_rates);
        JSON.stringify(data.exclusions);
        JSON.stringify(data.rulings);
        JSON.stringify(data.effective_dates);
      } catch {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating product data', error as Error);
      return false;
    }
  }

  async generateUpdateSummary(update: TradeUpdate): Promise<string> {
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate a clear, concise summary of trade policy updates for non-experts."
          },
          {
            role: "user",
            content: update.description
          }
        ]
      });

      return completion.data.choices[0].message?.content || update.description;
    } catch (error) {
      logger.error('Error generating update summary', error as Error);
      return update.description;
    }
  }
}

export const dataProcessor = new DataProcessor();