import prisma from "./config/db";
import bcrypt from "bcryptjs";
import { Role, Plan, SignalType, SignalStatus } from "./types/enums";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean old data
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.signalResult.deleteMany({});
  await prisma.signal.deleteMany({});
  await prisma.user.deleteMany({});

  // Hashes
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);
  const vipPassword = await bcrypt.hash("Vip123!", 10);

  // 1. Create Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "Admin Pro",
      email: "admin@signalspro.com",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      subscriptionStatus: Plan.VIP,
      referralCode: "PROADMIN",
    }
  });

  // 2. Create Regular User
  const regularUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "user@signalspro.com",
      password: userPassword,
      role: Role.USER,
      subscriptionStatus: Plan.BASIC,
      subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      referralCode: "JOHNDOE",
      referredById: admin.id,
    }
  });

  // 3. Create VIP User
  const vipUser = await prisma.user.create({
    data: {
      name: "Jane Gold",
      email: "vip@signalspro.com",
      password: vipPassword,
      role: Role.USER,
      subscriptionStatus: Plan.VIP,
      subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      referralCode: "JANEGOLD",
    }
  });

  console.log("✅ Users seeded.");

  // 4. Create Forex Signals
  const eurusd = await prisma.signal.create({
    data: {
      type: SignalType.FOREX,
      asset: "EURUSD",
      direction: "BUY",
      entry: 1.0850,
      sl: 1.0820,
      tp1: 1.0880,
      tp2: 1.0910,
      tp3: 1.0940,
      riskRatio: 1.5,
      timeframe: "1H",
      aiConfidence: 85,
      sentiment: "BULLISH",
      status: SignalStatus.ACTIVE,
    }
  });

  await prisma.signalResult.create({
    data: {
      signalId: eurusd.id,
      currentPrice: 1.0862,
      profitLoss: 12, // 12 pips
      roi: 1.8,
      status: SignalStatus.ACTIVE,
    }
  });

  const gbpusd = await prisma.signal.create({
    data: {
      type: SignalType.FOREX,
      asset: "GBPUSD",
      direction: "SELL",
      entry: 1.2650,
      sl: 1.2700,
      tp1: 1.2600,
      tp2: 1.2550,
      tp3: 1.2500,
      riskRatio: 1.0,
      timeframe: "4H",
      aiConfidence: 78,
      sentiment: "BEARISH",
      status: SignalStatus.TP1,
    }
  });

  await prisma.signalResult.create({
    data: {
      signalId: gbpusd.id,
      currentPrice: 1.2592,
      profitLoss: 58, // 58 pips
      roi: 5.8,
      status: SignalStatus.TP1,
    }
  });

  // 5. Create Crypto Signals
  const btc = await prisma.signal.create({
    data: {
      type: SignalType.CRYPTO,
      asset: "BTC",
      direction: "BUY",
      entry: 65000,
      sl: 63500,
      tp1: 66000,
      tp2: 67500,
      tp3: 69000,
      riskRatio: 2.0,
      timeframe: "1D",
      aiConfidence: 92,
      sentiment: "BULLISH",
      status: SignalStatus.ACTIVE,
    }
  });

  await prisma.signalResult.create({
    data: {
      signalId: btc.id,
      currentPrice: 65420,
      profitLoss: 0.65, // % profit
      roi: 1.3,
      status: SignalStatus.ACTIVE,
    }
  });

  const sol = await prisma.signal.create({
    data: {
      type: SignalType.CRYPTO,
      asset: "SOL",
      direction: "BUY",
      entry: 140.0,
      sl: 130.0,
      tp1: 145.0,
      tp2: 155.0,
      tp3: 170.0,
      riskRatio: 1.5,
      timeframe: "1H",
      aiConfidence: 88,
      sentiment: "BULLISH",
      status: SignalStatus.TP2,
    }
  });

  await prisma.signalResult.create({
    data: {
      signalId: sol.id,
      currentPrice: 156.4,
      profitLoss: 11.71, // % profit
      roi: 17.57,
      status: SignalStatus.TP2,
    }
  });

  console.log("✅ Signals and results seeded.");
  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
