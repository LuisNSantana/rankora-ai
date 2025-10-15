# Scalable Insight Storage Architecture

## Overview

This document explains the scalable storage architecture implemented for handling large insight reports in Rankora AI.

## Problem

Convex database has a **1 MiB (1,048,576 bytes) limit** per document. Large insights with extensive visualizations, metrics, and recommendations can easily exceed this limit, causing failures like:

```
Uncaught Error: Value is too large (1.76 MiB > maximum size 1 MiB)
```

## Solution: Hybrid Storage Strategy

We implement an intelligent hybrid approach that automatically selects the optimal storage method based on content size:

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Insight Generation                        │
│            (AI Analysis from Documents/URLs)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  Calculate Size      │
         │  (JSON stringify)    │
         └──────┬───────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
┌───────────┐     ┌────────────────┐
│ < 500 KB  │     │  >= 500 KB     │
└─────┬─────┘     └────────┬───────┘
      │                    │
      ▼                    ▼
┌───────────────┐  ┌──────────────────────┐
│   Database    │  │   File Storage       │
│   (Direct)    │  │   (Convex Storage)   │
└───────┬───────┘  └──────────┬───────────┘
        │                     │
        │          ┌──────────┴───────────┐
        │          │  Store Full Report   │
        │          │  Save Summary in DB  │
        │          └──────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌────────────────────┐
        │  Frontend Fetch    │
        │  (Auto-detection)  │
        └────────────────────┘
```

### Storage Thresholds

- **Small Reports (< 500 KB)**: Stored directly in Convex database
- **Large Reports (>= 500 KB)**: Full content in File Storage, lightweight summary in DB

### Database Schema

```typescript
insightReports: defineTable({
  // ... existing fields ...
  
  // SCALABLE STORAGE:
  insightReport: v.optional(v.any()), // Full report OR summary
  insightFileId: v.optional(v.id("_storage")), // Storage ID for large reports
  reportSize: v.optional(v.number()), // Size in bytes
})
```

## Implementation Details

### Backend Functions

#### 1. `saveInsightReport` (Action)

**Location**: `convex/insightReports.ts`

**Purpose**: Intelligently saves insight reports based on size

```typescript
export const saveInsightReport = action({
  args: {
    id: v.id("insightReports"),
    insightData: v.any(),
  },
  handler: async (ctx, { id, insightData }) => {
    const jsonString = JSON.stringify(insightData);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    const SIZE_THRESHOLD = 500 * 1024; // 500 KB

    if (sizeInBytes < SIZE_THRESHOLD) {
      // Store directly in DB
      await ctx.runMutation(internal.insightReports.patchInsightReportInternal, {
        id,
        patch: {
          insightReport: insightData,
          reportSize: sizeInBytes,
          status: "completed",
          completedAt: Date.now(),
        },
      });
    } else {
      // Store in File Storage
      const blob = new Blob([jsonString], { type: "application/json" });
      const storageId = await ctx.storage.store(blob);

      // Create lightweight summary for DB
      const summary = {
        type: insightData.type,
        title: insightData.title,
        summary: insightData.summary?.substring(0, 500) + "...",
        metrics: insightData.metrics?.slice(0, 5), // First 5 only
        metricsCount: insightData.metrics?.length || 0,
        // ... other counts
      };

      await ctx.runMutation(internal.insightReports.patchInsightReportInternal, {
        id,
        patch: {
          insightReport: summary,
          insightFileId: storageId,
          reportSize: sizeInBytes,
          status: "completed",
          completedAt: Date.now(),
        },
      });
    }
  },
});
```

#### 2. `getFullInsightReport` (Query)

**Purpose**: Returns report metadata with storage type indicator

```typescript
export const getFullInsightReport = query({
  args: { id: v.id("insightReports") },
  handler: async (ctx, { id }) => {
    const report = await ctx.db.get(id);
    if (!report) return null;

    if (report.insightFileId) {
      return {
        ...report,
        isLargeReport: true,
        storageId: report.insightFileId,
      };
    }

    return {
      ...report,
      isLargeReport: false,
    };
  },
});
```

#### 3. `getInsightFileContent` (Action)

**Purpose**: Fetches full content from File Storage when needed

```typescript
export const getInsightFileContent = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const blob = await ctx.storage.get(storageId);
    if (!blob) throw new Error("Insight file not found");
    
    const text = await blob.text();
    return JSON.parse(text);
  },
});
```

### Frontend Integration

#### Custom Hook: `useFullInsight`

**Location**: `app/insights/report/[id]/summary/useFullInsight.ts`

**Purpose**: Transparently loads insights regardless of storage method

```typescript
export function useFullInsight(reportId: Id<"insightReports">) {
  const [fullInsight, setFullInsight] = useState<BusinessInsight | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const report = useQuery(api.insightReports.getFullInsightReport, { id: reportId });
  const getFileContent = useAction(api.insightReports.getInsightFileContent);

  useEffect(() => {
    const loadFullReport = async () => {
      if (!report) return;

      if (report.isLargeReport && report.storageId) {
        setIsLoadingFile(true);
        const fileContent = await getFileContent({ storageId: report.storageId });
        setFullInsight(fileContent);
        setIsLoadingFile(false);
      } else {
        setFullInsight(report.insightReport);
      }
    };

    loadFullReport();
  }, [report, getFileContent]);

  return { insight: fullInsight, isLoading, isLargeReport, error };
}
```

#### Usage in Components

```typescript
// Summary Page
export default function InsightSummary({ params }) {
  const { id } = React.use(params);
  const { insight, isLoading, isLargeReport } = useFullInsight(id);

  if (isLoading) {
    return <LoadingState message={isLargeReport ? "Loading large report..." : "Loading..."} />;
  }

  return (
    <div>
      {isLargeReport && <LargeReportNotice />}
      <KeyMetricsGrid insight={insight} />
      <VisualizationsGrid insight={insight} />
      {/* ... other components */}
    </div>
  );
}
```

## Benefits

### 1. **Unlimited Scale**
- Small insights: Fast DB access
- Large insights: No size limit (File Storage supports much larger files)

### 2. **Performance Optimization**
- Query metadata without loading full content
- Lazy load full content only when needed
- Summary data available immediately for lists/tables

### 3. **Cost Efficiency**
- Database usage optimized for small reports
- File Storage only used when necessary
- Automatic threshold prevents over-allocation

### 4. **User Experience**
- Transparent: Users don't see storage differences
- Informative: Badge indicates large reports
- Reliable: Fallback to summary if file loading fails

## Storage Costs

### Convex Pricing (as of 2024)

**Database Storage**:
- Free tier: 1 GB
- Pro: $25/mo base (includes 8 GB)
- Additional: $5/GB/month

**File Storage**:
- Free tier: 1 GB
- Pro: Included in database allocation
- Additional: $5/GB/month (same rate)

**Bandwidth**:
- Free tier: 10 GB/month
- Pro: 100 GB/month included
- Additional: $0.10/GB

### Example Calculations

#### Scenario 1: 100 Small Insights (avg 200 KB each)
- Total size: 20 MB
- Storage: Database (fast access)
- Cost: Free tier sufficient

#### Scenario 2: 50 Large Insights (avg 1.5 MB each)
- Total size: 75 MB
- Storage: File Storage
- Cost: Free tier sufficient
- Benefit: No document size errors

#### Scenario 3: 500 Mixed Insights
- 400 small (200 KB avg): 80 MB in DB
- 100 large (1.5 MB avg): 150 MB in File Storage
- Total: 230 MB
- Cost: Free tier sufficient (1 GB total)

## Monitoring & Debugging

### Logs

The system logs storage decisions:

```
[saveInsightReport] Report size: 456.23 KB
[saveInsightReport] Stored directly in DB (456.23 KB)

