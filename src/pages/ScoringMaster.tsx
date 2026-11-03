import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, Loader2, Trash2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import useScoringRules from '@/hooks/useScoringRules';
import { useToast } from '@/hooks/use-toast';

// ScoringMaster now integrates with backend rails ScoringRules controller via bulk sync endpoint.
// This page edits all rules locally then performs a POST /scoring_rules/sync (replace=true) on Save.

const ScoringMaster: React.FC = () => {
  const { toast } = useToast();
  const { rules, addRule, updateRule, saveAll, loading, saving, dirty, removeRule, reload } = useScoringRules();

  const handleSave = async () => {
    const ok = await saveAll({ replace: true });
    if (!ok) return;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="responsive-heading">Scoring Master</h1>
          <p className="text-muted-foreground text-lg">Define score allocation for cash & cheque norms based on cheque received vs deposit days difference.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => addRule()} className="hover-lift" disabled={loading || saving}>
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </Button>
          <Button variant="outline" onClick={() => reload()} disabled={loading || saving} className="hover-lift">
            <RefreshCcw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} /> Reload
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving} variant={dirty ? 'premium' : 'default'} className="hover-glow">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {dirty ? (saving ? 'Saving...' : 'Save Changes') : 'Saved'}
          </Button>
        </div>
      </div>

      <Card className="crm-card-premium animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
            </div>
            Scoring Rules Configuration
          </CardTitle>
          <CardDescription className="text-base">
            Adjust score via interactive sliders (0-10). Ranges use inclusive min/max days. Save performs a transactional bulk sync (replace mode).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-auto rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
            <Table className="crm-table">
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-muted/30">
                  <TableHead className="w-32 font-semibold">Min Days</TableHead>
                  <TableHead className="w-32 font-semibold">Max Days</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Description</TableHead>
                  <TableHead className="w-56 font-semibold">Score Adjustment</TableHead>
                  <TableHead className="w-16 text-center font-semibold">Value</TableHead>
                  <TableHead className="w-24 text-center font-semibold">Active</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading rules...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rules.map((rule) => (
                  <TableRow key={rule.id || rule.temp_id} className="border-border/30 hover:bg-primary/5 transition-colors duration-200">
                    <TableCell>
                      <Input
                        type="number"
                        value={rule.minDays}
                        min={0}
                        onChange={e => updateRule(rule.id ?? rule.temp_id!, { minDays: Number(e.target.value) })}
                        className="crm-input h-9" />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={rule.maxDays}
                        min={rule.minDays}
                        onChange={e => updateRule(rule.id ?? rule.temp_id!, { maxDays: Number(e.target.value) })}
                        className="crm-input h-9" />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={rule.description || ''}
                        onChange={e => updateRule(rule.id ?? rule.temp_id!, { description: e.target.value })}
                        placeholder="Enter description..."
                        className="crm-input h-9" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <Slider
                          value={[rule.score]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(v) => updateRule(rule.id ?? rule.temp_id!, { score: v[0] })}
                          className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-medium transition-all duration-200',
                        rule.score >= 8 ? 'bg-gradient-success text-white' :
                          rule.score >= 5 ? 'bg-gradient-warning text-white' :
                            'bg-gradient-destructive text-white'
                      )}>
                        {rule.score}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={rule.is_active} onCheckedChange={(v) => updateRule(rule.id ?? rule.temp_id!, { is_active: v })} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => removeRule(rule.id ?? rule.temp_id!)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-primary/20 rounded-full flex items-center justify-center mx-auto">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-semibold">No rules configured</p>
                          <p className="text-muted-foreground">Get started by adding your first scoring rule</p>
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
