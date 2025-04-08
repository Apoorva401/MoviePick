import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import * as api from "@/lib/api";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Forgot password form schema
const forgotPasswordSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

// Reset password form schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function Profile() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user
  const { 
    data: currentUser, 
    isLoading: isLoadingUser,
    isError: isUserError,
  } = useQuery<{
    id: number;
    username: string;
    name: string | null;
    avatar: string | null;
  } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    gcTime: 0, // Don't cache errors
  });

  // Get user preferences
  const { 
    data: userPreferences, 
    isLoading: isLoadingPreferences 
  } = useQuery({
    queryKey: ["/api/user/preferences"],
    enabled: !!currentUser,
  });

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });
  
  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });
  
  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => api.login(values.username, values.password),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.name || data.username}!`,
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => api.register(
      values.username, 
      values.password, 
      values.name
    ),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: "Username may already be taken. Please try a different one.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    },
  });

  // Handle login form submission
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Handle register form submission
  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };
  
  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => api.forgotPassword(values.username, values.email),
    onSuccess: (data) => {
      if (data.resetToken) {
        setResetToken(data.resetToken);
        resetPasswordForm.setValue("token", data.resetToken);
        setActiveTab("reset-password");
        toast({
          title: "Password Reset Initiated",
          description: "A password reset token has been generated. Please enter your new password.",
        });
      } else {
        toast({
          title: "Password Reset Initiated",
          description: "If an account with that username exists, a password reset link has been sent.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Password Reset Failed",
        description: "An error occurred while trying to reset your password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => api.resetPassword(values.token, values.newPassword),
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been successfully reset. You can now login with your new password.",
      });
      setActiveTab("login");
    },
    onError: (error) => {
      toast({
        title: "Password Reset Failed",
        description: "Invalid or expired reset token. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle forgot password form submission
  const onForgotPasswordSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values);
  };
  
  // Handle reset password form submission
  const onResetPasswordSubmit = (values: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(values);
  };

  // Redirect if user already logged in
  useEffect(() => {
    if (currentUser && !isLoadingUser && !isUserError) {
      // User is logged in, stay on profile page
    }
  }, [currentUser, isLoadingUser, isUserError, navigate]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center items-center" style={{ minHeight: "70vh" }}>
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {currentUser ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal information and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {currentUser.name?.[0] || currentUser.username?.[0] || "U"}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{currentUser.name || currentUser.username}</h2>
                      <p className="text-muted-foreground">@{currentUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-medium mb-2">Account Details</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">Username:</span> {currentUser.username}
                    </p>
                    {currentUser.name && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">Name:</span> {currentUser.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Logging Out...
                    </>
                  ) : (
                    "Sign Out"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to MoviePick</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one to get films handpicked just for you, rate movies, and build your watchlist.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                    <TabsTrigger value="forgot-password">Reset</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Logging In...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setActiveTab("register")}
                        >
                          Register
                        </button>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Forgot your password?{" "}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setActiveTab("forgot-password")}
                        >
                          Reset Password
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Create a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setActiveTab("login")}
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="forgot-password">
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={forgotPasswordForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Required for password reset link)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={forgotPasswordMutation.isPending}
                        >
                          {forgotPasswordMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Processing...
                            </>
                          ) : (
                            "Send Reset Instructions"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setActiveTab("login")}
                        >
                          Back to Login
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reset-password">
                    <Form {...resetPasswordForm}>
                      <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={resetPasswordForm.control}
                          name="token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reset Token</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your reset token" 
                                  {...field} 
                                  disabled={!!resetToken}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={resetPasswordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={resetPasswordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Resetting Password...
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setActiveTab("login")}
                        >
                          Back to Login
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
