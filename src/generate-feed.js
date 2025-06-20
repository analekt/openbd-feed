import { FeedUpdater } from './feed-updater.js';

async function main() {
  try {
    const updater = new FeedUpdater();
    await updater.updateAllFeeds();
    console.log('Feed generation completed successfully');
  } catch (error) {
    console.error('Feed generation failed:', error);
    process.exit(1);
  }
}

main();