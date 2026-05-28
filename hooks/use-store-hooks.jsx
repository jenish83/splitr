import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user, isLoaded } = useUser();
  // When this state is set we know the server
  // has stored the user.
  const [userId, setUserId] = useState(null);
  const storeUser = useMutation(api.users.store);
  // Call the `storeUser` mutation function to store
  // the current user in the `users` table and return the `Id` value.
  useEffect(() => {
    // If the user is not logged in don't do anything
    if (!isAuthenticated) {
      return;
    }
    // Wait until Clerk has loaded the user profile.
    if (!isLoaded) {
      return;
    }

    const email = user?.primaryEmailAddress?.emailAddress;
    const joined = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    const emailLocalPart = email?.split("@")?.[0]?.trim();
    // Prefer explicit Clerk profile name; otherwise fall back to username, then email local-part.
    // (Many Clerk accounts don't have first/last set.)
    const derivedName = (
      user?.fullName ??
      (joined.length > 0 ? joined : undefined) ??
      user?.username ??
      (emailLocalPart && emailLocalPart.length > 0 ? emailLocalPart : undefined) ??
      undefined
    )?.trim();
    // Store the user in the database.
    // Recall that `storeUser` gets the user information via the `auth`
    // object on the server. You don't need to pass anything manually here.
    async function createUser() {
      const id = await storeUser({
        name: derivedName,
        email,
        imageUrl: user?.imageUrl ?? undefined,
      });
      setUserId(id);
    }
    createUser();
    return () => setUserId(null);
    // Make sure the effect reruns if the user logs in with
    // a different identity
  }, [isAuthenticated, isLoaded, storeUser, user?.id]);
  // Combine the local state with the state from context
  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}