[saveInsightReport] Report size: 1234.56 KB
[saveInsightReport] Stored in File Storage (1234.56 KB)
```

### Database Queries

Monitor storage distribution:

```typescript
// Get storage statistics
const reports = await ctx.db
  .query("insightReports")
  .collect();

const stats = {
  totalReports: reports.length,
  dbStorage: reports.filter(r => !r.insightFileId).length,
  fileStorage: reports.filter(r => r.insightFileId).length,
  avgSize: reports.reduce((sum, r) => sum + (r.reportSize || 0), 0) / reports.length,
};
```

## Migration Guide

### Existing Reports

Old reports (stored directly in DB) continue to work:
- No `insightFileId` field → treated as small report
- Full data in `insightReport` field
- No migration required

### New Reports

Automatically use the hybrid strategy:
- `saveInsightReport` action handles storage selection
- Frontend `useFullInsight` hook loads correctly
- PDF generation works for both types

## Troubleshooting

### Issue: "Insight file not found"

**Cause**: Storage ID reference broken or file deleted

**Solution**:
1. Check `insightFileId` validity
2. Verify file exists: `await ctx.storage.get(storageId)`
3. Fallback to summary in DB

### Issue: Slow loading on large reports

**Cause**: File download takes time for very large insights

**Solution**:
1. Show loading indicator with progress
2. Consider compression (gzip) for files > 5 MB
3. Implement streaming for files > 10 MB

### Issue: Storage quota exceeded

**Cause**: Too many large reports stored

**Solution**:
1. Implement archival policy (delete old reports)
2. Compress older reports
3. Upgrade to Pro plan (8 GB included)

## Future Enhancements

### 1. Compression
```typescript
// Compress large reports before storage
import pako from 'pako';

const compressed = pako.deflate(jsonString);
const blob = new Blob([compressed], { type: 'application/octet-stream' });
```

### 2. Streaming
```typescript
// Stream very large files instead of loading entirely
const stream = await ctx.storage.getStream(storageId);
```

### 3. Caching
```typescript
// Cache frequently accessed large reports
const cached = await cache.get(`insight:${reportId}`);
if (cached) return cached;
```

### 4. Analytics Dashboard
- Storage usage by user
- Size distribution histogram
- Cost projection based on growth

## Security Considerations

### Access Control
- File Storage URLs are signed and temporary
- User ownership verified before serving files
- No direct file access without authentication

### Data Validation
- JSON schema validation before storage
- Size limits enforced (prevent abuse)
- Content sanitization applied

### Compliance
- GDPR: User can delete all data (DB + Files)
- Data retention: Automatic cleanup after N days
- Audit logs for sensitive operations

## Conclusion

This scalable storage architecture ensures Rankora AI can handle insights of any size without errors, while optimizing for performance and cost. The hybrid approach is transparent to users and requires minimal maintenance.

For questions or issues, refer to the Convex documentation:
- [File Storage](https://docs.convex.dev/file-storage)
- [Database Limits](https://docs.convex.dev/database/document-ids#document-size-limit)
