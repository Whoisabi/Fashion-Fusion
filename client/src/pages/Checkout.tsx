import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Building2, Wallet } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function Checkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "khalti" | "bank">("esewa");

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "Nepal",
      postalCode: "",
      phone: "",
    },
  });

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { address: AddressForm; paymentMethod: string }) =>
      apiRequest('POST', '/api/checkout', {
        address: data.address,
        paymentMethod: data.paymentMethod,
      }),
    onSuccess: (data: any) => {
      if (data.esewaData) {
        // Handle eSewa payment - create and submit form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.esewaData.action;
        
        Object.entries(data.esewaData.fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else if (data.paymentUrl) {
        // Handle Khalti or other payment gateways
        window.location.href = data.paymentUrl;
      } else if (data.orderId) {
        // Handle bank transfer
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully. Please proceed with the bank transfer.",
        });
        setLocation(`/payment-success?orderId=${data.orderId}&method=bank`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to checkout
            </p>
            <Link href="/login">
              <Button data-testid="button-login">Log In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = (cartData as any)?.items || [];
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.priceAtAdd) * item.quantity,
    0
  );
  const tax = subtotal * 0.13;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-4">
                Add items to your cart before checking out
              </p>
              <Link href="/shop">
                <Button data-testid="button-continue-shopping">Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const onSubmit = (data: AddressForm) => {
    createOrderMutation.mutate({
      address: data,
      paymentMethod,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-checkout-title">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>Enter your delivery address</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-full-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address-1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address-2" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-postal-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Choose your preferred payment method</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent" data-testid="payment-option-esewa">
                            <RadioGroupItem value="esewa" id="esewa" />
                            <Label htmlFor="esewa" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Wallet className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">eSewa</p>
                                <p className="text-sm text-muted-foreground">Pay with eSewa wallet (Sandbox)</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent mt-3" data-testid="payment-option-khalti">
                            <RadioGroupItem value="khalti" id="khalti" />
                            <Label htmlFor="khalti" className="flex items-center gap-2 cursor-pointer flex-1">
                              <CreditCard className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="font-medium">Khalti</p>
                                <p className="text-sm text-muted-foreground">Pay with Khalti wallet (Sandbox)</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent mt-3" data-testid="payment-option-bank">
                            <RadioGroupItem value="bank" id="bank" />
                            <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Building2 className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">Bank Transfer</p>
                                <p className="text-sm text-muted-foreground">Manual bank transfer</p>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createOrderMutation.isPending}
                      data-testid="button-place-order"
                    >
                      {createOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Place Order - NPR ${total.toFixed(2)}`
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.id}`}>
                      <span className="text-muted-foreground">
                        {item.product?.title} x {item.quantity}
                      </span>
                      <span>NPR {(parseFloat(item.priceAtAdd) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-subtotal">NPR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (13%)</span>
                    <span data-testid="text-tax">NPR {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span data-testid="text-total">NPR {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
