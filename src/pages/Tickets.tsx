import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { Ticket } from '@/types/crm';

const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'Login Issues',
    description: 'User unable to login to the system',
    status: 'open',
    priority: 'high',
    customerId: '1',
    customerName: 'Acme Corporation',
    assignedTo: 'John Doe',
    createdAt: '2024-07-19T10:30:00Z',
    updatedAt: '2024-07-19T10:30:00Z',
    category: 'Technical'
  },
  {
    id: 'TKT-002',
    title: 'Feature Request',
    description: 'Request for new reporting functionality',
    status: 'in-progress',
    priority: 'medium',
    customerId: '2',
    customerName: 'Global Solutions Inc',
    assignedTo: 'Jane Smith',
    createdAt: '2024-07-18T14:20:00Z',
    updatedAt: '2024-07-19T09:15:00Z',
    category: 'Feature'
  },
  {
    id: 'TKT-003',
    title: 'Data Migration',
    description: 'Completed data migration for Q3 audit',
    status: 'closed',
    priority: 'low',
    customerId: '3',
    customerName: 'Tech Innovations Ltd',
    assignedTo: 'Mike Johnson',
    createdAt: '2024-07-15T08:00:00Z',
    updatedAt: '2024-07-17T16:45:00Z',
    category: 'Technical'
  },
  {
    id: 'TKT-004',
    title: 'Performance Issues',
    description: 'System running slowly during peak hours',
    status: 'open',
    priority: 'high',
    customerId: '1',
    customerName: 'Acme Corporation',
    assignedTo: 'Sarah Wilson',
    createdAt: '2024-07-19T11:00:00Z',
    updatedAt: '2024-07-19T11:00:00Z',
    category: 'Technical'
  }
];

const Tickets = () => {
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getFilteredTickets = (status?: string) => {
    let filtered = tickets;
    
    if (status && status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TicketTable = ({ tickets }: { tickets: Ticket[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <div>
                <p className="font-medium">{ticket.title}</p>
                <p className="text-sm text-muted-foreground">{ticket.id}</p>
              </div>
            </TableCell>
            <TableCell>{ticket.customerName}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {ticket.assignedTo}
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {getStatusIcon(ticket.status)}
                <Badge className={`ml-2 ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('-', ' ')}
                </Badge>
              </div>
            </TableCell>
            <TableCell>{formatDate(ticket.createdAt)}</TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedTicket?.title}</DialogTitle>
                  </DialogHeader>
                  {selectedTicket && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Ticket ID</Label>
                          <p className="text-sm text-muted-foreground">{selectedTicket.id}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Customer</Label>
                          <p className="text-sm text-muted-foreground">{selectedTicket.customerName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Priority</Label>
                          <Badge className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge className={getStatusColor(selectedTicket.status)}>
                            {selectedTicket.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedTicket.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Created</Label>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedTicket.createdAt)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Last Updated</Label>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedTicket.updatedAt)}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium">Add Comment</Label>
                        <Textarea placeholder="Add a comment..." className="mt-2" />
                        <div className="flex justify-between mt-3">
                          <Select>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button>Update Ticket</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter ticket title" />
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Acme Corporation</SelectItem>
                    <SelectItem value="2">Global Solutions Inc</SelectItem>
                    <SelectItem value="3">Tech Innovations Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the issue..." />
              </div>
              <Button className="w-full">Create Ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'in-progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">#</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tickets Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
              <TabsTrigger value="open">Open ({tickets.filter(t => t.status === 'open').length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({tickets.filter(t => t.status === 'in-progress').length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({tickets.filter(t => t.status === 'closed').length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <TicketTable tickets={getFilteredTickets()} />
            </TabsContent>
            <TabsContent value="open">
              <TicketTable tickets={getFilteredTickets('open')} />
            </TabsContent>
            <TabsContent value="in-progress">
              <TicketTable tickets={getFilteredTickets('in-progress')} />
            </TabsContent>
            <TabsContent value="closed">
              <TicketTable tickets={getFilteredTickets('closed')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets;