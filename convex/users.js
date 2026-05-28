import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before.
    // Note: If you don't want to define an index right away, you can use
    // ctx.db.query("users")
    //  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
    //  .unique();
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      const patch = {};

      const argName = args.name?.trim();
      const identityName = identity.name?.trim();
      const nextName = (argName && argName.length > 0 ? argName : undefined) ??
        (identityName && identityName.length > 0 ? identityName : undefined) ??
        "Anonymous";
      if (user.name !== nextName) patch.name = nextName;

      const nextEmail = args.email ?? identity.email;
      if (nextEmail && user.email !== nextEmail) patch.email = nextEmail;

      const nextImageUrl = args.imageUrl ?? identity.pictureUrl;
      if (nextImageUrl && user.imageUrl !== nextImageUrl) patch.imageUrl = nextImageUrl;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
      }
      return user._id;
    }
    // If it's a new identity, create a new `User`.
    const now = Date.now();
    const doc = {
      name:
        (args.name?.trim() ? args.name.trim() : undefined) ??
        (identity.name?.trim() ? identity.name.trim() : undefined) ??
        "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
    };

    const email = args.email ?? identity.email;
    if (email) doc.email = email;

    const imageUrl = args.imageUrl ?? identity.pictureUrl;
    if (imageUrl) doc.imageUrl = imageUrl;

    return await ctx.db.insert("users", doc);
  },
});