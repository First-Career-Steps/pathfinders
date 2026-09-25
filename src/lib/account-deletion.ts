/** No provider credentials here. The API injects server-only, owner-scoped operations. */
export interface DeletionAsset { bucket_id: string; name: string }
export interface DeletionSteps {
  restrictAccount: () => Promise<void>;
  cancelBilling: () => Promise<void>;
  listAssets: () => Promise<DeletionAsset[]>;
  removeAssets: (bucket: string, names: string[]) => Promise<void>;
  purgeLinkedLogs: () => Promise<void>;
  deleteIdentity: () => Promise<void>;
}

export async function runAccountDeletion(steps: DeletionSteps): Promise<void> {
  // Fail closed: never remove the identity while billing or file cleanup has failed.
  // Successful earlier steps are safe to repeat when a user retries.
  await steps.restrictAccount();
  await steps.cancelBilling();
  for (let batch = 0; batch < 200; batch++) {
    const assets = await steps.listAssets();
    if (!assets.length) {
      await steps.purgeLinkedLogs();
      await steps.deleteIdentity();
      return;
    }
    const buckets = new Map<string, string[]>();
    for (const asset of assets) {
      const names = buckets.get(asset.bucket_id) || [];
      names.push(asset.name);
      buckets.set(asset.bucket_id, names);
    }
    for (const [bucket, names] of buckets) await steps.removeAssets(bucket, names);
  }
  throw new Error('File cleanup needs another attempt');
}
