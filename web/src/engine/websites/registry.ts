import * as websites from './_index';

/**
 * Central registry of all production website scraper constructors.
 *
 * This keeps plugin discovery in one place without changing the current
 * synchronous loading behavior. A later refactor can replace individual
 * constructors with asynchronous loaders without changing PluginController.
 */
export const WebsiteRegistry = Object.freeze(
    Object.values(websites)
);
