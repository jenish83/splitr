"use client";

import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";

export const useConvexQuery = (query, ...args) => {
  const result = useQuery(query, ...args);

  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return { data, isLoading, error };
};

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);

  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...mutateArgs) => {
    try {
      setIsLoading(true);
      const response = await mutationFn(...mutateArgs);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};