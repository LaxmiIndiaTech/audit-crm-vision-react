import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield } from 'lucide-react';

interface EmployeeStatsCardsProps {
  totalCount: number;
  adminCount: number;
  activeCount: number;
  isLoading?: boolean;
}

export const EmployeeStatsCards: React.FC<EmployeeStatsCardsProps> = ({
  totalCount,
  adminCount,
  activeCount,
  isLoading = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">
                {isLoading ? '-' : totalCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">
                {isLoading ? '-' : adminCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">
                {isLoading ? '-' : activeCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};