import prisma from "../../config/db";
import { SignalStatus, SignalType } from "../../types/enums";
import { broadcastEvent } from "../../config/socket";
import axios from "axios";

let isTracking = false;
let trackingInterval: NodeJS.Timeout | null = null;

// Mock prices cache to keep Forex smooth
const priceCache: Record<string, number> = {};

// Helper to fetch live crypto price from Binance
async function fetchCryptoPrice(coin: string): Promise<number | null> {
  try {
    const symbol = `${coin.toUpperCase()}USDT`;
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (response.data && response.data.price) {
      return parseFloat(response.data.price);
    }
    return null;
  } catch (error) {
    // Return null if Binance fails, fallback to simulator
    return null;
  }
}

// Generate realistic mock movements
function getMockPrice(asset: string, lastPrice: number, targetPrice?: number): number {
  // If target price exists, bias the random walk slightly towards the target
  const changePercent = (Math.random() - 0.49) * 0.0005; // biased upward slightly
  let newPrice = lastPrice * (1 + changePercent);

  // If a target exists, apply minor gravity towards it
  if (targetPrice) {
    const bias = (targetPrice - newPrice) * 0.02;
    newPrice += bias;
  }

  return newPrice;
}

export function startTrackingEngine() {
  if (isTracking) return;
  isTracking = true;

  console.log("🚀 Real-Time Signal Tracking Engine Started");

  trackingInterval = setInterval(async () => {
    try {
      // Find all signals that are not finished (SL, TP3, or EXPIRED)
      const activeSignals = await prisma.signal.findMany({
        where: {
          status: {
            in: [SignalStatus.PENDING, SignalStatus.ACTIVE, SignalStatus.TP1, SignalStatus.TP2]
          }
        },
        include: { result: true }
      });

      for (const signal of activeSignals) {
        let currentPrice = signal.entry;

        if (signal.type === SignalType.CRYPTO) {
          const livePrice = await fetchCryptoPrice(signal.asset);
          if (livePrice !== null) {
            currentPrice = livePrice;
          } else {
            // Fallback simulator
            const lastCached = priceCache[signal.id] || signal.entry;
            currentPrice = getMockPrice(signal.asset, lastCached, signal.tp2);
            priceCache[signal.id] = currentPrice;
          }
        } else {
          // Forex Mock engine
          const lastCached = priceCache[signal.id] || signal.entry;
          currentPrice = getMockPrice(signal.asset, lastCached, signal.tp2);
          priceCache[signal.id] = currentPrice;
        }

        // Round current price for displays
        const decimals = currentPrice > 1000 ? 2 : currentPrice > 10 ? 3 : 5;
        currentPrice = Math.round(currentPrice * Math.pow(10, decimals)) / Math.pow(10, decimals);

        // Track state transition logic
        let newStatus: SignalStatus = signal.status as SignalStatus;
        const dir = signal.direction; // BUY or SELL

        if (signal.status === SignalStatus.PENDING) {
          // Trigger entry
          if (dir === "BUY" && currentPrice >= signal.entry) {
            newStatus = SignalStatus.ACTIVE;
          } else if (dir === "SELL" && currentPrice <= signal.entry) {
            newStatus = SignalStatus.ACTIVE;
          }
        } else {
          // ACTIVE, TP1, or TP2
          if (dir === "BUY") {
            if (currentPrice <= signal.sl) {
              newStatus = SignalStatus.SL;
            } else if (currentPrice >= signal.tp3) {
              newStatus = SignalStatus.TP3;
            } else if (currentPrice >= signal.tp2 && signal.status !== SignalStatus.TP2) {
              newStatus = SignalStatus.TP2;
            } else if (currentPrice >= signal.tp1 && signal.status === SignalStatus.ACTIVE) {
              newStatus = SignalStatus.TP1;
            }
          } else { // SELL
            if (currentPrice >= signal.sl) {
              newStatus = SignalStatus.SL;
            } else if (currentPrice <= signal.tp3) {
              newStatus = SignalStatus.TP3;
            } else if (currentPrice <= signal.tp2 && signal.status !== SignalStatus.TP2) {
              newStatus = SignalStatus.TP2;
            } else if (currentPrice <= signal.tp1 && signal.status === SignalStatus.ACTIVE) {
              newStatus = SignalStatus.TP1;
            }
          }
        }

        // Calculate Pips / Percentage / ROI
        let profitLoss = 0;
        let roi = 0;
        const entry = signal.entry;

        if (signal.type === SignalType.CRYPTO) {
          const isBuy = dir === "BUY" ? 1 : -1;
          profitLoss = ((currentPrice - entry) / entry) * 100 * isBuy; // % gain
          roi = profitLoss * signal.riskRatio;
        } else {
          // Forex pips: 1 pip = 0.0001 (Gold XAUUSD is different: 1 pip = 0.1)
          const pipSize = signal.asset.toUpperCase() === "XAUUSD" ? 0.1 : 0.0001;
          const isBuy = dir === "BUY" ? 1 : -1;
          profitLoss = ((currentPrice - entry) / pipSize) * isBuy; // pips gained
          roi = (profitLoss / 10) * signal.riskRatio; // e.g. 10 pips = 1% ROI * risk ratio
        }

        // Round calculations
        profitLoss = Math.round(profitLoss * 100) / 100;
        roi = Math.round(roi * 100) / 100;

        const durationMinutes = Math.round((Date.now() - new Date(signal.createdAt).getTime()) / 60000);

        // Update database
        await prisma.signal.update({
          where: { id: signal.id },
          data: { status: newStatus }
        });

        await prisma.signalResult.update({
          where: { signalId: signal.id },
          data: {
            currentPrice,
            profitLoss,
            roi,
            status: newStatus,
            duration: durationMinutes
          }
        });

        // If status changed, broadcast notification
        if (newStatus !== signal.status) {
          let eventMessage = "";
          if (newStatus === SignalStatus.ACTIVE) {
            eventMessage = `🚀 Signal Entry Triggered: ${signal.asset} ${signal.direction} at ${signal.entry}`;
          } else if (newStatus === SignalStatus.TP1) {
            eventMessage = `🎯 TP1 HIT on ${signal.asset}! ${profitLoss > 0 ? "+" : ""}${profitLoss} ${signal.type === SignalType.FOREX ? "pips" : "%"}`;
          } else if (newStatus === SignalStatus.TP2) {
            eventMessage = `🎯🎯 TP2 HIT on ${signal.asset}! ${profitLoss > 0 ? "+" : ""}${profitLoss} ${signal.type === SignalType.FOREX ? "pips" : "%"}`;
          } else if (newStatus === SignalStatus.TP3) {
            eventMessage = `🏆 TP3 HIT (Completed) on ${signal.asset}! Total ROI: ${roi}%`;
          } else if (newStatus === SignalStatus.SL) {
            eventMessage = `❌ SL HIT on ${signal.asset}. ROI: ${roi}%`;
          }

          broadcastEvent("user-notification", {
            title: `Signal Alert: ${signal.asset}`,
            message: eventMessage,
            type: "SIGNAL_ALERT"
          });

          // Also broadcast the full updated signal object
          const updatedSignal = await prisma.signal.findUnique({
            where: { id: signal.id },
            include: { result: true }
          });
          broadcastEvent("update-signal", updatedSignal);
        }

        // Live ticking update event for current price
        broadcastEvent("signal-price-tick", {
          signalId: signal.id,
          currentPrice,
          profitLoss,
          roi,
          status: newStatus
        });
      }
    } catch (error) {
      console.error("Error in signal tracking loop: ", error);
    }
  }, 5000);
}

export function stopTrackingEngine() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  isTracking = false;
}
