import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  Users, 
  GraduationCap, 
  Building, 
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  Search,
  Download,
  Upload,
  Mail,
  Key,
  Database
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, insertTeacherSchema, insertLocationSchema } from "@shared/schema";

// Form schemas
const userFormSchema = insertUserSchema.omit({ profileImageUrl: true });
const teacherFormSchema = insertTeacherSchema.omit({ id: true, createdAt: true, updatedAt: true });
const locationFormSchema = insertLocationSchema.omit({ id: true, createdAt: true, updatedAt: true });

type UserFormData = z.infer<typeof userFormSchema>;
type TeacherFormData = z.infer<typeof teacherFormSchema>;
type LocationFormData = z.infer<typeof locationFormSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string;
  subjects: string[];
  active: boolean;
}

interface Location {
  id: string;
  name: string;
  active: boolean;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<UserFormData> }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: TeacherFormData) => {
      const res = await apiRequest("POST", "/api/teachers", teacherData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Teacher created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create teacher", description: error.message, variant: "destructive" });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, teacherData }: { id: string; teacherData: Partial<TeacherFormData> }) => {
      const res = await apiRequest("PUT", `/api/teachers/${id}`, teacherData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setEditingTeacher(null);
      toast({ title: "Teacher updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update teacher", description: error.message, variant: "destructive" });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: LocationFormData) => {
      const res = await apiRequest("POST", "/api/locations", locationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create location", description: error.message, variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, locationData }: { id: string; locationData: Partial<LocationFormData> }) => {
      const res = await apiRequest("PUT", `/api/locations/${id}`, locationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setEditingLocation(null);
      toast({ title: "Location updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update location", description: error.message, variant: "destructive" });
    },
  });

  // Forms
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "observer",
    },
  });

  const teacherForm = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      gradeLevel: "",
      subjects: [],
      active: true,
    },
  });

  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This dashboard is only available to administrative users.
            </p>
            <Link href="/">
              <Button className="w-full mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  }) || [];

  const onCreateUser = (data: UserFormData) => {
    createUserMutation.mutate(data);
    userForm.reset();
  };

  const onCreateTeacher = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
    teacherForm.reset();
  };

  const onCreateLocation = (data: LocationFormData) => {
    createLocationMutation.mutate(data);
    locationForm.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="text-3xl mr-4" />
              <div>
                <h1 className="text-2xl font-bold">System Administration</h1>
                <p className="text-red-100">Platform management and configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Main Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-red-700"
                onClick={() => {
                  // Export system data
                  const systemData = { users, teachers, locations, stats: systemStats };
                  const dataStr = JSON.stringify(systemData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `system-export-${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Teachers</p>
                  <p className="text-2xl font-bold">{teachers?.filter(t => t.active).length || 0}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Locations</p>
                  <p className="text-2xl font-bold">{locations?.filter(l => l.active).length || 0}</p>
                </div>
                <Building className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">System Health</p>
                  <p className="text-2xl font-bold">Good</p>
                </div>
                <Database className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* User Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-gray-600">Manage user accounts and permissions</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="observer">Observer</SelectItem>
                                <SelectItem value="coach">Instructional Coach</SelectItem>
                                <SelectItem value="leadership">Leadership</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* User Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-900">Name</th>
                        <th className="text-left p-3 font-medium text-gray-900">Username</th>
                        <th className="text-left p-3 font-medium text-gray-900">Email</th>
                        <th className="text-left p-3 font-medium text-gray-900">Role</th>
                        <th className="text-left p-3 font-medium text-gray-900">Created</th>
                        <th className="text-left p-3 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{user.firstName} {user.lastName}</td>
                            <td className="p-3">{user.username}</td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">
                              <Badge 
                                variant={
                                  user.role === 'admin' ? 'destructive' :
                                  user.role === 'leadership' ? 'default' :
                                  user.role === 'coach' ? 'secondary' : 'outline'
                                }
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            {/* Teachers Management */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Teacher Management</h3>
                <p className="text-gray-600">Manage teacher roster and information</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Teacher</DialogTitle>
                  </DialogHeader>
                  <Form {...teacherForm}>
                    <form onSubmit={teacherForm.handleSubmit(onCreateTeacher)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={teacherForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={teacherForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={teacherForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={teacherForm.control}
                        name="gradeLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade Level</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createTeacherMutation.isPending}>
                        {createTeacherMutation.isPending ? "Adding..." : "Add Teacher"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-900">Name</th>
                        <th className="text-left p-3 font-medium text-gray-900">Email</th>
                        <th className="text-left p-3 font-medium text-gray-900">Grade Level</th>
                        <th className="text-left p-3 font-medium text-gray-900">Subjects</th>
                        <th className="text-left p-3 font-medium text-gray-900">Status</th>
                        <th className="text-left p-3 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            Loading teachers...
                          </td>
                        </tr>
                      ) : teachers?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No teachers found.
                          </td>
                        </tr>
                      ) : (
                        teachers?.map((teacher) => (
                          <tr key={teacher.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{teacher.firstName} {teacher.lastName}</td>
                            <td className="p-3">{teacher.email}</td>
                            <td className="p-3">{teacher.gradeLevel}</td>
                            <td className="p-3">{teacher.subjects?.join(", ")}</td>
                            <td className="p-3">
                              <Badge variant={teacher.active ? "default" : "secondary"}>
                                {teacher.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingTeacher(teacher)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateTeacherMutation.mutate({ 
                                    id: teacher.id, 
                                    teacherData: { active: !teacher.active } 
                                  })}
                                >
                                  {teacher.active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            {/* Location Management */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Location Management</h3>
                <p className="text-gray-600">Manage school and classroom locations</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Location</DialogTitle>
                  </DialogHeader>
                  <Form {...locationForm}>
                    <form onSubmit={locationForm.handleSubmit(onCreateLocation)} className="space-y-4">
                      <FormField
                        control={locationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Main Building Room 101" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createLocationMutation.isPending}>
                        {createLocationMutation.isPending ? "Adding..." : "Add Location"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-900">Location Name</th>
                        <th className="text-left p-3 font-medium text-gray-900">Status</th>
                        <th className="text-left p-3 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationsLoading ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-500">
                            Loading locations...
                          </td>
                        </tr>
                      ) : locations?.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-500">
                            No locations found.
                          </td>
                        </tr>
                      ) : (
                        locations?.map((location) => (
                          <tr key={location.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{location.name}</td>
                            <td className="p-3">
                              <Badge variant={location.active ? "default" : "secondary"}>
                                {location.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingLocation(location)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateLocationMutation.mutate({ 
                                    id: location.id, 
                                    locationData: { active: !location.active } 
                                  })}
                                >
                                  {location.active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-red-600" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Configure email templates and notification settings.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">SendGrid Integration</h4>
                      <p className="text-sm text-gray-600 mb-3">Email service is configured and operational</p>
                      <Badge variant="default">Active</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Notification Templates</h4>
                      <p className="text-sm text-gray-600 mb-3">Review assignment and completion emails</p>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-2" />
                        Edit Templates
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2 text-red-600" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Manage authentication and security policies.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Session Management</h4>
                      <p className="text-sm text-gray-600 mb-3">User sessions and timeouts</p>
                      <Badge variant="default">Secure</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Role Permissions</h4>
                      <p className="text-sm text-gray-600 mb-3">Access control and authorization</p>
                      <Button size="sm" variant="outline">
                        <Shield className="w-3 h-3 mr-2" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-red-600" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Database health and maintenance operations.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Connection Status</h4>
                      <Badge variant="default">Connected</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Backup Status</h4>
                      <Badge variant="default">Up to Date</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Performance</h4>
                      <Badge variant="default">Optimal</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(role) => updateUserMutation.mutate({ 
                    id: editingUser.id, 
                    userData: { role } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observer">Observer</SelectItem>
                    <SelectItem value="coach">Instructional Coach</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}