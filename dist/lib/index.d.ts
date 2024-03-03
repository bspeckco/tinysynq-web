import { SynQLite } from "./synqlite.class.js";
import { SynQLiteOptions } from "./types.js";
/**
 * Returns a configured instance of SynQLite
 *
 * @param config - Configuration object
 * @returns SynQLite instance
 *
 * @public
 */
declare const setupDatabase: (config: SynQLiteOptions) => Promise<SynQLite>;
export default setupDatabase;
