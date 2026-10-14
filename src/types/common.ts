// src/types/common.ts - Common utility types
// These are general TypeScript utility types used throughout the project

/**
 * Makes a type nullable (T | null)
 */
export type Nullable<T> = T | null;

/**
 * Makes a type optional (T | undefined)
 */
export type Optional<T> = T | undefined;

/**
 * A record where all values are optional
 */
export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required keys with optional values
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Pick only specific keys
 */
export type PickKeys<T, K extends keyof T> = Pick<T, K>;

/**
 * Omit specific keys
 */
export type OmitKeys<T, K extends keyof T> = Omit<T, K>;

/**
 * Extract the type of a promise's resolved value
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/**
 * Extract the type of an array's elements
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Merge two types
 */
export type Merge<T, U> = Omit<T, keyof U> & U;