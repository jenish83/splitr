"use client"

import React, { useState } from 'react'
import { api } from '../../../convex/_generated/api';
import { BarLoader } from 'react-spinners';
import { Button } from '@/components/ui/button';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { PlusIcon, User, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateGroupModal } from './_components/create-group-modal';
import { useRouter } from 'next/navigation';

const ContactsPage = () => {

  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const router = useRouter();

  const {data, isLoading, error} = useConvexQuery(api.contacts.getAllContacts);
  if(isLoading){
    return (
      <div className='flex items-center justify-center h-full'>
        <BarLoader
          width={"100%"}
          color="#36d7b7"
          className='text-center'
        />
      </div>
    )
  }
  const {users, groups} = data || { users:[], groups:[]};

  return (
    <div className="container mx-auto md:p-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl gradient-title">Contacts</h1>
        <Button onClick={() => setIsCreateGroupModalOpen(true)}>
          <PlusIcon className="size-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <User className="h-5 w-5 shrink-0" />
            People
          </h2>
          {users.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet. Add an expense with someone to start tracking expenses.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user) => (
                <Link key={user.id} href={`/persons/${user.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.imageUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-5 w-5 shrink-0" />
            Groups
          </h2>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet. Add an expense with someone to start tracking expenses.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={group.imageUrl} alt={group.name} />   
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => {
          router.push(`/groups/${groupId}`);
        }}
      />

    </div>
  )
}

export default ContactsPage
