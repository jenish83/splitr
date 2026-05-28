import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  })
  .index("by_token", ["tokenIdentifier"])
  .index("by_email", ["email"])
  .searchIndex("search_index", { searchField: "name" })
  .searchIndex("search_index_email", { searchField: "email" }),

});