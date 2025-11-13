import fs from 'fs';
import path from 'path';
import { extractContractClauses, ContractClauseExtraction } from '../src/services/llmService';

type ExpectedPresence = {
  parties: boolean; term: boolean; termination: boolean; payment: boolean;
  confidentiality: boolean; liability: boolean; governingLaw: boolean;
  disputeResolution: boolean; signatories: boolean;
};

type EvaluationResult = {
  file: string;
  accuracyPct: number;
  edgeCaseHandled: boolean;
  durationMs: number;
  errors: string[];
};

function presenceFromClauses(c: ContractClauseExtraction): ExpectedPresence {
  const has = (v?: string) => !!v && v.trim().length > 0;
  return {
    parties: has(c.parties),
    term: has(c.term),
    termination: has(c.termination),
    payment: has(c.payment),
    confidentiality: has(c.confidentiality),
    liability: has(c.liability),
    governingLaw: has(c.governingLaw),
    disputeResolution: has(c.disputeResolution),
    signatories: has(c.signatories),
  };
}

async function evaluateOne(sampleName: string): Promise<EvaluationResult> {
  const samplePath = path.join(process.cwd(), 'BeMongo', 'samples', `${sampleName}.txt`);
  const expectedPath = path.join(process.cwd(), 'BeMongo', 'samples', `${sampleName}.expected.json`);
  const text = fs.readFileSync(samplePath, 'utf-8');
  const expected: ExpectedPresence = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));
  const start = Date.now();
  const { clauses, errors } = await extractContractClauses(text);
  const durationMs = Date.now() - start;
  const actual = presenceFromClauses(clauses);
  const keys = Object.keys(expected) as (keyof ExpectedPresence)[];
  const correct = keys.reduce((acc, k) => acc + (expected[k] === actual[k] ? 1 : 0), 0);
  const accuracyPct = Math.round((correct / keys.length) * 100);
  const edgeCaseHandled = errors.length === 0; // simplistic: no validation errors
  return { file: sampleName, accuracyPct, edgeCaseHandled, durationMs, errors: errors || [] };
}

async function main() {
  const samples = ['valid_contract', 'invalid_missing_signatures', 'edge_contradictory_terms'];
  const results: EvaluationResult[] = [];
  for (const s of samples) {
    try {
      const r = await evaluateOne(s);
      results.push(r);
      console.log(`[${s}] accuracy=${r.accuracyPct}% duration=${r.durationMs}ms errors=${r.errors.length}`);
    } catch (e) {
      console.error(`Failed on sample ${s}:`, e);
    }
  }
  const avgAcc = Math.round(results.reduce((a, r) => a + r.accuracyPct, 0) / Math.max(1, results.length));
  const under30s = results.filter(r => r.durationMs <= 30000).length;
  console.log(`Average accuracy: ${avgAcc}%`);
  console.log(`Processing under 30s: ${under30s}/${results.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });