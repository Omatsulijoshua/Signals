import { Router, Response } from "express";
import prisma from "../../config/db";
import { authenticateJWT, requireRole, AuthRequest } from "../../middleware/auth";
import { Role, Plan, PaymentStatus, PaymentProvider } from "../../types/enums";
import { broadcastEvent } from "../../config/socket";

const router = Router();

// INITIATE CHECKOUT
router.post("/checkout", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { plan, provider } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!plan || !provider) {
      return res.status(400).json({ error: "Plan and payment provider are required" });
    }

    if (!Object.values(Plan).includes(plan) || plan === Plan.NONE) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    if (!Object.values(PaymentProvider).includes(provider)) {
      return res.status(400).json({ error: "Invalid payment provider" });
    }

    // Determine plan pricing
    let amount = 0;
    if (plan === Plan.BASIC) amount = 9.99;
    else if (plan === Plan.PRO) amount = 29.99;
    else if (plan === Plan.VIP) amount = 79.99;

    const reference = `${provider.toLowerCase()}_ref_${Math.random().toString(36).substring(2, 15)}`;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        status: PaymentStatus.PENDING,
        provider,
        reference
      }
    });

    // For testing and mock purposes, we return a simulated checkout URL
    const checkoutUrl = `https://checkout.signals-pro.com/pay/${reference}`;

    res.status(201).json({
      paymentId: payment.id,
      amount,
      reference,
      checkoutUrl,
      message: "Payment initialized successfully"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SIMULATED GATEWAY WEBHOOK INVOCATIONS (To make it fully testable)
async function activateUserSubscription(reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { user: true }
  });

  if (!payment || payment.status === PaymentStatus.SUCCESSFUL) return payment;

  // Determine plan based on amount paid
  let plan = Plan.BASIC;
  if (payment.amount >= 79.0) plan = Plan.VIP;
  else if (payment.amount >= 29.0) plan = Plan.PRO;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30-day billing cycle

  // Update transaction & user plan
  const updatedPayment = await prisma.$transaction(async (tx) => {
    const updatedPay = await tx.payment.update({
      where: { reference },
      data: { status: PaymentStatus.SUCCESSFUL }
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionStatus: plan,
        subscriptionExpires: expiryDate
      }
    });

    await tx.subscription.create({
      data: {
        userId: payment.userId,
        plan,
        expiryDate
      }
    });

    return updatedPay;
  });

  // Trigger WS notifications
  broadcastEvent("subscription-updated", {
    userId: payment.userId,
    plan,
    expiryDate
  });

  // Web Socket push alerts
  broadcastEvent("user-notification", {
    userId: payment.userId,
    title: "🎉 VIP Subscription Activated!",
    message: `Thank you for choosing Signals Pro! Your ${plan} tier is now active.`
  });

  return updatedPayment;
}

// STRIPE WEBHOOK
router.post("/stripe-webhook", async (req, res) => {
  try {
    const { reference, success } = req.body;
    if (success) {
      await activateUserSubscription(reference);
      return res.json({ message: "Stripe Webhook processed successfully" });
    }
    await prisma.payment.update({
      where: { reference },
      data: { status: PaymentStatus.FAILED }
    });
    res.json({ message: "Stripe Payment failed updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PAYSTACK WEBHOOK
router.post("/paystack-webhook", async (req, res) => {
  try {
    const { reference, status } = req.body; // status: 'success'
    if (status === "success") {
      await activateUserSubscription(reference);
      return res.json({ message: "Paystack Webhook processed" });
    }
    await prisma.payment.update({
      where: { reference },
      data: { status: PaymentStatus.FAILED }
    });
    res.json({ message: "Paystack failure logged" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FLUTTERWAVE WEBHOOK
router.post("/flutterwave-webhook", async (req, res) => {
  try {
    const { reference, status } = req.body; // status: 'successful'
    if (status === "successful") {
      await activateUserSubscription(reference);
      return res.json({ message: "Flutterwave Webhook processed" });
    }
    await prisma.payment.update({
      where: { reference },
      data: { status: PaymentStatus.FAILED }
    });
    res.json({ message: "Flutterwave failure logged" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// USER PAYMENTS HISTORY
router.get("/history", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: VIEW ALL PAYMENTS
router.get("/", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: APPROVE PAYMENT MANUALLY (Useful for Crypto or Direct Deposits)
router.post("/approve/:id", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) return res.status(404).json({ error: "Payment record not found" });

    await activateUserSubscription(payment.reference);
    res.json({ message: "Payment transaction manually approved and activated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
