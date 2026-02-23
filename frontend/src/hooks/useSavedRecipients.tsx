import { useState, useEffect } from 'react'

interface SavedRecipient {
  id: string
  name: string
  officeId: string
  officeName: string
}

const STORAGE_KEY = 'saved_recipients'

export function useSavedRecipients() {
  const [recipients, setRecipients] = useState<SavedRecipient[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setRecipients(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved recipients:', e)
      }
    }
  }, [])

  const saveRecipient = (name: string, officeId: string, officeName: string) => {
    const newRecipient: SavedRecipient = {
      id: Date.now().toString(),
      name,
      officeId,
      officeName,
    }
    const updated = [...recipients, newRecipient]
    setRecipients(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const deleteRecipient = (id: string) => {
    const updated = recipients.filter((r) => r.id !== id)
    setRecipients(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return { recipients, saveRecipient, deleteRecipient }
}
