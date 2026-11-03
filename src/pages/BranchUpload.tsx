import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Branch } from '@/types/crm';

// Simple CSV parser (no quotes support) for mock
function parseCsv(text: string): Branch[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) return [];
  const cols = header.split(',').map(h => h.trim().toLowerCase());
  return lines.map((line, idx) => {
    const parts = line.split(',');
    const rec: any = { id: `upload_${idx}_${Date.now()}` };
    cols.forEach((c, i) => { rec[c] = parts[i]?.trim(); });
    if (!rec.name) rec.name = `Branch ${idx+1}`;
    return rec as Branch;
  });
}

const BranchUpload = () => {
  const [fileName, setFileName] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    const text = await file.text();
    try {
      const parsed = parseCsv(text);
      setBranches(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Branch Data</h1>
          <p className="text-muted-foreground">Import branches from a CSV file (columns: name,city,state,manager,phone,status)</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/branches')}>Back to List</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> File Import</CardTitle>
          <CardDescription>Select a CSV file and preview the parsed branches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input type="file" accept=".csv" onChange={handleFile} />
            {fileName && <p className="text-sm text-muted-foreground mt-2">Selected: {fileName}</p>}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          {branches.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Parsed Branches ({branches.length})</h3>
              <div className="max-h-72 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">City</th>
                      <th className="px-3 py-2 text-left">State</th>
                      <th className="px-3 py-2 text-left">Manager</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.id} className="border-t">
                        <td className="px-3 py-1">{b.name}</td>
                        <td className="px-3 py-1">{b.city}</td>
                        <td className="px-3 py-1">{b.state}</td>
                        <td className="px-3 py-1">{b.manager}</td>
                        <td className="px-3 py-1">{b.phone}</td>
                        <td className="px-3 py-1">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigate('/branches')}>Finish</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchUpload;
