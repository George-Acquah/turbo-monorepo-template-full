// Explicit return-typing for query methods that return Mongoose lean()
// results. Needed because tsc's declaration-emit can't name the deep
// Query<>/mongodb-driver generic types Mongoose infers for exported public
// methods ("cannot be named without a reference to ..."); this loose shape
// sidesteps that while still giving the converter a typed `_id` to work with.
export type LeanRecord = Record<string, unknown> & { _id: string };
