import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Loader2, Trash2, RefreshCcw, Banknote, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import useScoringRules from '@/hooks/useScoringRules';
import { useToast } from '@/hooks/use-toast';

const ScoringMaster: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'cash_cheque' | 'tat_disbursement'>('cash_cheque');

  const {
    rules,
    addRule,
    updateRule,
    saveAll,
    loading,
    saving,
    dirty,
    removeRule,
    reload,
  } = useScoringRules({ ruleType: activeTab });

  const isTat = activeTab === 'tat_disbursement';
  const maxScore = isTat ? 100 : 10;

  const handleSave = async () => {
    const ok = await saveAll({ replace: true });
    if (!ok) return;
  };

  const handleApplyTatDefaults = () => {
    // Standard LIFC Policy Tiers for Section H
    const defaultTatSlabs = [
      { minDays: 0, maxDays: 10, score: 100, description: '0 to 10 Days (100% Marks - 5M Carry)', is_active: true },
      { minDays: 11, maxDays: 20, score: 75, description: '11 to 20 Days (75% Marks - 3.75M Carry)', is_active: true },
      { minDays: 21, maxDays: 30, score: 50, description: '21 to 30 Days (50% Marks - 2.50M Carry)', is_active: true },
      { minDays: 31, maxDays: 9999, score: 20, description: '31 and above Days (20% Marks - 1.00M Carry)', is_active: true },
    ];

    defaultTatSlabs.forEach((slab, idx) => {
      if (rules[idx]) {
        updateRule(rules[idx].id ?? rules[idx].temp_id!, slab);
      } else {
        addRule();
      }
    });

    toast({
      title: 'TAT Default Slabs Loaded',
      description: 'Standard 4-tier policy loaded. Click "Save Changes" to apply.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Scoring Master</h1>
          <p className="text-muted-foreground text-sm">
            Audit checkpoints scoring rules configure karein (Section A.1 Cash Norms &amp; Section H.1 TAT Norms).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isTat && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyTatDefaults}
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Standard Slabs</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRule()}
            className="hover-lift gap-1 text-xs"
            disabled={loading || saving}
          >
            <Plus className="w-4 h-4" /> Add Rule Slab
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reload()}
            disabled={loading || saving}
            className="hover-lift gap-1 text-xs"
          >
            <RefreshCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Reload
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            variant={dirty ? 'default' : 'outline'}
            className="gap-1.5 text-xs font-semibold shadow-sm"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {dirty ? (saving ? 'Saving...' : 'Save Changes') : 'Saved'}
          </Button>
        </div>
      </div>

      {/* Tabs Selector for Rule Categories */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'cash_cheque' | 'tat_disbursement')}
        className="w-full"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-xl h-auto p-1 bg-muted/60 border">
          <TabsTrigger
            value="cash_cheque"
            className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>Cash &amp; Cheque Norms (A.1)</span>
          </TabsTrigger>
          <TabsTrigger
            value="tat_disbursement"
            className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Login to Disbursal TAT (H.1)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Scoring Rules Card */}
      <Card className="crm-card border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {isTat ? (
                  <>
                    <Clock className="w-5 h-5 text-primary" />
                    <span>TAT Login to Disbursement Rules (Section H.1 - 5 Marks Carry)</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-5 h-5 text-primary" />
                    <span>Cash &amp; Cheque Management Norms (Section A.1 - 2 Marks Carry)</span>
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {isTat ? (
                  <>
                    Branch average processing days ke mutabiq score percentage (0-100%) set karein.
                    Calculated marks auto-derive honge: <strong>Score % × 5.0 Marks</strong>.
                  </>
                ) : (
                  <>
                    Receipt date aur bank deposit date ke difference (T+1 norms) ke mutabiq weighted score (0-10) set karein.
                  </>
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs shrink-0 self-start sm:self-auto">
              {rules.length} Rules Configured
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="crm-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-28 font-semibold text-xs">Min Days</TableHead>
                  <TableHead className="w-28 font-semibold text-xs">Max Days</TableHead>
                  <TableHead className="min-w-[220px] font-semibold text-xs">Policy / Slab Description</TableHead>
                  <TableHead className="min-w-[200px] font-semibold text-xs">
                    {isTat ? 'Score % (0-100%)' : 'Score Weight (0-10)'}
                  </TableHead>
                  <TableHead className="w-32 text-center font-semibold text-xs">
                    {isTat ? 'Awarded Marks' : 'Points'}
                  </TableHead>
                  <TableHead className="w-20 text-center font-semibold text-xs">Active</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading {isTat ? 'TAT' : 'Cash'} rules...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  rules.map((rule) => {
                    const calculatedMarks = isTat
                      ? ((rule.score / 100) * 5.0).toFixed(2)
                      : rule.score;

                    return (
                      <TableRow
                        key={rule.id || rule.temp_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Min Days */}
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.minDays}
                            min={0}
                            onChange={(e) =>
                              updateRule(rule.id ?? rule.temp_id!, {
                                minDays: Number(e.target.value),
                              })
                            }
                            className="h-8 text-xs font-mono font-medium"
                          />
                        </TableCell>

                        {/* Max Days */}
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.maxDays}
                            min={rule.minDays}
                            onChange={(e) =>
                              updateRule(rule.id ?? rule.temp_id!, {
                                maxDays: Number(e.target.value),
                              })
                            }
                            className="h-8 text-xs font-mono font-medium"
                          />
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <Input
                            value={rule.description || ''}
                            onChange={(e) =>
                              updateRule(rule.id ?? rule.temp_id!, {
                                description: e.target.value,
                              })
                            }
                            placeholder={
                              isTat
                                ? 'e.g. 0-10 Days (100% Marks)'
                                : 'e.g. T+0 or T+1 (Deposited on time)'
                            }
                            className="h-8 text-xs"
                          />
                        </TableCell>

                        {/* Slider for Score */}
                        <TableCell className="py-3">
                          <div className="space-y-1.5">
                            <Slider
                              value={[rule.score]}
                              min={0}
                              max={maxScore}
                              step={isTat ? 5 : 1}
                              onValueChange={(v) =>
                                updateRule(rule.id ?? rule.temp_id!, { score: v[0] })
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                              <span>0{isTat ? '%' : ''}</span>
                              <span>{isTat ? '50%' : '5'}</span>
                              <span>{maxScore}{isTat ? '%' : ''}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Score & Calculated Marks Badge */}
                        <TableCell className="text-center">
                          {isTat ? (
                            <div className="flex flex-col items-center">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-xs ${
                                  rule.score >= 75
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : rule.score >= 50
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {rule.score}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                {calculatedMarks} / 5.00 M
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded font-bold text-xs ${
                                rule.score >= 8
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : rule.score >= 5
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {rule.score} / 10
                            </span>
                          )}
                        </TableCell>

                        {/* Active Switch */}
                        <TableCell className="text-center">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(v) =>
                              updateRule(rule.id ?? rule.temp_id!, { is_active: v })
                            }
                          />
                        </TableCell>

                        {/* Remove Action */}
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Remove"
                            onClick={() => removeRule(rule.id ?? rule.temp_id!)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {!loading && rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            No rules configured for {isTat ? 'TAT' : 'Cash Norms'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isTat
                              ? 'Click "Standard Slabs" above to load default 4-tier rules or add custom slabs.'
                              : 'Click "Add Rule Slab" to define deposit delay rules.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoringMaster;
