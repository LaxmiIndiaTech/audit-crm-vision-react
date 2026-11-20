// Scoring Rules (integrated with Rails backend ScoringRule model)
// Backend fields: id, min_days, max_days, description, score, is_active, is_deleted, meta, timestamps

export type RuleType = 'cash_cheque' | 'tat_disbursement' | 'target_achievement';

export interface ScoringRule {
  id: number | string; // backend numeric id; temporary client rows can use a temp string id
  rule_type?: RuleType;
  min_days: number; // inclusive
  max_days: number; // inclusive
  description?: string | null;
  score: number; // 0..10 for cash, 0..100% for tat & target achievement
  is_active: boolean;
  is_deleted?: boolean; // rarely sent to client, but keep for completeness
  meta?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

// Payload for create/update (single rule)
export interface ScoringRulePayload {
  rule_type?: RuleType;
  min_days: number;
  max_days: number;
  description?: string;
  score: number;
  is_active?: boolean;
}

// Bulk sync request body
export interface ScoringRulesSyncPayload {
  rule_type?: RuleType;
  rules: Array<Partial<Pick<ScoringRule, 'id'>> & ScoringRulePayload>;
  replace?: boolean; // when true, rules not in payload are soft-deleted (inactive)
}

// API response shapes (mirroring backend serializer expectations)
export interface ScoringRulesIndexResponse {
  status: 'success';
  data: {
    scoring_rules: ScoringRule[];
    pagination?: {
      page: number;
      per_page: number;
      total_pages: number;
      next_page: number | null;
      prev_page: number | null;
    };
  };
  message: string;
}

export interface ScoringRuleShowResponse {
  status: 'success';
  data: {
    scoring_rule: ScoringRule;
  };
  message: string;
}

export interface ScoringRuleMutationResponse {
  status: 'success';
  data: {
    scoring_rule: ScoringRule;
  };
  message: string;
}

export interface ScoringRulesSyncResponse {
  status: 'success';
  data: {
    scoring_rules: ScoringRule[];
  };
  message: string;
}

export type AnyScoringResponse =
  | ScoringRulesIndexResponse
  | ScoringRuleShowResponse
  | ScoringRuleMutationResponse
  | ScoringRulesSyncResponse;

// Client-side helper type for editable row state bridging camelCase UI fields and snake_case API
export interface EditableScoringRule {
  temp_id?: string; // for unsaved rows
  id?: number; // present if persisted
  ruleType?: RuleType;
  minDays: number;
  maxDays: number;
  description: string;
  score: number;
  is_active: boolean;
  _dirty?: boolean; // local change tracking
  _error?: string; // validation error
}

export const toEditableRule = (rule: ScoringRule): EditableScoringRule => ({
  id: typeof rule.id === 'number' ? rule.id : Number(rule.id),
  ruleType: rule.rule_type,
  minDays: rule.min_days,
  maxDays: rule.max_days,
  description: rule.description || '',
  score: rule.score,
  is_active: rule.is_active,
});

export const toPayload = (rule: EditableScoringRule): ScoringRulePayload & { id?: number } => ({
  ...(rule.id ? { id: rule.id } : {}),
  rule_type: rule.ruleType,
  min_days: rule.minDays,
  max_days: rule.maxDays,
  description: rule.description || undefined,
  score: rule.score,
  is_active: rule.is_active,
});
