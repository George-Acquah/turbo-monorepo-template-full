// No query extensions registered yet. The likeliest future need is a
// soft-delete-aware read helper (User.deletedAt), but nothing in the current
// auth ports requires it — findByEmail/findByPhone are used for login, where
// excluding deactivated accounts is already handled by the UserStatus check,
// not a blanket deletedAt filter. Add real logic here when a concrete use
// case needs it.
export {};
