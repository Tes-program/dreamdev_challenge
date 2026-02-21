import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';
import { parseCSV } from '../utils/csvParser';
import {
  Product,
  Status,
  Channel,
  MerchantTier,
  EventType,
} from '../enums/analytics.enums';

interface RawActivity {
  event_id: string;
  merchant_id: string;
  event_timestamp: string;
  product: string;
  event_type: string;
  amount: string;
  status: string;
  channel: string;
  region: string;
  merchant_tier: string;
}

// Safe enum cast — returns null if value is unrecognised or missing (trying to enforce strict type safety)
const toEnum = <T extends Record<string, string>>(
  enumObj: T,
  value: string | undefined
): T[keyof T] | null => {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  return (Object.values(enumObj).includes(trimmed)
    ? trimmed
    : null) as T[keyof T] | null;
};

const isValidActivity = (row: RawActivity): boolean => {
  // Unrecoverable — discard if any of these are missing or empty since they are critical for all endpoints and can't be defaulted
  if (!row.event_id?.trim()) return false;
  if (!row.merchant_id?.trim()) return false;
  if (!row.product?.trim()) return false;
  if (!row.status?.trim()) return false;
  if (!row.channel?.trim()) return false;

  // Timestamp — discard if completely missing or unparseable since it's critical for the monthly active merchants endpoint and can't be defaulted
  if (!row.event_timestamp?.trim()) return false;
  const ts = new Date(row.event_timestamp);
  if (isNaN(ts.getTime())) return false;

  // Enum validation for critical fields
  // Discard records with unrecognised product or status
  // since every endpoint depends on these being valid
  if (!toEnum(Product, row.product)) return false;
  if (!toEnum(Status, row.status)) return false;

  return true;
};

const ingestAllCSVFiles = async (): Promise<void> => {
  const dataDir = path.join(__dirname, '..', 'data');

  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found at: ${dataDir}`);
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.match(/^activities_\d{8}\.csv$/));

  if (!files.length) {
    throw new Error('No activity CSV files found in data directory');
  }

  let totalRecords = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const rows = await parseCSV<RawActivity>(filePath);

    const valid = rows.filter(isValidActivity);
    totalSkipped += rows.length - valid.length;

    if (!valid.length) {
      console.log(`⚠️  Skipped ${file} — no valid records`);
      continue;
    }

    // Upsert in chunks of 1000 for performance and to avoid overwhelming the database with too large transactions
    const chunkSize = 1000;
    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);

      await prisma.$transaction(
        chunk.map((row) =>
          prisma.activityRecord.upsert({
            where: { event_id: row.event_id.trim() },
            update: {}, // No update on duplicate — it keeps original record on every rerun
            create: {
              event_id: row.event_id.trim(),
              merchant_id: row.merchant_id.trim(),
              event_timestamp: new Date(row.event_timestamp.trim()),
              product: toEnum(Product, row.product)!,
              event_type:
                toEnum(EventType, row.event_type) ?? EventType.UNKNOWN,
              amount: isNaN(parseFloat(row.amount))
                ? 0
                : parseFloat(row.amount),
              status: toEnum(Status, row.status)!,
              channel:
                toEnum(Channel, row.channel) ?? Channel.UNKNOWN,
              region: row.region?.trim() || 'UNKNOWN',
              merchant_tier:
                toEnum(MerchantTier, row.merchant_tier) ??
                MerchantTier.STARTER,
            },
          })
        )
      );
    }

    totalRecords += valid.length;
    console.log(`✅ Ingested ${file} — ${valid.length} records`);
  }

  console.log(`
  Seed Complete
  Files processed : ${files.length}
  Records ingested: ${totalRecords}
  Records skipped : ${totalSkipped}
  `);
};

ingestAllCSVFiles()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());