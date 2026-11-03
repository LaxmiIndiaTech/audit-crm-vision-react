import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Calendar,
  User,
  FileSearch
} from 'lucide-react';
import { AuditLog } from '@/types/crm';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Mock audit logs data
  const auditLogs: AuditLog[] = [
    {
      id: '1',
      userId: 'user_123',
      userName: 'John Admin',
      userRole: 'admin',
      action: 'Updated user role',
      module: 'User Management',
      resourceId: 'user_456',
      timestamp: '2024-01-20T14:30:00Z',
      changes: {
        before: { role: 'employee' },
        after: { role: 'admin' }
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        before: { role: 'employee' },
        after: { role: 'admin' },
        metadata: { updatedBy: 'admin' }
      }
    },
    {
      id: '2',
      userId: 'user_789',
      userName: 'Sarah Employee',
      userRole: 'employee',
      action: 'Exported customer data',
      module: 'Customer Management',
      resourceId: 'customer_321',
      timestamp: '2024-01-20T13:45:00Z',
      changes: {
        before: {},
        after: { exported: true, format: 'CSV' }
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      details: {
        after: { exported: true, format: 'CSV' },
        metadata: { recordCount: 150 }
      }
    },
    {
      id: '3',
      userId: 'user_456',
      userName: 'Mike Support',
      userRole: 'employee',
      action: 'Closed ticket',
      module: 'Ticket System',
      resourceId: 'ticket_789',
      timestamp: '2024-01-20T12:15:00Z',
      changes: {
        before: { status: 'in-progress' },
        after: { status: 'closed', resolution: 'Resolved via phone call' }
      },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        before: { status: 'in-progress' },
        after: { status: 'closed', resolution: 'Resolved via phone call' },
        metadata: { timeSpent: '2h 30m' }
      }
    },
    {
      id: '4',
      userId: 'user_321',
      userName: 'Lisa Manager',
      userRole: 'admin',
      action: 'Created new customer',
      module: 'Customer Management',
      resourceId: 'customer_654',
      timestamp: '2024-01-20T11:30:00Z',
      changes: {
        before: {},
        after: { 
          name: 'Acme Corp',
          email: 'contact@acme.com',
          status: 'active'
        }
      },
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        after: { 
          name: 'Acme Corp',
          email: 'contact@acme.com',
          status: 'active'
        },
        metadata: { source: 'manual_entry' }
      }
  }
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('Failed') || action.includes('Error')) {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Risk</Badge>;
    }
    if (action.includes('Exported') || action.includes('Downloaded')) {
      return <Badge className="bg-warning/20 text-warning-foreground border-warning/30">Sensitive</Badge>;
    }
    if (action.includes('Created') || action.includes('Updated')) {
      return <Badge className="bg-primary/20 text-primary border-primary/30">Change</Badge>;
    }
    return <Badge variant="outline">Info</Badge>;
  };

  const filteredLogs = auditLogs.filter(log =>
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const current = Math.min(page, totalPages);
  const paginated = filteredLogs.slice((current - 1) * pageSize, current * pageSize);
  React.useEffect(() => { setPage(1); }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor and track all system activities and changes
          </p>
        </div>
        <Button className="crm-button-primary">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="crm-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by user, action, or module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 crm-input"
                />
              </div>
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              User Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="crm-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSearch className="w-5 h-5" />
            <span>System Activity</span>
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {auditLogs.length} audit entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="crm-table rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.userId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.module}</Badge>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                            <DialogDescription>
                              Detailed information about this audit entry
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">User</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedLog.userName} ({selectedLog.userId})
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Timestamp</label>
                                  <p className="text-sm text-muted-foreground">
                                    {formatTimestamp(selectedLog.timestamp)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Action</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedLog.action}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Module</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedLog.module}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Resource ID</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {selectedLog.resourceId}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">IP Address</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {selectedLog.ipAddress}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedLog.changes && (
                                <div>
                                  <label className="text-sm font-medium">Changes</label>
                                  <div className="mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">
                                        BEFORE
                                      </p>
                                      <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto">
                                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">
                                        AFTER
                                      </p>
                                      <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto">
                                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <Pagination className="pt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (current > 1) setPage(current - 1); }} className={current === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={p === current} onClick={(e) => { e.preventDefault(); setPage(p); }}>{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (current < totalPages) setPage(current + 1); }} className={current === totalPages ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;