import { Router, Response } from "express";
import prisma from "../../config/db";
import { authenticateJWT, requireRole, AuthRequest } from "../../middleware/auth";
import { Role, Plan } from "../../types/enums";
import { broadcastEvent } from "../../config/socket";

const router = Router();

// GET ALL USERS (ADMIN/SUPER_ADMIN)
router.get("/users", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionExpires: true,
        referralCode: true,
        createdAt: true,
        _count: {
          select: { referrals: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE USER PROFILE OR PLAN MANUALLY (ADMIN/SUPER_ADMIN)
router.put("/users/:id", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, subscriptionStatus, subscriptionExpires } = req.body;

    const data: any = {};
    if (role && Object.values(Role).includes(role)) {
      data.role = role;
    }
    if (subscriptionStatus && Object.values(Plan).includes(subscriptionStatus)) {
      data.subscriptionStatus = subscriptionStatus;
      if (subscriptionStatus === Plan.NONE) {
        data.subscriptionExpires = null;
      } else {
        const exp = subscriptionExpires ? new Date(subscriptionExpires) : new Date();
        if (!subscriptionExpires) {
          exp.setDate(exp.getDate() + 30);
        }
        data.subscriptionExpires = exp;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionExpires: true
      }
    });

    // Broadcast user settings change
    broadcastEvent("subscription-updated", {
      userId: updatedUser.id,
      plan: updatedUser.subscriptionStatus,
      expiryDate: updatedUser.subscriptionExpires
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BROADCAST SYSTEM NOTIFICATION (ADMIN/SUPER_ADMIN)
router.post("/notifications/broadcast", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { title, message, planTarget } = req.body; // planTarget: 'ALL', 'BASIC', 'PRO', 'VIP'

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required for broadcasts" });
    }

    broadcastEvent("global-notification", {
      title,
      message,
      planTarget: planTarget || "ALL",
      timestamp: new Date()
    });

    res.json({ message: "Broadcast sent successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
