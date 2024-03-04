import { TinySynq } from "./tinysynq.class.js";
import { TinySynqOptions } from "./types.js";
/**
 * Returns a configured instance of TinySynq
 *
 * @param config - Configuration object
 * @returns TinySynq instance
 *
 * @public
 */
declare const setupDatabase: (config: TinySynqOptions) => Promise<TinySynq>;
export default setupDatabase;
