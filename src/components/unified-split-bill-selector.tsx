"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Package, 
  User, 
  Percent, 
  Wallet, 
  Share2,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { 
  SplitMethod, 
  SplitConfig,
  EqualSplitConfig,
  ByItemSplitConfig,
  ByPersonSplitConfig,
  PercentageSplitConfig,
  CustomAmountSplitConfig,
  SharedItemsSplitConfig
} from '@/lib/split-bill-calculator';
import { type OrderItem } from '@/lib/types';

interface UnifiedSplitBillSelectorProps {
  orderItems: OrderItem[];
  totalAmount: number;
  tax: number;
  tip: number;
  onConfigChange: (config: SplitConfig | null) => void;
  onValidChange: (isValid: boolean) => void;
}

const SPLIT_METHODS: { 
  value: SplitMethod; 
  label: string; 
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'equal',
    label: 'Equal Split',
    icon: <Users className="h-4 w-4" />,
    description: 'Divide the total evenly among all people'
  },
  {
    value: 'by_item',
    label: 'By Item',
    icon: <Package className="h-4 w-4" />,
    description: 'Assign specific items to specific people'
  },
  {
    value: 'by_person',
    label: 'By Person',
    icon: <User className="h-4 w-4" />,
    description: 'Create separate bills for each person'
  },
  {
    value: 'percentage',
    label: 'Percentage',
    icon: <Percent className="h-4 w-4" />,
    description: 'Split by custom percentages'
  },
  {
    value: 'custom_amount',
    label: 'Custom Amount',
    icon: <Wallet className="h-4 w-4" />,
    description: 'Each person pays a specific amount'
  },
  {
    value: 'shared_items',
    label: 'Shared Items',
    icon: <Share2 className="h-4 w-4" />,
    description: 'Mix of shared and individual items'
  }
];

