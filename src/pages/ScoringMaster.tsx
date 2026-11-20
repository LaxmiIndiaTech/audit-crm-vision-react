import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Loader2, Trash2, RefreshCcw, Banknote, Clock, Sparkles, Target, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import useScoringRules from '@/hooks/useScoringRules';
import { useToast } from '@/hooks/use-toast';
import { RuleType } from '@/types/scoring';

const ScoringMaster: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<RuleType>('cash_cheque');

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
  const isTarget = activeTab === 'target_achievement';
  const maxScore = isTat || isTarget ? 100 : 10;
  const carryMarks = isTarget ? 15.0 : isTat ? 5.0 : 2.0;

  const handleSave = async () => {
    const ok = await saveAll({ replace: true });
    if (!ok) return;
  };

  const handleApplyDefaults = () => {
    if (isTarget) {
      // Standard LIFC Policy Tiers for Section I (Target vs Achievement - 15 Marks Carry)
      const defaultTargetSlabs = [
        { minDays: 91, maxDays: 9999, score: 100, description: '> 90% Achievement (100% Marks - 15.00M Carry)', is_active: true },
        { minDays: 61, maxDays: 90, score: 75, description: '60% to 90% Achievement (75% Marks - 11.25M Carry)', is_active: true },
        { minDays: 40, maxDays: 60, score: 50, description: '40% to 60% Achievement (50% Marks - 7.50M Carry)', is_active: true },
        { minDays: 0, maxDays: 39, score: 20, description: 'Below 40% Achievement (20% Marks - 3.00M Carry)', is_active: true },
      ];

      defaultTargetSlabs.forEach((slab, idx) => {
        if (rules[idx]) {
          updateRule(rules[idx].id ?? rules[idx].temp_id!, slab);
        } else {
          addRule();
        }
      });

      toast({
        title: 'Target vs Achievement Slabs Loaded',
        description: 'Standard 4-tier policy loaded. Click "Save Changes" to apply.',
      });
      return;
    }

    if (isTat) {
      // Standard LIFC Policy Tiers for Section H (TAT - 5 Marks Carry)
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
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Scoring Master</h1>
          <p className="text-muted-foreground text-sm">
            Audit checkpoints scoring rules configure karein (Section A.1 Cash Norms, Section H.1 TAT Norms &amp; Section I.1 Target vs Achievement).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {(isTat || isTarget) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyDefaults}
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
        onValueChange={(val) => setActiveTab(val as RuleType)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-2xl h-auto p-1 bg-muted/60 border">
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
          <TabsTrigger
            value="target_achievement"
            className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Target className="w-4 h-4 shrink-0" />
            <span>Target vs Achievement (I.1)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Scoring Rules Card */}
      <Card className="crm-card border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {isTarget ? (
                  <>
                    <Target className="w-5 h-5 text-primary" />
                    <span>Target vs Achievement Rules (Section I.1 - 15 Marks Carry)</span>
                  </>
                ) : isTat ? (
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
                {isTarget ? (
                  <>
                    Branch achievement percentage (Disbursed Amount / Target Amount) ke mutabiq score percentage (0-100%) set karein.
                    Calculated marks auto-derive honge: <strong>Score % × 15.0 Marks</strong>.
                  </>
                ) : isTat ? (
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-primary/5 text-primary border-primary/20">
                {rules.length} Active Slabs
              </Badge>
              {dirty && (
                <Badge variant="secondary" className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px] font-bold text-xs uppercase text-foreground">
                    {isTarget ? 'Min %' : 'Min Days'}
                  </TableHead>
                  <TableHead className="w-[120px] font-bold text-xs uppercase text-foreground">
                    {isTarget ? 'Max %' : 'Max Days'}
                  </TableHead>
                  <TableHead className="min-w-[200px] font-bold text-xs uppercase text-foreground">
                    Description &amp; Slab Label
                  </TableHead>
                  <TableHead className="w-[200px] font-bold text-xs uppercase text-foreground">
                    {isTat || isTarget ? 'Score Percentage' : 'Rule Score'}
                  </TableHead>
                  <TableHead className="w-[140px] text-center font-bold text-xs uppercase text-foreground">
                    {isTat || isTarget ? 'Effective Marks' : 'Weighted Score'}
                  </TableHead>
                  <TableHead className="w-[90px] text-center font-bold text-xs uppercase text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-[70px] text-right font-bold text-xs uppercase text-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading {isTarget ? 'Target' : isTat ? 'TAT' : 'Cash'} rules...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  rules.map((rule) => {
                    const calculatedMarks = isTat || isTarget
                      ? ((rule.score / 100) * carryMarks).toFixed(2)
                      : rule.score;

                    return (
                      <TableRow
                        key={rule.id || rule.temp_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Min Days / % */}
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

                        {/* Max Days / % */}
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
                              isTarget
                                ? 'e.g. 60% to 90% Achievement (75% Marks)'
                                : isTat
                                ? 'e.g. 11-20 Days (75% Marks)'
                                : 'e.g. T+1 Deposited on time'
                            }
                            className="h-8 text-xs font-medium"
                          />
                        </TableCell>

                        {/* Score Slider */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[rule.score]}
                              max={maxScore}
                              step={1}
                              onValueChange={(val) =>
                                updateRule(rule.id ?? rule.temp_id!, {
                                  score: val[0],
                                })
                              }
                              className="w-28"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={maxScore}
                              value={rule.score}
                              onChange={(e) =>
                                updateRule(rule.id ?? rule.temp_id!, {
                                  score: Math.min(maxScore, Math.max(0, Number(e.target.value))),
                                })
                              }
                              className="h-8 w-14 text-xs font-mono font-bold text-center"
                            />
                            {(isTat || isTarget) && <span className="text-xs text-muted-foreground font-semibold">%</span>}
                          </div>
                        </TableCell>

                        {/* Marks Badge */}
                        <TableCell className="text-center">
                          {isTat || isTarget ? (
                            <div className="flex flex-col items-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${
                                  rule.score >= 90
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : rule.score >= 60
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : rule.score >= 40
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {rule.score}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                {calculatedMarks} / {carryMarks.toFixed(2)} M
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
                            No rules configured for {isTarget ? 'Target vs Achievement' : isTat ? 'TAT' : 'Cash Norms'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isTarget || isTat
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
