import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/hooks/SupabaseAuthProvider'
import { uploadInvoicePdf, listInvoices, getPublicUrl, removeFile } from '@/utils/supabaseStorage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function StorageTest() {
  const [params] = useSearchParams()
  const org = params.get('org') ?? 'rohit'
  const { user } = useAuthContext()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  async function refreshList() {
    try {
      const data = await listInvoices(org)
      setItems(data ?? [])
    } catch (e: any) {
      alert(e.message || 'Failed to list files')
    }
  }

  useEffect(() => { refreshList() }, [org])

  async function handleUpload() {
    if (!selectedFile) return alert('Select a PDF first')
    setUploading(true)
    try {
      const invoiceId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now())
      await uploadInvoicePdf(org, invoiceId, selectedFile)
      await refreshList()
      alert('Uploaded')
    } catch (e: any) {
      alert(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(name: string) {
    try {
      // name is expected to be the file name relative to prefix
      const invoiceId = name.replace(/\.pdf$/i, '')
      await removeFile(org, invoiceId)
      await refreshList()
    } catch (e: any) {
      alert(e.message || 'Delete failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold">Storage test</h2>
      <p className="text-sm text-muted-foreground">Signed in as: {user?.email ?? 'unknown'}</p>
      <p className="text-sm">Org: <strong>{org}</strong></p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <Input type="file" accept="application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
        <div className="md:col-span-2 flex gap-2">
          <Button onClick={handleUpload} disabled={uploading || !selectedFile}>{uploading ? 'Uploading…' : 'Upload PDF'}</Button>
          <Button variant="outline" onClick={refreshList}>Refresh</Button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium">Files</h3>
        {items.length === 0 && <div className="text-sm text-muted-foreground">No files found</div>}
        <ul className="mt-2 space-y-2">
          {items.map((it: any) => {
            // supabase returns name relative to prefix when listing with prefix
            const name = it.name || it.id || ''
            const invoiceId = name.replace(/\.pdf$/i, '')
            const publicUrl = getPublicUrl(org, invoiceId)
            return (
              <li key={name} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <div className="font-medium">{name}</div>
                  <a className="text-xs text-blue-600" href={publicUrl} target="_blank" rel="noreferrer">Open public URL</a>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => window.open(publicUrl, '_blank')}>Open</Button>
                  <Button variant="destructive" onClick={() => handleRemove(name)}>Delete</Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
