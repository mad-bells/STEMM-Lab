import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getUnsyncedResults, markResultSynced } from './database';
import { submitResult } from './firebase';

export const SYNC_TASK = 'STEMM_SYNC_TASK';

TaskManager.defineTask(SYNC_TASK, async () => {
  try {
    const unsynced = getUnsyncedResults();
    if (unsynced.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;
    await Promise.all(
      unsynced.map(async (row) => {
        await submitResult(row.teamId, row.activityId, {
          ...JSON.parse(row.data), score: row.score,
          latitude: row.latitude, longitude: row.longitude,
        });
        markResultSynced(row.id);
      })
    );
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Background sync failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    await BackgroundFetch.registerTaskAsync(SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    console.log('Background task registration:', err.message);
  }
}