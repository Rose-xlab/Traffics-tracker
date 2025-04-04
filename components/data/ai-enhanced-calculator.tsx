"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Sparkles } from "lucide-react";
import { AIBadge } from "@/components/ui/ai-badge";
import { Switch } from "@/components/ui/switch";
import { countryService } from "@/lib/services/country-service";
import { TariffExplanation } from "@/components/data/tariff-explanation";

interface TariffCalculatorProps {
  productId: string;
  baseRate: number;
  additionalRates: number[];
  onCountryChange?: (countryId: string) => void;
}

export function TariffCalculator({
  productId,
  baseRate,
  additionalRates = [],
  onCountryChange,
}: TariffCalculatorProps) {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [value, setValue] = useState("1000");
  const [quantity, setQuantity] = useState("1");
  const [totalDuty, setTotalDuty] = useState(0);
  const [effectiveRate, setEffectiveRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enableAIExplanation, setEnableAIExplanation] = useState(true);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    calculateDuty();
  }, [baseRate, additionalRates, value, quantity, selectedCountry]);

  useEffect(() => {
    if (selectedCountry && enableAIExplanation) {
      loadTariffExplanation();
    }
  }, [selectedCountry, enableAIExplanation, totalDuty]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await countryService.getCountries();
      setCountries(data);
      
              // Set default country if available
      if (data.length > 0) {
          setSelectedCountry(data[0].id);
          if (onCountryChange) {
            onCountryChange(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const calculateDuty = () => {
      // Calculate total rate
      const totalRate = baseRate + (additionalRates?.reduce((sum, rate) => sum + rate, 0) || 0);
      setEffectiveRate(totalRate);
      
      // Calculate duty amount
      const importValue = parseFloat(value) || 0;
      const dutyAmount = (importValue * totalRate) / 100;
      setTotalDuty(dutyAmount);
    };
    
    const loadTariffExplanation = async () => {
      try {
        setExplanationLoading(true);
        
        // Build the API URL
        const url = `/api/tariff-explanation?productId=${productId}&countryId=${selectedCountry}`;
        
        // Call the explanation API
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to load tariff explanation');
        }
        
        const data = await response.json();
        setExplanation(data.explanation);
      } catch (error) {
        console.error('Error loading tariff explanation:', error);
      } finally {
        setExplanationLoading(false);
      }
    };
    
    const handleCountryChange = (value: string) => {
      setSelectedCountry(value);
      if (onCountryChange) {
        onCountryChange(value);
      }
    };
    
    const handleCalculate = () => {
      calculateDuty();
    };
    
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <h3 className="text-xl font-semibold">Tariff Calculator</h3>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={handleCountryChange}
                  disabled={loading}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value">Import Value (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    className="pl-10"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              
              <Button onClick={handleCalculate} className="w-full">
                Calculate Duty
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Duty Calculation</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Base Rate:</dt>
                    <dd>{baseRate.toFixed(1)}%</dd>
                  </div>
                  {additionalRates && additionalRates.length > 0 && (
                    <div className="flex justify-between">
                      <dt>Additional Duties:</dt>
                      <dd>{additionalRates.reduce((sum, rate) => sum + rate, 0).toFixed(1)}%</dd>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <dt>Effective Rate:</dt>
                    <dd>{effectiveRate.toFixed(1)}%</dd>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <dt>Total Duty:</dt>
                      <dd>${totalDuty.toFixed(2)}</dd>
                    </div>
                  </div>
                </dl>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>
                  This calculation is an estimate based on the duty rate only. 
                  Additional fees such as merchandise processing fees, harbor 
                  maintenance fees, and other applicable charges are not included.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-2">
            <Switch
              id="enable-ai-explanation"
              checked={enableAIExplanation}
              onCheckedChange={setEnableAIExplanation}
            />
            <label
              htmlFor="enable-ai-explanation"
              className="text-sm flex items-center cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1 text-primary" />
              Show AI explanation of this tariff
            </label>
          </div>
        </Card>
        
        {enableAIExplanation && explanation && (
          <TariffExplanation
            product={{ id: productId }}
            country={{ id: selectedCountry }}
            explanation={explanation}
            loading={explanationLoading}
          />
        )}
      </div>
    );
  }