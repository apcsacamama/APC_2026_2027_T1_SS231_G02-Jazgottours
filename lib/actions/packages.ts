'use server'

import { supabase } from '@/lib/supabase' 
import { revalidatePath } from 'next/cache'

export async function getPackages() {
  const { data, error } = await supabase.from('packages').select('*').order('id', { ascending: true })
  
  if (error) throw new Error(error.message)
  return data
}

export async function addPackage(formData: FormData) {
  const newPackage = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    destinations: formData.get('destinations') as string,
    destination_details: formData.get('destination_details') as string,
    inclusions: formData.get('inclusions') as string,
    exclusions: formData.get('exclusions') as string, // <-- Added exclusions here
    original_price: Number(formData.get('original_price')),
    price: Number(formData.get('price')),
    image: formData.get('image') as string,
  }

  const { error } = await supabase.from('packages').insert(newPackage)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export async function updatePackage(id: number, formData: FormData) {
  const updatedData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    destinations: formData.get('destinations') as string,
    destination_details: formData.get('destination_details') as string,
    inclusions: formData.get('inclusions') as string,
    exclusions: formData.get('exclusions') as string, // <-- Added exclusions here
    original_price: Number(formData.get('original_price')),
    price: Number(formData.get('price')),
    image: formData.get('image') as string,
  }

  const { error } = await supabase.from('packages').update(updatedData).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export async function deletePackage(id: number) {
  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}