import { SWRConfiguration } from 'swr';
import { swrConfig as enhancedSwrConfig } from './swr-fetcher';

// Export the enhanced SWR configuration as the default
export default enhancedSwrConfig;

// Keep the fetcher function for backward compatibility
export { fetcher } from './swr-fetcher';

// Type for the SWR configuration
export type SwrConfig = SWRConfiguration;