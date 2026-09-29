export type ActiveScreen = 
  | 'dashboard'
  | 'reports'
  | 'chargeback-hub'
  | 'raise-chargeback'
  | 'view-chargeback'
  | 'login';

export type UserType = 'merchant' | 'admin' | 'partner';

export type ChargebackStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'RAISED';

export type ChargebackSubStatus = 'ALL' | 'PRE_ARBITRATION' | 'MERCHANT_ACCEPTED' | 'DOCUMENTS_REQUIRED' | 'BANK_PROCESSING' | 'RESOLVED';

export interface ChargebackRecord {
  id: string;
  rrn: string;
  merchantId: string;
  merchantName: string;
  transactionDate: string;
  disputeDate: string;
  amount: number;
  reasonCode: string;
  reasonDescription: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review' | 'Raised' | 'New' | 'Accepted' | 'Partially Accepted';
  subStatus: 'Pre-Arbitration' | 'Merchant Accepted' | 'Documents Required' | 'Bank Processing' | 'Resolved' | 'Action Pending' | 'Partially Accepted' | string;
  cardNetwork: 'UPI';
  terminalId: string;
  customerMobile: string;
  partialAmount?: number;
  partialReason?: string;
  partialEvidenceFiles?: string[];
  partialEvidenceRemarks?: string;
  aging?: string;
}

export interface FilterParams {
  fromDate: string;
  toDate: string;
  rrnNumber: string;
  merchantId: string;
  merchantName?: string;
  transactionId?: string;
  status: string;
  subStatus: string;
}

export interface UserProfile {
  username: string;
  fullName: string;
  role: string;
  userType: UserType;
  avatar: string;
  walletBalance: number;
}
