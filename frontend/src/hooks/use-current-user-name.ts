import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data, error } = await createClient().auth.getSession()
      if (error) {
        console.error(error)
      }
      const firstName = data.session?.user.user_metadata.first_name
      const lastName = data.session?.user.user_metadata.last_name
      if(firstName && lastName) {
        setName(firstName + ' ' + lastName)
      } else {
        setName(null)
      }
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
