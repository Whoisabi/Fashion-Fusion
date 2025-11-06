import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  users, 
  categories, 
  products, 
  carts, 
  cartItems,
  addresses,
  orders,
  orderItems,
  wishlists,
  insertUserSchema,
  loginSchema,
  insertCategorySchema,
  insertProductSchema,
  insertCartItemSchema,
  insertAddressSchema,
  insertOrderSchema,
  insertWishlistSchema
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, authMiddleware, adminMiddleware, AuthRequest } from "./auth";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const passwordHash = await hashPassword(data.password);
      
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email)
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const [user] = await db.insert(users).values({
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'CUSTOMER'
      }).returning();

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email)
      });

      if (!user || !(await comparePassword(data.password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id)
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const allCategories = await db.query.categories.findMany({
        orderBy: [categories.name]
      });
      res.json(allCategories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/categories', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const [category] = await db.insert(categories).values(data).returning();
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const { categoryId, search } = req.query;
      
      let query = db.query.products.findMany({
        with: {
          category: true
        },
        orderBy: [desc(products.createdAt)]
      });

      const allProducts = await query;
      
      let filtered = allProducts;
      if (categoryId) {
        filtered = filtered.filter(p => p.categoryId === categoryId);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, req.params.id),
        with: {
          category: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/products', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const [product] = await db.insert(products).values(data).returning();
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const [product] = await db.update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, req.params.id))
        .returning();

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      await db.delete(products).where(eq(products.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/upload', authMiddleware, adminMiddleware, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'fashion-store' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      res.json({ url: (result as any).secure_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/cart', authMiddleware, async (req: AuthRequest, res) => {
    try {
      let cart = await db.query.carts.findFirst({
        where: eq(carts.userId, req.user!.id)
      });

      if (!cart) {
        [cart] = await db.insert(carts).values({
          userId: req.user!.id
        }).returning();
      }

      const items = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cart.id)
      });

      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId)
          });
          return { ...item, product };
        })
      );

      res.json({ cart, items: itemsWithProducts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cart/items', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertCartItemSchema.parse(req.body);
      
      let cart = await db.query.carts.findFirst({
        where: eq(carts.userId, req.user!.id)
      });

      if (!cart) {
        [cart] = await db.insert(carts).values({
          userId: req.user!.id
        }).returning();
      }

      const product = await db.query.products.findFirst({
        where: eq(products.id, data.productId)
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, data.productId),
          data.size ? eq(cartItems.size, data.size) : undefined
        )
      });

      if (existingItem) {
        const [updated] = await db.update(cartItems)
          .set({ quantity: existingItem.quantity + (data.quantity || 1) })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        return res.json(updated);
      }

      const [item] = await db.insert(cartItems).values({
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        size: data.size,
        priceAtAdd: product.price
      }).returning();

      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/cart/items/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { quantity } = req.body;
      
      if (quantity <= 0) {
        await db.delete(cartItems).where(eq(cartItems.id, req.params.id));
        return res.json({ success: true });
      }

      const [item] = await db.update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, req.params.id))
        .returning();

      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/cart/items/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      await db.delete(cartItems).where(eq(cartItems.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/wishlist', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userWishlist = await db.query.wishlists.findMany({
        where: eq(wishlists.userId, req.user!.id),
        with: {
          product: {
            with: {
              category: true
            }
          }
        }
      });
      res.json(userWishlist);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/wishlist', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertWishlistSchema.parse(req.body);
      
      const existing = await db.query.wishlists.findFirst({
        where: and(
          eq(wishlists.userId, req.user!.id),
          eq(wishlists.productId, data.productId)
        )
      });

      if (existing) {
        return res.status(400).json({ error: 'Product already in wishlist' });
      }

      const [wishlistItem] = await db.insert(wishlists).values({
        userId: req.user!.id,
        productId: data.productId
      }).returning();

      res.json(wishlistItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/wishlist/:productId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      await db.delete(wishlists).where(
        and(
          eq(wishlists.userId, req.user!.id),
          eq(wishlists.productId, req.params.productId)
        )
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/addresses', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userAddresses = await db.query.addresses.findMany({
        where: eq(addresses.userId, req.user!.id)
      });
      res.json(userAddresses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/addresses', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertAddressSchema.parse(req.body);
      const [address] = await db.insert(addresses).values({
        ...data,
        userId: req.user!.id
      }).returning();
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/orders', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertOrderSchema.parse(req.body);
      
      const productsData = await Promise.all(
        data.items.map(item => 
          db.query.products.findFirst({
            where: eq(products.id, item.productId)
          })
        )
      );

      const total = data.items.reduce((sum, item, idx) => {
        const product = productsData[idx];
        if (!product) throw new Error(`Product ${item.productId} not found`);
        return sum + (parseFloat(product.price) * item.quantity);
      }, 0);

      const [order] = await db.insert(orders).values({
        userId: req.user!.id,
        total: total.toString(),
        shippingAddressId: data.shippingAddressId,
        status: 'pending'
      }).returning();

      await Promise.all(
        data.items.map((item, idx) => {
          const product = productsData[idx]!;
          return db.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            price: product.price
          });
        })
      );

      const cart = await db.query.carts.findFirst({
        where: eq(carts.userId, req.user!.id)
      });

      if (cart) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/orders', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      
      const userOrders = await db.query.orders.findMany({
        where: isAdmin ? undefined : eq(orders.userId, req.user!.id),
        orderBy: [desc(orders.createdAt)]
      });

      const ordersWithDetails = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id)
          });
          
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await db.query.products.findFirst({
                where: eq(products.id, item.productId)
              });
              return { ...item, product };
            })
          );

          const user = await db.query.users.findFirst({
            where: eq(users.id, order.userId)
          });

          const address = order.shippingAddressId 
            ? await db.query.addresses.findFirst({
                where: eq(addresses.id, order.shippingAddressId)
              })
            : null;

          return { 
            ...order, 
            items: itemsWithProducts,
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
            shippingAddress: address
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      const [order] = await db.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, req.params.id))
        .returning();

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Payment and checkout routes
  app.post('/api/checkout', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { address: addressData, paymentMethod } = req.body;
      
      // Get user's cart
      const cart = await db.query.carts.findFirst({
        where: eq(carts.userId, req.user!.id)
      });

      if (!cart) {
        return res.status(400).json({ error: 'Cart not found' });
      }

      const userCartItems = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cart.id)
      });

      if (userCartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate total
      let subtotal = 0;
      for (const item of userCartItems) {
        subtotal += parseFloat(item.priceAtAdd.toString()) * item.quantity;
      }
      const tax = subtotal * 0.13; // 13% VAT for Nepal
      const total = subtotal + tax;

      // Create shipping address
      const [shippingAddress] = await db.insert(addresses).values({
        userId: req.user!.id,
        ...addressData
      }).returning();

      // Create order
      const [order] = await db.insert(orders).values({
        userId: req.user!.id,
        total: total.toFixed(2),
        status: 'pending',
        shippingAddressId: shippingAddress.id
      }).returning();

      // Create order items
      for (const item of userCartItems) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.priceAtAdd
        });
      }

      // Clear cart
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      // Handle payment methods
      if (paymentMethod === 'esewa') {
        // Generate eSewa payment form
        const crypto = await import('crypto');
        const transactionUuid = crypto.randomUUID();
        
        const esewaConfig = {
          amount: total.toFixed(2),
          tax_amount: tax.toFixed(2),
          total_amount: total.toFixed(2),
          transaction_uuid: transactionUuid,
          product_code: 'EPAYTEST',
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/payment/esewa/success?order_id=${order.id}`,
          failure_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/payment/esewa/failure?order_id=${order.id}`,
          signed_field_names: 'total_amount,transaction_uuid,product_code'
        };

        // Generate signature
        const secret = '8gBm/:&EnhH.1/q'; // Sandbox secret
        const message = `total_amount=${esewaConfig.total_amount},transaction_uuid=${esewaConfig.transaction_uuid},product_code=${esewaConfig.product_code}`;
        const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');

        // Update order with transaction UUID
        await db.update(orders)
          .set({ updatedAt: new Date() })
          .where(eq(orders.id, order.id));

        // Return payment data for frontend to handle
        return res.json({
          orderId: order.id,
          paymentGateway: 'esewa',
          esewaData: {
            action: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            fields: {
              amount: esewaConfig.amount,
              tax_amount: esewaConfig.tax_amount,
              total_amount: esewaConfig.total_amount,
              transaction_uuid: esewaConfig.transaction_uuid,
              product_code: esewaConfig.product_code,
              product_service_charge: esewaConfig.product_service_charge,
              product_delivery_charge: esewaConfig.product_delivery_charge,
              success_url: esewaConfig.success_url,
              failure_url: esewaConfig.failure_url,
              signed_field_names: esewaConfig.signed_field_names,
              signature: signature
            }
          }
        });

      } else if (paymentMethod === 'khalti') {
        // Khalti payment integration
        const khaltiConfig = {
          return_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/payment/khalti/callback`,
          website_url: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000',
          amount: Math.round(total * 100), // Amount in paisa
          purchase_order_id: order.id,
          purchase_order_name: `Order #${order.id.slice(0, 8)}`,
          customer_info: {
            name: addressData.fullName,
            email: req.user!.email,
            phone: addressData.phone
          }
        };

        // In production, you would call Khalti API here
        // For now, we'll return a mock response
        return res.json({
          paymentUrl: `https://test-pay.khalti.com/?pidx=mock_${order.id}`,
          orderId: order.id,
          message: 'Khalti integration would redirect here in production'
        });

      } else if (paymentMethod === 'bank') {
        // Bank transfer - order created, awaiting payment
        return res.json({
          orderId: order.id,
          message: 'Please complete the bank transfer to confirm your order'
        });
      }

      res.json({ orderId: order.id });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // eSewa payment success callback
  app.get('/api/payment/esewa/success', async (req, res) => {
    try {
      const { order_id, data } = req.query;
      
      if (order_id) {
        // Update order status to processing
        await db.update(orders)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(orders.id, order_id as string));

        // Redirect to success page
        return res.redirect(`/payment-success?orderId=${order_id}&method=esewa`);
      }
      
      res.redirect('/payment-failure');
    } catch (error: any) {
      console.error('eSewa callback error:', error);
      res.redirect('/payment-failure');
    }
  });

  // eSewa payment failure callback
  app.get('/api/payment/esewa/failure', async (req, res) => {
    const { order_id } = req.query;
    res.redirect(`/payment-failure?orderId=${order_id}`);
  });

  // Khalti payment callback
  app.get('/api/payment/khalti/callback', async (req, res) => {
    try {
      const { pidx, status, purchase_order_id } = req.query;
      
      if (status === 'Completed' && purchase_order_id) {
        // Update order status
        await db.update(orders)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(orders.id, purchase_order_id as string));

        return res.redirect(`/payment-success?orderId=${purchase_order_id}&method=khalti`);
      }
      
      res.redirect(`/payment-failure?orderId=${purchase_order_id}`);
    } catch (error: any) {
      console.error('Khalti callback error:', error);
      res.redirect('/payment-failure');
    }
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
