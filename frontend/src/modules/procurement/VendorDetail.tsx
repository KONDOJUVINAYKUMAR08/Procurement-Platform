import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatRelativeTime } from '../../lib/utils';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Star, Clock, Edit2, Trash2 } from 'lucide-react';

const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => vendorApi.delete(id!),
    onSuccess: () => navigate('/vendors'),
  });

  const vendor = data?.data?.data;

  if (isLoading) return <div className="space-y-4"><div className="loading-skeleton h-48 rounded-xl" /><div className="loading-skeleton h-64 rounded-xl" /></div>;
  if (!vendor) return <div className="empty-state py-20"><p>Vendor not found</p></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vendors')} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{vendor.vendorName}</h1>
              <span className={getStatusBadgeClass(vendor.status)}>{vendor.status}</span>
            </div>
            <p className="text-sm text-neutral-500 font-mono">{vendor.vendorCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-2"><Edit2 size={14} /> Edit</button>
          <button onClick={() => deleteMutation.mutate()} className="btn-ghost text-red-400 hover:text-red-300 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="section-title">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Building2 size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Contact Person</p><p className="text-sm text-white">{vendor.contactPerson}</p></div></div>
            <div className="flex items-center gap-3"><Mail size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Email</p><p className="text-sm text-white">{vendor.email}</p></div></div>
            <div className="flex items-center gap-3"><Phone size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Phone</p><p className="text-sm text-white">{vendor.phone}</p></div></div>
            <div className="flex items-start gap-3"><MapPin size={16} className="text-neutral-500 mt-0.5" /><div><p className="text-xs text-neutral-500">Address</p><p className="text-sm text-white">{vendor.address?.street}, {vendor.address?.city}, {vendor.address?.state} {vendor.address?.zipCode}</p><p className="text-sm text-neutral-400">{vendor.address?.country}</p></div></div>
          </div>
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">Rating</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={16} className={s <= Math.round(vendor.rating) ? 'text-white fill-white' : 'text-neutral-700'} />)}
              <span className="text-sm text-neutral-400 ml-2">{vendor.rating}/5</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title">Activity Timeline</h3>
          <div className="space-y-4 mt-4">
            {(vendor.activities || []).map((activity: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white/20 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-white">{activity.description}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1"><Clock size={10} /> {formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
            {(!vendor.activities || vendor.activities.length === 0) && <p className="text-sm text-neutral-500">No activity recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
