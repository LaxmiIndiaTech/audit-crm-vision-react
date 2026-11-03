import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api';

type CsvRow = Record<string, string>;

function parseCsv(text: string): { columns: string[]; rows: CsvRow[] } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.length > 0);
  if (lines.length === 0) return { columns: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const headerFields = parseLine(lines[0]);
  const columns = headerFields.map(c => c.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const vals = parseLine(raw);
    const row: CsvRow = {};
    columns.forEach((c, idx) => {
      row[c] = (vals[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { columns, rows };
}

const CashNormsUpload: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const forcedBranchName = useMemo(() => (isEmployee ? user?.branchName : undefined), [isEmployee, user?.branchName]);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [records, setRecords] = useState<CsvRow[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isCsv && !isXlsx) {
      setError('Please upload a CSV or Excel (.xlsx/.xls) file');
      return;
    }

    if (isCsv) {
      try {
        const text = await file.text();
        const parsed = parseCsv(text);
        if (forcedBranchName) {
          if (!parsed.columns.includes('branch_name')) parsed.columns.push('branch_name');
          parsed.rows = parsed.rows.map(r => ({ ...r, branch_name: forcedBranchName }));
        }
        setColumns(parsed.columns);
        setRecords(parsed.rows);
      } catch (err: any) {
        // If text parse fails (e.g. binary disguised as csv), still allow backend import
        setColumns(['File Ready']);
        setRecords([]);
      }
    } else {
      // Excel files will be read directly by backend PhpSpreadsheet
      setColumns(['Excel Workbook Ready for Import']);
      setRecords([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Cash & Cheque Norms</h1>
          <p className="text-muted-foreground">Upload and review daily cash / cheque metrics for branches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/cash-norms')}>View List</Button>
          <Button
            onClick={async () => {
              if (!selectedFile) return;
              try {
                setIsUploading(true);
                const res = await adminApi.importCashChequeReceipts(selectedFile, { async: true });
                toast({ title: 'Import started', description: res.message || 'Your file is being processed.' });
                navigate('/cash-norms');
              } catch (e: any) {
                const msg = e?.message || 'Failed to import file';
                setError(msg);
                toast({ title: 'Import failed', description: msg, variant: 'destructive' });
              } finally {
                setIsUploading(false);
              }
            }}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> CSV Upload</CardTitle>
          <CardDescription>
            Preview shows columns exactly as present in your CSV.
            {forcedBranchName && (
              <>
                <br />
                Note: As an employee, your records will be saved under branch “{forcedBranchName}”.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input type="file" accept=".csv, .xlsx, .xls" onChange={handleFile} />
            {fileName && <p className="text-sm text-muted-foreground mt-2">Selected: {fileName}</p>}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          {records.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Parsed Records ({records.length})</h3>
              <div className="max-h-72 overflow-auto rounded border">
                <table className="w-full text-sm min-w-max">
                  <thead className="bg-muted/50">
                    <tr>
                      {columns.map((c) => (
                        <th key={c} className="px-3 py-2 text-left whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={idx} className="border-t">
                        {columns.map((c) => (
                          <td key={c} className="px-3 py-1 whitespace-nowrap">{r[c] ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigate('/cash-norms')}>Finish</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashNormsUpload;
