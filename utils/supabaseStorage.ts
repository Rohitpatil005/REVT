import supabase from './supabase'

const bucketName = 'invoices'

export async function uploadInvoicePdf(orgId: string, invoiceId: string, file: File) {
  const path = `${orgId}/invoices/${invoiceId}.pdf`
  const { data, error } = await supabase.storage.from(bucketName).upload(path, file, { upsert: true })
  if (error) throw error
  return data
}

export function getPublicUrl(orgId: string, invoiceId: string) {
  const path = `${orgId}/invoices/${invoiceId}.pdf`
  return supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl
}

export async function removeFile(orgId: string, invoiceId: string) {
  const path = `${orgId}/invoices/${invoiceId}.pdf`
  const { error } = await supabase.storage.from(bucketName).remove([path])
  if (error) throw error
  return true
}

export async function listInvoices(orgId: string) {
  const prefix = `${orgId}/invoices/`
  const { data, error } = await supabase.storage.from(bucketName).list(prefix)
  if (error) throw error
  return data
}
