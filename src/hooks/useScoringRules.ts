import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  EditableScoringRule,
  ScoringRule,
  ScoringRulesSyncPayload,
  toEditableRule,
  toPayload,
} from '@/types/scoring';

interface UseScoringRulesOptions {
  page?: number;
  perPage?: number;
  autoLoad?: boolean;
  ruleType?: 'cash_cheque' | 'tat_disbursement';
}

interface UseScoringRulesReturn {
  rules: EditableScoringRule[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  addRule: () => void;
  updateRule: (idOrTemp: number | string, patch: Partial<EditableScoringRule>) => void;
  removeRule: (idOrTemp: number | string) => void;
  reload: () => Promise<void>;
  saveAll: (opts?: { replace?: boolean }) => Promise<boolean>;
  validateAll: () => { valid: boolean; errors: string[] };
}

// Client side validation for overlap: inclusive ranges cannot intersect.
const detectOverlaps = (rules: EditableScoringRule[]): string[] => {
  const sorted = [...rules].sort((a,b) => a.minDays - b.minDays || a.maxDays - b.maxDays);
  const errors: string[] = [];
  for (let i=0;i<sorted.length-1;i++) {
    const cur = sorted[i];
    for (let j=i+1;j<sorted.length;j++) {
      const next = sorted[j];
      if (next.minDays <= cur.maxDays && next.maxDays >= cur.minDays) {
        errors.push(`Overlap between ${cur.minDays}-${cur.maxDays} and ${next.minDays}-${next.maxDays}`);
        break; // don't spam too many for same base
      }
    }
  }
  return errors;
};

const validateRule = (r: EditableScoringRule, ruleType: string = 'cash_cheque'): string | null => {
  if (r.minDays < 0) return 'minDays must be >= 0';
  if (r.maxDays < 0) return 'maxDays must be >= 0';
  if (r.minDays > r.maxDays) return 'minDays cannot exceed maxDays';
  const maxScore = ruleType === 'tat_disbursement' ? 100 : 10;
  if (r.score < 0 || r.score > maxScore) return `score must be 0..${maxScore}`;
  return null;
};

/**
 * useScoringRules
 * Local editable collection of ScoringRule rows with validation and bulk sync (replace mode by default).
 * Flow:
 * 1. Load existing rules from backend (ordered by backend default order)
 * 2. User mutates in-memory copy (min/max/score/description/is_active)
 * 3. Save -> POST /scoring_rules/sync { replace: true, rules: [...] }
 *    Backend transactionally validates overlaps and either commits or rejects.
 * Client side does pre-validation to give faster feedback; backend remains source of truth.
 */
export const useScoringRules = (options: UseScoringRulesOptions = {}): UseScoringRulesReturn => {
  const { page = 1, perPage = 100, autoLoad = true, ruleType = 'cash_cheque' } = options;
  const { toast } = useToast();
  const [rules, setRules] = useState<EditableScoringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getScoringRules({ page, per_page: perPage, rule_type: ruleType } as any);
      if (res.status === 'success') {
        const list: ScoringRule[] = res.data.scoring_rules || res.data.scoringRules || [];
        setRules(list.map(toEditableRule));
        setDirty(false);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, ruleType]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  const addRule = useCallback(() => {
    const temp: EditableScoringRule = {
      temp_id: Math.random().toString(36).slice(2),
      ruleType,
      minDays: 0,
      maxDays: 0,
      description: '',
      score: ruleType === 'tat_disbursement' ? 100 : 10,
      is_active: true,
      _dirty: true,
    };
    setRules(prev => [...prev, temp]);
    setDirty(true);
  }, [ruleType]);

  const updateRule = useCallback((idOrTemp: number | string, patch: Partial<EditableScoringRule>) => {
    setRules(prev => prev.map(r => (r.id === idOrTemp || r.temp_id === idOrTemp) ? { ...r, ...patch, _dirty: true } : r));
    setDirty(true);
  }, []);

  const removeRule = useCallback((idOrTemp: number | string) => {
    setRules(prev => prev.filter(r => r.id !== idOrTemp && r.temp_id !== idOrTemp));
    setDirty(true);
  }, []);

  const validateAll = useCallback(() => {
    const perRuleErrors: string[] = [];
    const validated = rules.map(r => {
      const err = validateRule(r, ruleType);
      if (err) perRuleErrors.push(`${r.minDays}-${r.maxDays || '?'}: ${err}`);
      return { ...r, _error: err || undefined };
    });
    const overlapErrors = detectOverlaps(validated);
    const allErrors = [...perRuleErrors, ...overlapErrors];
    setRules(validated);
    return { valid: allErrors.length === 0, errors: allErrors };
  }, [rules, ruleType]);

  const saveAll = useCallback(async (opts: { replace?: boolean } = {}) => {
    const { valid, errors } = validateAll();
    if (!valid) {
      errors.forEach(err => toast({ title: 'Validation error', description: err, variant: 'destructive' }));
      return false;
    }
    setSaving(true);
    try {
      const payload: ScoringRulesSyncPayload = {
        rule_type: ruleType,
        rules: rules.map(toPayload),
        replace: opts.replace ?? true,
      };
      const res = await adminApi.syncScoringRules(payload);
      if (res.status === 'success') {
        const list: ScoringRule[] = res.data.scoring_rules || [];
        setRules(list.map(toEditableRule));
        setDirty(false);
        toast({ title: 'Scoring rules saved', description: `All ${ruleType === 'tat_disbursement' ? 'TAT' : 'Cash'} rules synced successfully.` });
        return true;
      }
      toast({ title: 'Save failed', description: 'Unexpected response', variant: 'destructive' });
      return false;
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message || 'Unknown error', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [rules, ruleType, toast, validateAll]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  return {
    rules,
    loading,
    saving,
    error,
    dirty,
    addRule,
    updateRule,
    removeRule,
    reload,
    saveAll,
    validateAll,
  };
};

export default useScoringRules;
