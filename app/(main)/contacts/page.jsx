import React from 'react'
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { BarLoader } from 'react-spinners';

const ContactsPage = () => {

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

  return <div>
    <div>
      
    </div>
  </div>


  return (
    <div>
      Contacts Page
    </div>
  )
}

export default ContactsPage
