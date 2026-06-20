export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

export enum Plan {
  NONE = "NONE",
  BASIC = "BASIC",
  PRO = "PRO",
  VIP = "VIP"
}

export enum SignalType {
  FOREX = "FOREX",
  CRYPTO = "CRYPTO"
}

export enum SignalStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  TP1 = "TP1",
  TP2 = "TP2",
  TP3 = "TP3",
  SL = "SL",
  EXPIRED = "EXPIRED"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  FAILED = "FAILED"
}

export enum PaymentProvider {
  STRIPE = "STRIPE",
  PAYSTACK = "PAYSTACK",
  FLUTTERWAVE = "FLUTTERWAVE",
  CRYPTO = "CRYPTO"
}
