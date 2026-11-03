import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, HolidayItem } from '@/lib/api';
import { Calendar, Plus, Upload, Trash2, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, Search } from 'lucide-react';

export const HolidayMaster: React.FC = () => {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Add Form State
  const [formDate, setFormDate] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('bank_holiday');
  const [submitting, setSubmitting] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Summary
  const [totalYear, setTotalYear] = useState(0);
  const [upcoming, setUpcoming] = useState(0);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getHolidays({
        year: Number(selectedYear),
        month: selectedMonth !== 'all' ? Number(selectedMonth) : undefined,
        search: search || undefined,
        per_page: 100,
      });

      if (res && res.data) {
        setHolidays(res.data.holidays || []);
        setTotalYear(res.data.summary?.total_year || res.data.holidays?.length || 0);
        setUpcoming(res.data.summary?.upcoming || 0);
      }
    } catch (e: any) {
      toast({
        title: 'Error loading holidays',
        description: e.message || 'Could not fetch holiday records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [selectedYear, selectedMonth, search]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formName) {
      toast({ title: 'Validation Error', description: 'Please fill Date and Holiday Name', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createHoliday({
        holiday_date: formDate,
        holiday_name: formName,
        type: formType,
      });

      toast({
        title: 'Holiday Added',
        description: `${formName} added for ${formDate}`,
      });
      setAddModalOpen(false);
      setFormDate('');
      setFormName('');
      loadHolidays();
    } catch (e: any) {
      toast({
        title: 'Error saving holiday',
        description: e.message || 'Could not save holiday',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete holiday "${name}"?`)) return;

    try {
      await adminApi.deleteHoliday(id);
      toast({ title: 'Deleted', description: `Holiday "${name}" removed.` });
      loadHolidays();
    } catch (e: any) {
      toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
    }
  };

  const handleUploadSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast({ title: 'Select File', description: 'Please choose a CSV or Excel file', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      const res = await adminApi.importHolidays(uploadFile);
      toast({
        title: 'Import Successful',
        description: res.message || 'Holidays imported successfully!',
      });
      setUploadModalOpen(false);
      setUploadFile(null);
      loadHolidays();
    } catch (e: any) {
      toast({
        title: 'Import Failed',
        description: e.message || 'Could not import holidays',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRecalculateScores = async () => {
    try {
      setRecalculating(true);
      const res = await adminApi.recalculateWorkingDays();
      toast({
        title: 'Scores Recalculated!',
        description: res.message || 'All receipts and branch scorecards updated with working days.',
      });
    } catch (e: any) {
      toast({
        title: 'Recalculation Failed',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setRecalculating(false);
    }
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const getDayName = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Holiday Master</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Banking Working Days Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sundays aur 2nd/4th Saturdays system automatically exclude karta hai. Yahan se quarterly/annual holidays manage ya sheet upload karein.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateScores}
            disabled={recalculating}
            className="gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating…' : 'Sync & Recalculate Scores'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="gap-1.5 h-9"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload Holiday Sheet</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </Button>
        </div>
      </div>

      {/* Info / Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Auto Banking Exclusions
            </CardTitle>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">All Sundays + 2nd & 4th Sat</div>
            <p className="text-xs text-muted-foreground mt-1">
              RBI standard norms automatically applied without any manual sheet.
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Registered Holidays ({selectedYear})
            </CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{totalYear} Days</div>
            <p className="text-xs text-muted-foreground mt-1">
              National & state bank holidays configured in portal.
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Holidays
            </CardTitle>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{upcoming} Upcoming</div>
            <p className="text-xs text-muted-foreground mt-1">
              Remaining bank holidays this calendar year.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border shadow-sm">
        <CardHeader className="py-3.5 px-4 bg-muted/20 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Bank Holidays List</CardTitle>
              <CardDescription className="text-xs">
                In tarikhon ko bank closed rehte hain, isliye collection deposit me inka din count nahi hota.
              </CardDescription>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search holiday..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-36 font-semibold">Date</TableHead>
                  <TableHead className="w-32 font-semibold">Day</TableHead>
                  <TableHead className="font-semibold">Holiday Name</TableHead>
                  <TableHead className="w-36 font-semibold">Category</TableHead>
                  <TableHead className="w-36 font-semibold">Scope</TableHead>
                  <TableHead className="w-20 font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      Loading holidays…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      No holidays found for this selection. Click "Add Holiday" or "Upload Holiday Sheet" to add one.
                    </TableCell>
                  </TableRow>
                )}
                {holidays.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-xs">
                      {formatDisplayDate(h.holiday_date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getDayName(h.holiday_date)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {h.holiday_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize bg-blue-50 text-blue-700 border-blue-200">
                        {h.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {h.state_name || 'All India (National)'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteHoliday(h.id, h.holiday_name)}
                        title="Delete holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal 1: Add Single Holiday */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Holiday</DialogTitle>
            <DialogDescription className="text-xs">
              Date aur holiday name daalein. Ye date working days count me automatically exclude ho jayegi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddHoliday} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Holiday Date *</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Holiday Name *</Label>
              <Input
                placeholder="e.g. Diwali, Holi, Local Election Day"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_holiday">Bank Holiday</SelectItem>
                  <SelectItem value="public_holiday">Public Holiday</SelectItem>
                  <SelectItem value="regional">Regional / State Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Upload Holiday Sheet */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Holiday Sheet (CSV / Excel)</DialogTitle>
            <DialogDescription className="text-xs">
              Poore quarter ya saal ki holiday sheet ek baar me upload karein (.csv, .xlsx format).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSheet} className="space-y-4 pt-2">
            <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1.5">
              <div className="font-semibold text-foreground">Expected Sheet Format:</div>
              <p className="text-muted-foreground">
                Column 1: <strong>Date</strong> (e.g. <code>26-01-2026</code> ya <code>2026-01-26</code>)<br />
                Column 2: <strong>Holiday Name</strong> (e.g. <code>Republic Day</code>)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Select File (.csv, .xlsx)</Label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-xs cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={uploading || !uploadFile}>
                {uploading ? 'Uploading…' : 'Upload & Process'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HolidayMaster;
