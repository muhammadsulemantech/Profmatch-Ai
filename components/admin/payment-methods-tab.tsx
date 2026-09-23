'use client';

import React from 'react';
import { Wallet, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { PaymentMethod } from '@/types/database';

export interface PaymentMethodsTabProps {
  adminPaymentMethods: PaymentMethod[];
  isAddingMethod: boolean;
  setIsAddingMethod: (v: boolean) => void;
  editingMethod: PaymentMethod | null;
  setEditingMethod: (m: PaymentMethod | null) => void;
  methodForm: any;
  setMethodForm: (form: any) => void;
  saving: boolean;
  onSaveMethod: (e: React.FormEvent) => void;
  onToggleMethod: (method: PaymentMethod) => void;
  onDeleteMethod: (id: string, name: string) => void;
}

export function PaymentMethodsTab({
  adminPaymentMethods,
  isAddingMethod,
  setIsAddingMethod,
  editingMethod,
  setEditingMethod,
  methodForm,
  setMethodForm,
  saving,
  onSaveMethod,
  onToggleMethod,
  onDeleteMethod,
}: PaymentMethodsTabProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Admin-Controlled Payment Methods
            </h2>
            <p className="text-xs text-slate-400">
              Configure receiving accounts for Pakistan (JazzCash, Bank Transfer) and international channels (Stripe, PayPal). Changes reflect immediately in Customer Checkout without code deployments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMethodForm({
                name: '',
                type: 'mobile_wallet',
                country: 'Pakistan',
                currency: 'PKR',
                account_name: '',
                account_number: '',
                account_identifier: '',
                instructions: '',
                enabled: true,
                sort_order: adminPaymentMethods.length + 1,
              });
              setEditingMethod(null);
              setIsAddingMethod(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Payment Method
          </button>
        </div>

        {/* Add/Edit Form Modal / inline */}
        {(isAddingMethod || editingMethod) && (
          <form onSubmit={onSaveMethod} className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingMethod ? `Edit ${editingMethod.name}` : 'New Payment Method'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingMethod(false);
                  setEditingMethod(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Method Name</label>
                <input
                  type="text"
                  required
                  value={methodForm.name || ''}
                  onChange={e => setMethodForm({ ...methodForm, name: e.target.value })}
                  placeholder="e.g. JazzCash / Easypaisa"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                <select
                  value={methodForm.type || 'mobile_wallet'}
                  onChange={e => setMethodForm({ ...methodForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="crypto">Crypto</option>
                  <option value="other">Other / Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={methodForm.country || ''}
                  onChange={e => setMethodForm({ ...methodForm, country: e.target.value })}
                  placeholder="e.g. Pakistan or Global"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                <input
                  type="text"
                  required
                  value={methodForm.currency || ''}
                  onChange={e => setMethodForm({ ...methodForm, currency: e.target.value.toUpperCase() })}
                  placeholder="e.g. PKR or USD"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Title / Name</label>
                <input
                  type="text"
                  required
                  value={methodForm.account_name || ''}
                  onChange={e => setMethodForm({ ...methodForm, account_name: e.target.value })}
                  placeholder="e.g. Suleman Khan"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / Phone</label>
                <input
                  type="text"
                  required
                  value={methodForm.account_number || ''}
                  onChange={e => setMethodForm({ ...methodForm, account_number: e.target.value })}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={methodForm.instructions || ''}
                  onChange={e => setMethodForm({ ...methodForm, instructions: e.target.value })}
                  placeholder="Transfer fee to this account and upload your receipt screenshot..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingMethod(false);
                  setEditingMethod(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Method'}
              </button>
            </div>
          </form>
        )}

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminPaymentMethods.map(m => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                m.enabled ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-950/40 border-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {m.type}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">
                    {m.country} &bull; {m.currency}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleMethod(m)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      m.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase">Account Title:</span>
                  <span className="text-white font-bold">{m.account_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase">Account Number:</span>
                  <span className="text-emerald-400 font-bold">{m.account_number}</span>
                </div>
                {m.account_identifier && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] uppercase">Identifier / IBAN:</span>
                    <span className="text-slate-300">{m.account_identifier}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                {m.instructions}
              </p>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setMethodForm({
                      name: m.name,
                      type: m.type,
                      country: m.country,
                      currency: m.currency,
                      account_name: m.account_name,
                      account_number: m.account_number,
                      account_identifier: m.account_identifier || '',
                      instructions: m.instructions,
                      enabled: m.enabled,
                      sort_order: m.sort_order,
                    });
                    setEditingMethod(m);
                    setIsAddingMethod(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteMethod(m.id, m.name)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
