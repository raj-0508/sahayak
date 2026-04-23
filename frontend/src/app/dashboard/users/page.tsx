import { UserManagement } from "@/components/dashboard/user-management";

export default function UsersPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <p className="text-muted-foreground">Manage all users in the system.</p>
      </div>
      <UserManagement />
    </div>
  );
}
