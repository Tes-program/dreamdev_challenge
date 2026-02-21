import { prisma } from '../utils/prisma';
import {
  TopMerchantResponse,
  MonthlyActiveMerchantsResponse,
  ProductAdoptionResponse,
  KycFunnelResponse,
  FailureRatesResponse,
} from '../types/analytics.types';
import { Product, Status, EventType } from '../enums/analytics.enums';


export const getTopMerchant = async (): Promise<TopMerchantResponse> => {
  const result = await prisma.activityRecord.groupBy({
    by: ['merchant_id'],
    where: { status: Status.SUCCESS },
    _sum: { amount: true },
    // Arrange in descending order to get the top merchant and limit to 1 result
    orderBy: { _sum: { amount: 'desc' } },
    take: 1,
  });

  if (!result.length) throw new Error('No data found');

  return {
    merchant_id: result[0].merchant_id,
    total_volume: Number(result[0]._sum.amount ?? 0),
  };
};

export const getMonthlyActiveMerchants = async (): Promise<MonthlyActiveMerchantsResponse> => {
  const result = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT 
      TO_CHAR("event_timestamp", 'YYYY-MM') as month,
      COUNT(DISTINCT "merchant_id") as count
    FROM "activity_record"
    WHERE status = ${Status.SUCCESS}
    AND "event_timestamp" != '1970-01-01T00:00:00Z'
    GROUP BY month
    ORDER BY month ASC
  `;

  return result.reduce<MonthlyActiveMerchantsResponse>((acc, row) => {
    acc[row.month] = Number(row.count);
    return acc;
  }, {});
};

export const getProductAdoption = async (): Promise<ProductAdoptionResponse> => {
  const result = await prisma.$queryRaw<{ product: string; count: bigint }[]>`
    SELECT 
      product,
      COUNT(DISTINCT "merchant_id") as count
    FROM "activity_record"
    GROUP BY product
    ORDER BY count DESC
  `;

  return result.reduce<ProductAdoptionResponse>((acc, row) => {
    acc[row.product] = Number(row.count);
    return acc;
  }, {});
};

export const getKycFunnel = async (): Promise<KycFunnelResponse> => {
  const result = await prisma.$queryRaw<{ event_type: string; unique_merchants: bigint }[]>`
    SELECT 
      event_type,
      COUNT(DISTINCT merchant_id) as unique_merchants
    FROM "activity_record"
    WHERE product = 'KYC'
    AND status = 'SUCCESS'
    AND event_type IN ('DOCUMENT_SUBMITTED', 'VERIFICATION_COMPLETED', 'TIER_UPGRADE')
    GROUP BY event_type
  `;

  const getCount = (eventType: string): number =>
    Number(
      result.find((r) => r.event_type === eventType)?.unique_merchants ?? 0
    );

  return {
    documents_submitted: getCount(EventType.DOCUMENT_SUBMITTED),
    verifications_completed: getCount(EventType.VERIFICATION_COMPLETED),
    tier_upgrades: getCount(EventType.TIER_UPGRADE),
  };
};

export const getFailureRates = async (): Promise<FailureRatesResponse> => {
  const result = await prisma.$queryRaw<{ product: string; success: bigint; failed: bigint }[]>`
    SELECT 
      product,
      COUNT(*) FILTER (WHERE status = ${Status.SUCCESS}) as success,
      COUNT(*) FILTER (WHERE status = ${Status.FAILED}) as failed
    FROM "activity_record"
    WHERE status IN (${Status.SUCCESS}, ${Status.FAILED})
    GROUP BY product
  `;

  return result
    .map((row) => {
      const success = Number(row.success);
      const failed = Number(row.failed);
      const total = success + failed;
      const failure_rate = total > 0
        ? Math.round((failed / total) * 1000) / 10
        : 0;
      return { product: row.product, failure_rate };
    })
    .sort((a, b) => b.failure_rate - a.failure_rate);
};