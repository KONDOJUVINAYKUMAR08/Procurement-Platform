import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatDate } from '../../lib/utils';
import { Plus, Search, Receipt, CheckCircle, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor: '', amount: 0, tax: 0, dueDate: '', description: '', purchaseOrder: '', contract: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: () => invoiceApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: vendorsData } = useQuery({ queryKey: ['vendors-list'], queryFn: () => vendorApi.getAll({ limit: 100 }) });
  const vendors = vendorsData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowCreate(false); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.markAsPaid(id, 'Wire Transfer'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const invoices = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Invoices</h1><p className="page-description">Manage invoices and track payments</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Invoice</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input type="text" placeholder="Search invoices..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Status</option>
          <option value="pending" className="bg-black">Pending</option>
          <option value="approved" className="bg-black">Approved</option>
          <option value="paid" className="bg-black">Paid</option>
          <option value="overdue" className="bg-black">Overdue</option>
          <option value="disputed" className="bg-black">Disputed</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Due Date</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={6} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : invoices.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-neutral-500"><Receipt size={32} className="mx-auto mb-2 opacity-50" />No invoices found</td></tr>
              : invoices.map((inv: any) => (
                <tr key={inv._id} className="table-row">
                  <td className="px-6 py-4"><p className="text-sm font-mono font-medium text-white">{inv.invoiceNumber}</p><p className="text-xs text-neutral-500 truncate max-w-40">{inv.description}</p></td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{typeof inv.vendor === 'object' ? inv.vendor?.vendorName : inv.vendor}</td>
                  <td className="px-6 py-4"><p className="text-sm font-medium text-white">{formatCurrency(inv.totalAmount)}</p><p className="text-xs text-neutral-500">{formatCurrency(inv.amount)} + {formatCurrency(inv.tax)} tax</p></td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(inv.dueDate)}</td>
                  <td className="px-6 py-4"><span className={getStatusBadgeClass(inv.status)}>{inv.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {inv.status === 'pending' && <button onClick={() => approveMutation.mutate(inv._id)} className="p-1.5 rounded hover:bg-white/5 text-emerald-400" title="Approve"><CheckCircle size={14} /></button>}
                      {inv.status === 'approved' && <button onClick={() => payMutation.mutate(inv._id)} className="p-1.5 rounded hover:bg-white/5 text-blue-400" title="Mark Paid"><DollarSign size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">{pagination.total} results</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p+1)} disabled={page>=pagination.totalPages} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]"><h2 className="text-lg font-semibold">New Invoice</h2></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div><label className="block text-sm text-neutral-300 mb-1">Vendor *</label>
                <select required value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} className="input-field">
                  <option value="" className="bg-black">Select vendor</option>
                  {vendors.map((v: any) => <option key={v._id} value={v._id} className="bg-black">{v.vendorName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Amount *</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Tax</label><input type="number" value={form.tax} onChange={e => setForm({...form, tax: Number(e.target.value)})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Due Date *</label><input required type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
