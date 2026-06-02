"use client";

import React, { useState } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import { constructFrom } from "date-fns/constructFrom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PersonPage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id },
  );

  if (isLoading)
    return (
      <div className="w-full py-6 space-y-6">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="w-full py-6 space-y-6">
      <div className="mb-6">
        
        <Button
          variant="outline"
          // router.back() is a function that goes back to the previous page
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>


        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={otherUser.imageUrl} />
              <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser.name}</h1>
              <p className="text-sm text-muted-foreground">
                {otherUser.email || "No email available"}
              </p>
            </div>
          </div>





        </div>
      </div>
    </div>
  );
};

export default PersonPage;
