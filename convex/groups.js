import { internal } from "./_generated/api";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getGroupExpenses = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    if (!group.members.some((m) => m.userId === currentUser._id))
      throw new Error("You are not a member of this group");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // members map
    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return u
          ? {
              userId: u._id,
              name: u.name,
              imageUrl: u.imageUrl,
              role: m.role,
            }
          : null;
      }),
    );

    // one the most important part of the Logic serctions
    const ids = memberDetails.filter(Boolean).map((m) => m.userId);
    // Balance calculation setup
    //--------------------------
    // Initialize totals objects to track overall balance for each users
    // Format : {userId1:balance1, userId2:balance2, ...}

    const totals = Object.fromEntries(ids.map((id) => [id, 0]));
    // create a two-diamentional ledger to track who owes who how much
    // ledger[A][B] = how much A owes B
    // for Example if we have 3 users (user1,user2,user3)
    // ledger would look like this:
    // ledger = {
    //    "user1": {"user2":0, "user3":0},
    //    "user2": {"user1":0, "user3":0},
    //    "user3": {"user1":0, "user2":0},
    //}
    const ledger = {};
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0; // no self-loans
      });
    });
    // Apply Expenses to Balances
    // ------------------------
    //
    // Example:
    // - Expense 1: user1 paid $60, split equally among all 3 users ($20 each)
    // - After applying this expense:
    //
    //   - totals = { "user1": +40, "user2": -20, "user3": -20 }
    //
    //   - ledger = {
    //       "user1": { "user2": 0, "user3": 0 },
    //       "user2": { "user1": 20, "user3": 0 },
    //       "user3": { "user1": 20, "user2": 0 }
    //     }
    //
    // - This means user2 owes user1 $20, and user3 owes user1 $20

    for (const exp of expenses) {
      const payer = exp.paidByUserId;

      for (const split of exp.splits) {
        // skip if this is the payer or already paid
        if (split.userId === payer || split.paid) continue;

        const debtor = split.userId;
        const amt = split.amount;

        // update totals: increase payer's balance and decrease debtor's balance
        totals[payer] = totals[payer] + amt; // payer gets money
        totals[debtor] = totals[debtor] - amt; // debtor owes money

        ledger[debtor][payer] += amt; // debtor owes money to payer
      }
    }

    // Apply Settlements to Balances
    // ---------------------------
    // Example:
    // - Settlement: user2 paid $10 to user1
    // - After applying this settlement:
    //   - totals = { "user1": +30, "user2": -10, "user3": -20 }
    //   - ledger = {
    //       "user1": { "user2": 0, "user3": 0 },
    //       "user2": { "user1": 10, "user3": 0 },
    //       "user3": { "user1": 20, "user2": 0 }
    //     }
    //   - This means user2 now owes user1 only $10, and user3 still owes user1 $20

    for (const s of settlements) {
      // Update totals: increase payer's balance, decrease receiver's balance
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;

      // Update ledger: reduce what the payer owes to the receiver
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    // Simplify the Ledger (Debt Simplification)
    // -----------------------------------------
    // Example with a circular debt:
    // - Initial ledger:
    //   - user1 owes user2 $10
    //   - user2 owes user3 $15
    //   - user3 owes user1 $5
    //
    // - After simplification:
    //   - user1 owes user2 $5
    //   - user2 owes user3 $15
    //   - user3 owes user1 $0
    //
    // This reduces the circular debt pattern

    for (let i = 0; i < ids.length; i++) {
      const a = ids[i];
      for (let j = i + 1; j < ids.length; j++) {
        const b = ids[j];

        // Net debt between a and b (positive => a owes b)
        const diff = ledger[a][b] - ledger[b][a];

        if (diff > 0) {
          // if a owes b more than b owes a, then a owes b the difference
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          // if b owes a more than a owes b, then b owes a the difference
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          // if a owes b and b owes a the same amount, then they are settled up
          ledger[a][b] = 0;
          ledger[b][a] = 0;
        }
      }
    }

    const balances = memberDetails.filter(Boolean).map((m) => ({
      ...m,
      totalBalance: totals[m.userId],
      owed: Object.entries(ledger[m.userId] ?? {})
        .filter(([, amount]) => amount > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => (ledger[other]?.[m.userId] ?? 0) > 0)
        .map((other) => ({ from: other, amount: ledger[other][m.userId] })),
    }));

    const userLookupMap = {};
    memberDetails.filter(Boolean).forEach((m) => {
      userLookupMap[m.userId] = m;
    });

    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails, // All group members with details
      expenses, // All expenses for the group
      settlements, // All settlements for the group
      balances, // All balances for the group
      userLookupMap, // A map of user IDs to their detailed information
    };
  },
});

export const getGroupOrMembers = query({
    args: {
      groupId: v.optional(v.id("groups")), // Optional - if provided, will return details for just this group
    },
    handler: async (ctx, args) => {
      // Use centralized getCurrentUser function
      const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
  
      // Get all groups where the user is a member
      const allGroups = await ctx.db.query("groups").collect();
      const userGroups = allGroups.filter((group) =>
        group.members.some((member) => member.userId === currentUser._id)
      );
  
      // If a specific group ID is provided, only return details for that group
      if (args.groupId) {
        const selectedGroup = userGroups.find(
          (group) => group._id === args.groupId
        );
  
        if (!selectedGroup) {
          throw new Error("Group not found or you're not a member");
        }
  
        // Get all user details for this group's members
        const memberDetails = await Promise.all(
          selectedGroup.members.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            if (!user) return null;
  
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              role: member.role,
            };
          })
        );
  
        // Filter out any null values (in case a user was deleted)
        const validMembers = memberDetails.filter((member) => member !== null);
  
        // Return selected group with member details
        return {
          selectedGroup: {
            id: selectedGroup._id,
            name: selectedGroup.name,
            description: selectedGroup.description,
            createdBy: selectedGroup.createdBy,
            members: validMembers,
          },
          groups: userGroups.map((group) => ({
            id: group._id,
            name: group.name,
            description: group.description,
            memberCount: group.members.length,
          })),
        };
      } else {
        // Just return the list of groups without member details
        return {
          selectedGroup: null,
          groups: userGroups.map((group) => ({
            id: group._id,
            name: group.name,
            description: group.description,
            memberCount: group.members.length,
          })),
        };
      }
    },
  });

