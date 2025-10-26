import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTimeEntrySchema, insertTaskTemplateSchema } from "@shared/schema";
import { setupAuth } from "./replitAuth";
import Stripe from "stripe";
import { 
  insertTodoSchema, insertNoteSchema, insertVoiceRecordingSchema,
  insertFlashcardDeckSchema, insertFlashcardSchema, insertHabitSchema, insertHabitLogSchema,
  insertFeedbackSchema
} from "@shared/schema";
import { initializeAchievements } from "./init-achievements";
import { EmailService } from "./email-service";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Temporary mock auth for demo - replace with proper auth later
  app.use('/api', (req, res, next) => {
    // Mock user session for demo with admin role
    req.user = { 
      claims: { sub: '927070657' }, // Admin user for development
      isAuthenticated: () => true 
    };
    next();
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // For development without database, return mock user
      const mockUser = {
        id: userId,
        email: 'admin@mobiletoolsbox.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin', // Always admin in dev mode
        subscriptionStatus: 'free',
        subscriptionTier: 'free',
      };
      
      try {
        const user = await storage.getUser(userId);
        res.json(user || mockUser);
      } catch (dbError) {
        // Database not available, use mock user
        res.json(mockUser);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Simple user switching for demo
  app.post('/api/switch-user', async (req: any, res) => {
    const { userId } = req.body;
    if (['927070657', '927070658', '927070659'].includes(userId)) {
      req.session.mockUserId = userId;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid user ID' });
    }
  });

  // Stripe subscription routes
  app.post("/api/create-subscription", async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          const latestInvoice = subscription.latest_invoice as any;
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: latestInvoice?.payment_intent?.client_secret,
            status: subscription.status
          });
        }
      }

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `user_${userId}@mobiletoolsbox.com`,
          metadata: { userId }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, customerId, '');
      }

      // Create or get the product and price
      let priceId = process.env.STRIPE_PRICE_ID;
      
      if (!priceId) {
        // Create product if not exists
        const products = await stripe.products.list({ limit: 1 });
        let product = products.data.find(p => p.name === 'MobileToolsBox Pro');
        
        if (!product) {
          product = await stripe.products.create({
            name: 'MobileToolsBox Pro',
            description: 'Access to all premium productivity tools'
          });
        }

        // Create price if not exists
        const prices = await stripe.prices.list({ 
          product: product.id,
          active: true,
          limit: 1
        });
        
        let price = prices.data.find(p => p.unit_amount === 499 && p.recurring?.interval === 'month');
        
        if (!price) {
          price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: 499,
            recurring: { interval: 'month' },
            product: product.id
          });
        }
        
        priceId = price.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      // Get the client secret from the payment intent
      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // One-time tool purchases
  app.post("/api/purchase-tool", async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const { toolId, toolName, amount } = req.body;
      const userId = req.user.claims.sub;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          toolId,
          toolName,
          type: 'one-time-purchase'
        },
        description: `One-time purchase: ${toolName}`
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({ 
        message: "Subscription will be cancelled at the end of the billing period",
        subscription: {
          id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: (subscription as any).current_period_end
        }
      });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ message: "Error cancelling subscription: " + error.message });
    }
  });

  // Resume subscription
  app.post("/api/resume-subscription", async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      res.json({ 
        message: "Subscription resumed successfully",
        subscription: {
          id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          status: subscription.status
        }
      });
    } catch (error: any) {
      console.error('Subscription resume error:', error);
      res.status(500).json({ message: "Error resuming subscription: " + error.message });
    }
  });

  // Get subscription status
  app.get("/api/subscription-status", async (req: any, res) => {
    if (!stripe) {
      return res.json({ 
        status: 'none', 
        subscription: null,
        isPro: false 
      });
    }
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ 
          status: 'none', 
          subscription: null,
          isPro: false 
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Update user subscription status in database
      const isActive = subscription.status === 'active';
      await storage.updateUserSubscriptionStatus(userId, isActive ? 'pro' : 'free');
      
      res.json({
        status: subscription.status,
        isPro: isActive,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: (subscription as any).current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: (subscription as any).canceled_at
        }
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: "Error fetching subscription status: " + error.message });
    }
  });

  // Stripe webhook for handling payment events
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Only verify webhook signature if webhook secret is available
      if (process.env.STRIPE_WEBHOOK_SECRET && sig && stripe) {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        // For development/testing, parse the body directly
        event = req.body;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const type = paymentIntent.metadata.type;
        const tier = paymentIntent.metadata.tier;

        if (type === 'donation') {
          // Handle successful donation - DO NOT upgrade user status (everything is free)
          console.log(`Donation successful! User: ${userId}, Tier: ${tier}, Amount: ${paymentIntent.amount}`);
          
          // Track the successful donation in revenue
          if (userId && userId !== 'anonymous') {
            try {
              await storage.createRevenueEvent({
                userId,
                eventType: "donation",
                amount: paymentIntent.amount,
                metadata: { 
                  tier,
                  paymentIntentId: paymentIntent.id,
                  status: 'completed'
                }
              });
              console.log(`Donation tracked for user ${userId}`);
            } catch (error) {
              console.error('Error tracking donation:', error);
            }
          }
        } else if (type === 'one-time-purchase') {
          // Handle successful one-time purchase (legacy)
          console.log('One-time purchase successful:', paymentIntent.metadata);
        } else if (type === 'lifetime_purchase') {
          // Handle successful lifetime purchase (legacy - treat as donation now)
          console.log('Legacy lifetime purchase successful - treating as donation');
        }
        break;
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        // Handle successful subscription payment
        console.log('Subscription payment successful:', invoice.subscription);
        break;
      
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        // Handle subscription cancellation
        console.log('Subscription cancelled:', subscription.id);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Revenue tracking endpoint
  app.post("/api/track-revenue", async (req, res) => {
    try {
      const { eventType, amount, metadata, userId } = req.body;
      
      const revenueEvent = await storage.createRevenueEvent({
        userId: userId || ((req as any).user?.claims?.sub),
        eventType,
        amount: amount || 0,
        metadata
      });

      res.json(revenueEvent);
    } catch (error: any) {
      console.error("Revenue tracking error:", error);
      res.status(500).json({ message: "Error tracking revenue: " + error.message });
    }
  });

  // Support developer endpoint (legacy)
  app.post("/api/support-developer", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const { type, amount, message } = req.body;
      const userId = ((req as any).user?.claims?.sub);

      // Create Stripe payment intent for support
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          type: "support",
          supportType: type,
          userId: userId || "anonymous"
        }
      });

      // Track the support intention
      await storage.createSupportTransaction({
        userId,
        supportType: type,
        amount,
        message: message || `Thank you for supporting MobileToolsBox development!`
      });

      // Track revenue event
      await storage.createRevenueEvent({
        userId,
        eventType: "donation",
        amount,
        metadata: { supportType: type }
      });

      console.log("Created payment intent:", paymentIntent.id, "with client_secret:", paymentIntent.client_secret);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Support processing error:", error);
      res.status(500).json({ message: "Error processing support: " + error.message });
    }
  });

  // Donation endpoint - Buy me a coffee style
  app.post("/api/donate", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const { amount, tier, message } = req.body;
      const userId = ((req as any).user?.claims?.sub);

      // Validate amount (min $1, max $100)
      if (!amount || amount < 100 || amount > 10000) {
        return res.status(400).json({ 
          message: "Invalid donation amount. Must be between $1 and $100." 
        });
      }

      // Validate tier
      const validTiers = ['coffee', 'lunch', 'generous', 'custom'];
      if (!tier || !validTiers.includes(tier)) {
        return res.status(400).json({ 
          message: "Invalid donation tier." 
        });
      }

      // Create Stripe payment intent for donation
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          type: "donation",
          tier,
          userId: userId || "anonymous"
        }
      });

      // Track the donation intention
      await storage.createSupportTransaction({
        userId,
        supportType: tier,
        amount,
        message: message || `${tier} donation - Thank you for supporting MobileToolsBox!`
      });

      // Track revenue event
      await storage.createRevenueEvent({
        userId,
        eventType: "donation",
        amount,
        metadata: { tier }
      });

      console.log("Created payment intent for donation:", paymentIntent.id, "tier:", tier, "amount:", amount);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Donation processing error:", error);
      res.status(500).json({ message: "Error processing donation: " + error.message });
    }
  });

  // Keep legacy endpoint for backward compatibility
  app.post("/api/purchase-lifetime", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not available" });
    }
    try {
      const { amount, message } = req.body;
      const userId = ((req as any).user?.claims?.sub);

      // Create Stripe payment intent for lifetime purchase
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          type: "donation",
          tier: "legacy-lifetime",
          userId: userId || "anonymous"
        }
      });

      // Track the purchase intention
      await storage.createSupportTransaction({
        userId,
        supportType: "legacy-lifetime",
        amount,
        message: message || `Legacy lifetime donation`
      });

      // Track revenue event
      await storage.createRevenueEvent({
        userId,
        eventType: "donation",
        amount,
        metadata: { tier: "legacy-lifetime" }
      });

      console.log("Created payment intent for legacy lifetime:", paymentIntent.id, "with client_secret:", paymentIntent.client_secret);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Legacy lifetime processing error:", error);
      res.status(500).json({ message: "Error processing donation: " + error.message });
    }
  });

  // Admin-only middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superuser')) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Test statistics endpoint - Admin only
  app.get("/api/test-statistics", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getRevenueStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Statistics error:", error);
      res.status(500).json({ message: "Error fetching statistics: " + error.message });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Error fetching achievements: " + error.message });
    }
  });

  app.get("/api/user-achievements", async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub);
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error: any) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Error fetching user achievements: " + error.message });
    }
  });

  app.get("/api/user-stats", async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub);
      const userStats = await storage.getUserStats(userId);
      res.json(userStats);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Error fetching user stats: " + error.message });
    }
  });

  app.post("/api/track-activity", async (req, res) => {
    try {
      const { activity, amount } = req.body;
      const userId = ((req as any).user?.claims?.sub);
      
      const updatedStats = await storage.incrementUserActivity(userId, activity, amount);
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      
      res.json({ 
        stats: updatedStats, 
        newAchievements: newAchievements.length > 0 ? newAchievements : null 
      });
    } catch (error: any) {
      console.error("Error tracking activity:", error);
      res.status(500).json({ message: "Error tracking activity: " + error.message });
    }
  });

  // Initialize achievements route
  app.post("/api/init-achievements", async (req, res) => {
    try {
      await initializeAchievements();
      res.json({ success: true, message: "Achievements initialized successfully" });
    } catch (error: any) {
      console.error("Error initializing achievements:", error);
      res.status(500).json({ message: "Error initializing achievements: " + error.message });
    }
  });

  // Update user test status - Admin only
  app.post("/api/update-user-test-status", requireAdmin, async (req, res) => {
    try {
      const { userId, testGroup, subscriptionTier } = req.body;
      
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (testGroup) {
        user = await storage.updateUserTestGroup(userId, testGroup);
      }
      
      if (subscriptionTier) {
        user = await storage.updateUserSubscriptionTier(userId, subscriptionTier);
      }

      res.json(user);
    } catch (error: any) {
      console.error("User update error:", error);
      res.status(500).json({ message: "Error updating user: " + error.message });
    }
  });

  // Create test user
  app.post("/api/create-test-user", async (req, res) => {
    try {
      const { email, testGroup, subscriptionTier } = req.body;
      
      const user = await storage.upsertUser({
        id: `test_${Date.now()}`,
        email,
        testGroup,
        subscriptionTier,
        subscriptionStatus: subscriptionTier
      });

      res.json(user);
    } catch (error: any) {
      console.error("Test user creation error:", error);
      res.status(500).json({ message: "Error creating test user: " + error.message });
    }
  });

  // User routes
  app.get('/api/user', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });

  // Todo routes
  app.get('/api/todos', async (req: any, res) => {
    const todos = await storage.getTodosByUserId(req.user.claims.sub);
    res.json(todos);
  });

  app.post('/api/todos', async (req: any, res) => {
    try {
      const todoData = insertTodoSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const todo = await storage.createTodo(todoData);
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/todos/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const todo = await storage.updateTodo(id, req.body);
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/todos/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTodo(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notes routes
  app.get('/api/notes', async (req: any, res) => {
    const notes = await storage.getNotesByUserId(req.user.claims.sub);
    res.json(notes);
  });

  app.post('/api/notes', async (req: any, res) => {
    try {
      const noteData = insertNoteSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/notes/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.updateNote(id, req.body);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/notes/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNote(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Voice recordings routes
  app.get('/api/voice-recordings', async (req: any, res) => {
    const recordings = await storage.getVoiceRecordingsByUserId(req.user.claims.sub);
    res.json(recordings);
  });

  app.post('/api/voice-recordings', async (req: any, res) => {
    try {
      const recordingData = insertVoiceRecordingSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const recording = await storage.createVoiceRecording(recordingData);
      res.json(recording);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/voice-recordings/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const recording = await storage.updateVoiceRecording(id, updateData);
      res.json(recording);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/voice-recordings/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVoiceRecording(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Flashcard decks routes
  app.get('/api/flashcard-decks', async (req: any, res) => {
    const decks = await storage.getFlashcardDecksByUserId(req.user.claims.sub);
    res.json(decks);
  });

  app.post('/api/flashcard-decks', async (req: any, res) => {
    try {
      const deckData = insertFlashcardDeckSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const deck = await storage.createFlashcardDeck(deckData);
      res.json(deck);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/flashcard-decks/:id', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFlashcardDeck(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Flashcards routes
  app.get('/api/flashcards/:deckId', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const deckId = parseInt(req.params.deckId);
    const flashcards = await storage.getFlashcardsByDeckId(deckId);
    res.json(flashcards);
  });

  app.post('/api/flashcards', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const flashcardData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(flashcardData);
      res.json(flashcard);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/flashcards/:id', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const flashcard = await storage.updateFlashcard(id, req.body);
      res.json(flashcard);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/flashcards/:id', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFlashcard(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Habits routes
  app.get('/api/habits', async (req: any, res) => {
    const habits = await storage.getHabitsByUserId(req.user.claims.sub);
    res.json(habits);
  });

  app.post('/api/habits', async (req: any, res) => {
    try {
      const habitData = insertHabitSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/habits/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const habit = await storage.updateHabit(id, req.body);
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/habits/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHabit(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Habit logs routes
  app.get('/api/habit-logs/:habitId', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habitId = parseInt(req.params.habitId);
    const logs = await storage.getHabitLogsByHabitId(habitId);
    res.json(logs);
  });

  app.post('/api/habit-logs', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const logData = insertHabitLogSchema.parse(req.body);
      const log = await storage.createHabitLog(logData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/habit-logs/:id', async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHabitLog(id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Feedback routes
  app.get('/api/feedback', async (req: any, res) => {
    const feedback = await storage.getFeedbackByUserId(req.user.claims.sub);
    res.json(feedback);
  });

  app.post('/api/feedback', async (req: any, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, userId: req.user.claims.sub });
      const feedback = await storage.createFeedback(feedbackData);
      
      // Send email notifications asynchronously
      setImmediate(async () => {
        try {
          // Send confirmation email to user if email provided
          if (feedback.email) {
            await EmailService.sendFeedbackConfirmation(
              feedback.email, 
              feedback.type, 
              feedback.title
            );
          }
          
          // Send notification to admin
          await EmailService.sendAdminNotification(feedback);
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
        }
      });
      
      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin feedback management routes
  app.get('/api/admin/feedback', async (req: any, res) => {
    try {
      // Only allow admin access (you can customize this check)
      const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      const isReplitDev = req.hostname?.includes('replit.dev');
      
      if (!isLocalhost && !isReplitDev) {
        return res.status(403).json({ message: 'Admin access only' });
      }
      
      const allFeedback = await storage.getAllFeedback();
      res.json(allFeedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/admin/feedback/:id', async (req: any, res) => {
    try {
      // Only allow admin access
      const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      const isReplitDev = req.hostname?.includes('replit.dev');
      
      if (!isLocalhost && !isReplitDev) {
        return res.status(403).json({ message: 'Admin access only' });
      }
      
      const id = parseInt(req.params.id);
      const { status, response } = req.body;
      
      // Get the feedback before updating to compare status
      const oldFeedback = await storage.getFeedbackById(id);
      if (!oldFeedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      // Update feedback
      const updatedFeedback = await storage.updateFeedbackStatus(id, status, response);
      
      // Send email notification if status changed and user has email
      if (oldFeedback.status !== status && updatedFeedback.email) {
        setImmediate(async () => {
          try {
            await EmailService.sendStatusUpdate(
              updatedFeedback.email!,
              updatedFeedback.title,
              oldFeedback.status || 'pending',
              status,
              response
            );
            
            // Send resolution follow-up if marked as resolved
            if (status === 'resolved') {
              await EmailService.sendResolutionFollowUp(
                updatedFeedback.email!,
                updatedFeedback.title,
                updatedFeedback.type
              );
            }
          } catch (emailError) {
            console.error('Status update email failed:', emailError);
          }
        });
      }
      
      res.json(updatedFeedback);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // IQ Test Routes
  app.get("/api/iq-test/sessions", async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const sessions = await storage.getIqTestSessionsByUserId(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching IQ test sessions: " + error.message });
    }
  });

  app.post("/api/iq-test/sessions", async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const sessionData = {
        ...req.body,
        userId,
      };
      const session = await storage.createIqTestSession(sessionData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: "Error saving IQ test session: " + error.message });
    }
  });

  app.get("/api/iq-test/stats", async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = await storage.getIqTestStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching IQ test stats: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