export function UnifiedSplitBillSelector({
  orderItems,
  totalAmount,
  tax,
  tip,
  onConfigChange,
  onValidChange
}: UnifiedSplitBillSelectorProps) {
  const { t } = useI18nStore();
  const [selectedMethod, setSelectedMethod] = useState<SplitMethod | null>(null);
  const [config, setConfig] = useState<SplitConfig | null>(null);
  const [isValid, setIsValid] = useState(true);

  const handleMethodChange = (method: SplitMethod) => {
    setSelectedMethod(method);
    let newConfig: SplitConfig | null = null;
    
    switch (method) {
      case 'equal':
        newConfig = {
          method: 'equal',
          numberOfPeople: 2,
          includeTaxTips: true,
          roundTo: 'cent'
        } satisfies EqualSplitConfig;
        break;
        
      case 'by_item':
        newConfig = {
          method: 'by_item',
          assignments: [],
          includeTaxTips: true
        } satisfies ByItemSplitConfig;
        break;
        
      case 'by_person':
        newConfig = {
          method: 'by_person',
          bills: [{ id: 'bill_1', personIds: ['person_1'], itemQuantities: {} }],
          includeTaxTips: true
        } satisfies ByPersonSplitConfig;
        break;
        
      case 'percentage':
        newConfig = {
          method: 'percentage',
          allocations: [
            { personId: 'person_1', percentage: 50 },
            { personId: 'person_2', percentage: 50 }
          ],
          includeTaxTips: true,
          roundTo: 'cent'
        } satisfies PercentageSplitConfig;
        break;
        
      case 'custom_amount':
        newConfig = {
          method: 'custom_amount',
          allocations: [],
          includeTaxTips: true
        } satisfies CustomAmountSplitConfig;
        break;
        
      case 'shared_items':
        newConfig = {
          method: 'shared_items',
          sharedItems: [],
          individualItems: [],
          includeTaxTips: true
        } satisfies SharedItemsSplitConfig;
        break;
    }
    
    setConfig(newConfig);
    onConfigChange(newConfig);
    validateConfig(newConfig);
  };

  const validateConfig = (cfg: SplitConfig | null) => {
    if (!cfg) {
      setIsValid(false);
      onValidChange(false);
      return;
    }
    
    let valid = true;
    
    switch (cfg.method) {
      case 'equal':
        valid = cfg.numberOfPeople > 0;
        break;
      case 'percentage':
        const totalPercent = cfg.allocations.reduce((sum, a) => sum + a.percentage, 0);
        valid = Math.abs(totalPercent - 100) < 0.01 && cfg.allocations.length > 0;
        break;
      case 'custom_amount':
        const totalAmount = cfg.allocations.reduce((sum, a) => sum + a.amount, 0);
        const expectedTotal = cfg.includeTaxTips ? (totalAmount + tax + tip) : totalAmount;
        valid = Math.abs(totalAmount - expectedTotal) < 0.01 && cfg.allocations.length > 0;
        break;
    }
    
    setIsValid(valid);
    onValidChange(valid);
  };

  const renderMethodConfig = () => {
    if (!selectedMethod || !config) return null;

    switch (selectedMethod) {
      case 'equal':
        return <EqualSplitConfigurator config={config as EqualSplitConfig} onUpdate={setConfig} />;
      case 'by_item':
        return <ByItemSplitConfigurator 
          config={config as ByItemSplitConfig} 
          orderItems={orderItems}
          onUpdate={setConfig} 
        />;
      case 'by_person':
        return <ByPersonSplitConfigurator 
          config={config as ByPersonSplitConfig} 
          orderItems={orderItems}
          onUpdate={setConfig} 
        />;
      case 'percentage':
        return <PercentageSplitConfigurator config={config as PercentageSplitConfig} onUpdate={setConfig} />;
      case 'custom_amount':
        return <CustomAmountSplitConfigurator 
          config={config as CustomAmountSplitConfig} 
          totalAmount={totalAmount}
          tax={tax}
          tip={tip}
          onUpdate={setConfig} 
        />;
      case 'shared_items':
        return <SharedItemsSplitConfigurator 
          config={config as SharedItemsSplitConfig} 
          orderItems={orderItems}
          onUpdate={setConfig} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="font-semibold text-base mb-3 block">
          {t('pos.payment_dialog.split_method')}
        </Label>
        <RadioGroup 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          value={selectedMethod || ''}
          onValueChange={handleMethodChange}
        >
          {SPLIT_METHODS.map((method) => (
            <div key={method.value}>
              <RadioGroupItem value={method.value} id={method.value} className="peer sr-only" />
              <Label
                htmlFor={method.value}
                className="flex flex-col gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  {method.icon}
                  <span className="font-semibold">{method.label}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {method.description}
                </p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {SPLIT_METHODS.find(m => m.value === selectedMethod)?.icon}
              Configure {SPLIT_METHODS.find(m => m.value === selectedMethod)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMethodConfig()}
            
            {!isValid && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">
                  Please fix the configuration to continue
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual configurator components would go here
// For brevity, I'll include simplified versions

function EqualSplitConfigurator({ 
  config, 
  onUpdate 
}: { 
  config: EqualSplitConfig; 
  onUpdate: (config: SplitConfig) => void;
}) {
  const { t } = useI18nStore();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="num-people">Number of People</Label>
          <Input
            id="num-people"
            type="number"
            min="1"
            value={config.numberOfPeople}
            onChange={(e) => onUpdate({
              ...config,
              numberOfPeople: parseInt(e.target.value) || 1
            })}
          />
        </div>
        <div>
          <Label>Include Tax & Tips</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="include-tax-tips"
              checked={config.includeTaxTips}
              onChange={(e) => onUpdate({
                ...config,
                includeTaxTips: e.target.checked
              })}
              className="h-4 w-4"
            />
            <Label htmlFor="include-tax-tips" className="font-normal">
              Split tax and tips proportionally
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Other configurator components would be implemented similarly
// ByItemSplitConfigurator, ByPersonSplitConfigurator, etc.
// For now, I'll create placeholder components

function ByItemSplitConfigurator({ 
  config, 
  orderItems, 
  onUpdate 
}: { 
  config: ByItemSplitConfig; 
  orderItems: OrderItem[];
  onUpdate: (config: SplitConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Assign items to specific people
      </p>
      {/* Implementation would go here */}
    </div>
  );
}

function ByPersonSplitConfigurator({ 
  config, 
  orderItems, 
  onUpdate 
}: { 
  config: ByPersonSplitConfig; 
  orderItems: OrderItem[];
  onUpdate: (config: SplitConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create separate bills for each person
      </p>
      {/* Implementation would go here */}
    </div>
  );
}

function PercentageSplitConfigurator({ 
  config, 
  onUpdate 
}: { 
  config: PercentageSplitConfig; 
  onUpdate: (config: SplitConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Split by custom percentages
      </p>
      {/* Implementation would go here */}
    </div>
  );
}

function CustomAmountSplitConfigurator({ 
  config, 
  totalAmount,
  tax,
  tip,
  onUpdate 
}: { 
  config: CustomAmountSplitConfig; 
  totalAmount: number;
  tax: number;
  tip: number;
  onUpdate: (config: SplitConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each person pays a specific amount
      </p>
      {/* Implementation would go here */}
    </div>
  );
}

function SharedItemsSplitConfigurator({ 
  config, 
  orderItems, 
  onUpdate 
}: { 
  config: SharedItemsSplitConfig; 
  orderItems: OrderItem[];
  onUpdate: (config: SplitConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mix of shared and individual items
      </p>
      {/* Implementation would go here */}
    </div>
  );
}