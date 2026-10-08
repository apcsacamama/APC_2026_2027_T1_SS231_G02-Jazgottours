"use client"

import React, { useState, useEffect } from 'react'
import { getPackages, addPackage, updatePackage, deletePackage } from '@/lib/actions/packages'

type TourPackage = {
  id: number
  title: string
  description: string
  destinations: number
  destination_details: string | null
  inclusions: string | null
  exclusions: string | null // <-- Added exclusions type
  original_price: number
  price: number
  image: string
}

export default function ProductsPage() {
  const [packages, setPackages] = useState<TourPackage[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinations: 5,
    destination_details: '',
    inclusions: '',
    exclusions: '', // <-- Added exclusions state
    original_price: 0,
    price: 0,
    image: ''
  })

  const fetchPackages = async () => {
    try {
      const data = await getPackages()
      setPackages((data || []) as TourPackage[])
    } catch (err) {
      console.error('Failed to fetch packages', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    getPackages()
      .then((data) => {
        if (!cancelled) setPackages((data || []) as TourPackage[])
      })
      .catch((error) => console.error('Failed to fetch packages', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ title: '', description: '', destinations: 5, destination_details: '', inclusions: '', exclusions: '', original_price: 0, price: 0, image: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (pkg: TourPackage) => {
    setEditingId(pkg.id)
    setFormData({
      title: pkg.title,
      description: pkg.description,
      destinations: pkg.destinations,
      destination_details: pkg.destination_details || '',
      inclusions: pkg.inclusions || '',
      exclusions: pkg.exclusions || '', // <-- Populated exclusions on edit
      original_price: pkg.original_price,
      price: pkg.price,
      image: pkg.image
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package? This will instantly remove it from the homepage.')) return
    
    try {
      await deletePackage(id)
      fetchPackages()
    } catch (err) {
      alert('Failed to delete package')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString())
    })

    try {
      if (editingId) {
        await updatePackage(editingId, data)
      } else {
        await addPackage(data)
      }
      
      setIsModalOpen(false)
      fetchPackages()
    } catch (err) {
      alert('Failed to save package')
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tour Packages</h1>
          <p className="text-slate-500">Manage packages displayed on the homepage.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Add Package
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Package' : 'Add New Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Package Title</label>
                <input 
                  type="text" required value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Tour A with Lunch"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₱)</label>
                  <input 
                    type="number" required value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Original Price (₱)</label>
                  <input 
                    type="number" required value={formData.original_price} 
                    onChange={(e) => setFormData({...formData, original_price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destinations</label>
                  <input 
                    type="number" required value={formData.destinations} 
                    onChange={(e) => setFormData({...formData, destinations: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image Path</label>
                  <input 
                    type="text" required value={formData.image} 
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="/tour-a.png"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} required
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination Details</label>
                <textarea
                  value={formData.destination_details}
                  onChange={(e) => setFormData({...formData, destination_details: e.target.value})}
                  placeholder="Enter one destination per line"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inclusions and Required Fees</label>
                <textarea
                  value={formData.inclusions}
                  onChange={(e) => setFormData({...formData, inclusions: e.target.value})}
                  placeholder="Enter one inclusion or required fee per line"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exclusions</label>
                <textarea
                  value={formData.exclusions}
                  onChange={(e) => setFormData({...formData, exclusions: e.target.value})}
                  placeholder="Enter one exclusion per line"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading packages...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Package Title</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Destinations</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Selling Price</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Original Price</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{pkg.title}</td>
                  <td className="p-4 text-slate-600">{pkg.destinations} spots</td>
                  <td className="p-4 font-semibold text-blue-600">₱{Number(pkg.price).toLocaleString()}</td>
                  <td className="p-4 text-slate-500 line-through">₱{Number(pkg.original_price).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditModal(pkg)}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}