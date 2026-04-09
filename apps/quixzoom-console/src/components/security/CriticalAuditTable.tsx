import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditLog {
  id: string; action: string; category: string; subject: string; ip: string; createdAt: string; severity: string;
}

export const CriticalAuditTable = React.memo(function CriticalAuditTable({ logs }: { logs: AuditLog[] }) {
  return (
    <Card className="glass-card glow-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Critical Audit Events</CardTitle>
      </CardHeader>
      <CardContent className="p-0 max-h-[380px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Subject</TableHead>
              <TableHead className="hidden sm:table-cell">IP</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id} className="bg-destructive/5 transition-all duration-200 hover:bg-destructive/10">
                <TableCell className="font-mono text-sm font-medium">{log.action}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive">{log.category}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs font-mono">{log.subject.substring(0, 12)}</TableCell>
                <TableCell className="hidden sm:table-cell text-xs font-mono text-muted-foreground">{log.ip}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
