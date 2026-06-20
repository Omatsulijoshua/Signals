import { Router, Response } from "express";
import prisma from "../../config/db";
import { authenticateJWT, requireRole, AuthRequest } from "../../middleware/auth";
import { Role, Plan, SignalType, SignalStatus } from "../../types/enums";
import { broadcastEvent } from "../../config/socket";

const router = Router();

// Obfuscate signals based on user plan
function redactSignalForPlan(signal: any, plan: Plan, role: Role) {
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return signal;
  }

  const redacted = { ...signal };

  if (plan === Plan.NONE) {
    redacted.sl = null;
    redacted.tp1 = null;
    redacted.tp2 = null;
    redacted.tp3 = null;
    redacted.locked = true;
  } else if (plan === Plan.BASIC) {
    redacted.tp2 = null;
    redacted.tp3 = null;
    redacted.locked = false;
  } else if (plan === Plan.PRO) {
    redacted.tp3 = null;
    redacted.locked = false;
  } else {
    redacted.locked = false;
  }

  return redacted;
}

// GET ALL SIGNALS (Feed)
router.get("/", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || Role.USER;
    const userPlan = (req.user?.role !== Role.USER ? Plan.VIP : (await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { subscriptionStatus: true }
    }))?.subscriptionStatus || Plan.NONE) as Plan;

    const signals = await prisma.signal.findMany({
      orderBy: { createdAt: "desc" },
      include: { result: true }
    });

    const processedSignals = signals.map(signal => 
      redactSignalForPlan(signal, userPlan, userRole)
    );

    res.json(processedSignals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET ANALYTICS
router.get("/analytics", async (req, res) => {
  try {
    const totalSignals = await prisma.signal.count();
    const activeSignals = await prisma.signal.count({
      where: { status: { in: [SignalStatus.PENDING, SignalStatus.ACTIVE] } }
    });

    const closedSignals = await prisma.signal.findMany({
      where: { status: { in: [SignalStatus.TP1, SignalStatus.TP2, SignalStatus.TP3, SignalStatus.SL] } },
      include: { result: true }
    });

    const winCount = closedSignals.filter(s => 
      s.status === SignalStatus.TP1 || s.status === SignalStatus.TP2 || s.status === SignalStatus.TP3
    ).length;

    const lossCount = closedSignals.filter(s => s.status === SignalStatus.SL).length;
    const winRate = closedSignals.length > 0 ? (winCount / closedSignals.length) * 100 : 100;

    let totalROI = 0;
    const assetROI: Record<string, number> = {};

    closedSignals.forEach(s => {
      if (s.result) {
        totalROI += s.result.roi;
        assetROI[s.asset] = (assetROI[s.asset] || 0) + s.result.roi;
      }
    });

    const averageROI = closedSignals.length > 0 ? totalROI / closedSignals.length : 0;

    let bestAsset = "N/A";
    let maxAssetROI = -Infinity;
    Object.entries(assetROI).forEach(([asset, roi]) => {
      if (roi > maxAssetROI) {
        maxAssetROI = roi;
        bestAsset = asset;
      }
    });

    res.json({
      totalSignals,
      activeSignals,
      winRate: Math.round(winRate * 10) / 10,
      totalROI: Math.round(totalROI * 10) / 10,
      averageROI: Math.round(averageROI * 10) / 10,
      bestAsset
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI GENERATE SIGNAL (Mock AI prediction)
router.post("/ai-generate", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { asset, type } = req.body;
    if (!asset || !type) {
      return res.status(400).json({ error: "Asset and type are required" });
    }

    // Mock live price estimation
    let price = 1.0;
    if (type === SignalType.CRYPTO) {
      if (asset === "BTC") price = 67250 + Math.random() * 500;
      else if (asset === "ETH") price = 3450 + Math.random() * 50;
      else if (asset === "SOL") price = 145 + Math.random() * 5;
      else price = 10 + Math.random() * 5;
    } else {
      if (asset === "EURUSD") price = 1.0850 + Math.random() * 0.0050;
      else if (asset === "GBPUSD") price = 1.2680 + Math.random() * 0.0050;
      else if (asset === "XAUUSD") price = 2320 + Math.random() * 15;
      else price = 1.5 + Math.random() * 0.5;
    }

    const direction = Math.random() > 0.4 ? "BUY" : "SELL";
    const percentDiff = type === SignalType.CRYPTO ? 0.02 : 0.003; // 2% for crypto, 30 pips for forex

    let sl: number;
    let tp1: number;
    let tp2: number;
    let tp3: number;

    if (direction === "BUY") {
      sl = price * (1 - percentDiff);
      tp1 = price * (1 + percentDiff);
      tp2 = price * (1 + percentDiff * 2);
      tp3 = price * (1 + percentDiff * 3);
    } else {
      sl = price * (1 + percentDiff);
      tp1 = price * (1 - percentDiff);
      tp2 = price * (1 - percentDiff * 2);
      tp3 = price * (1 - percentDiff * 3);
    }

    // Rounding based on price magnitude
    const decimals = price > 1000 ? 2 : price > 10 ? 3 : 5;
    const roundVal = (v: number) => Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);

    const confidence = 75 + Math.floor(Math.random() * 21);
    const sentiment = Math.random() > 0.35 ? (direction === "BUY" ? "BULLISH" : "BEARISH") : "NEUTRAL";

    res.json({
      type,
      asset,
      direction,
      entry: roundVal(price),
      sl: roundVal(sl),
      tp1: roundVal(tp1),
      tp2: roundVal(tp2),
      tp3: roundVal(tp3),
      riskRatio: 1.5,
      timeframe: "1H",
      aiConfidence: confidence,
      sentiment
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE SIGNAL (Admin)
router.post("/", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { type, asset, direction, entry, sl, tp1, tp2, tp3, riskRatio, timeframe, aiConfidence, sentiment } = req.body;

    if (!type || !asset || !direction || !entry || !sl || !tp1 || !tp2 || !tp3) {
      return res.status(400).json({ error: "Missing required signal parameters" });
    }

    const signal = await prisma.signal.create({
      data: {
        type,
        asset,
        direction,
        entry: parseFloat(entry),
        sl: parseFloat(sl),
        tp1: parseFloat(tp1),
        tp2: parseFloat(tp2),
        tp3: parseFloat(tp3),
        riskRatio: riskRatio ? parseFloat(riskRatio) : 1.0,
        timeframe: timeframe || "1H",
        aiConfidence: aiConfidence ? parseInt(aiConfidence) : 80,
        sentiment: sentiment || "BULLISH",
        status: SignalStatus.PENDING
      }
    });

    // Create default signal result
    await prisma.signalResult.create({
      data: {
        signalId: signal.id,
        currentPrice: signal.entry,
        profitLoss: 0,
        roi: 0,
        status: SignalStatus.PENDING
      }
    });

    const fullSignal = await prisma.signal.findUnique({
      where: { id: signal.id },
      include: { result: true }
    });

    broadcastEvent("new-signal", fullSignal);

    res.status(201).json(fullSignal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// EDIT SIGNAL (Admin)
router.put("/:id", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Convert numeric fields if provided
    const updateData: any = { ...data };
    if (updateData.entry) updateData.entry = parseFloat(updateData.entry);
    if (updateData.sl) updateData.sl = parseFloat(updateData.sl);
    if (updateData.tp1) updateData.tp1 = parseFloat(updateData.tp1);
    if (updateData.tp2) updateData.tp2 = parseFloat(updateData.tp2);
    if (updateData.tp3) updateData.tp3 = parseFloat(updateData.tp3);
    if (updateData.riskRatio) updateData.riskRatio = parseFloat(updateData.riskRatio);
    if (updateData.aiConfidence) updateData.aiConfidence = parseInt(updateData.aiConfidence);

    const signal = await prisma.signal.update({
      where: { id },
      data: updateData,
      include: { result: true }
    });

    // Update corresponding signal result status if signal status changes
    if (data.status) {
      await prisma.signalResult.update({
        where: { signalId: id },
        data: { status: data.status }
      });
    }

    const updatedSignal = await prisma.signal.findUnique({
      where: { id },
      include: { result: true }
    });

    broadcastEvent("update-signal", updatedSignal);

    res.json(updatedSignal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SIGNAL (Admin)
router.delete("/:id", authenticateJWT as any, requireRole([Role.ADMIN, Role.SUPER_ADMIN]) as any, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.signal.delete({ where: { id } });

    broadcastEvent("delete-signal", { id });

    res.json({ message: "Signal deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
