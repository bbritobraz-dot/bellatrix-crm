"use client";

export function BankAccountSelect({
  accounts,
  value,
  onChange,
  required = false,
}: {
  accounts: any[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Conta Bancária {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
      >
        <option value="">Selecione uma conta...</option>
        {accounts.map(a => (
          <option key={a.id} value={a.id}>
            {a.bank_name}{a.account_label ? ` — ${a.account_label}` : ""} (R$ {Number(a.balance).toFixed(2)})
          </option>
        ))}
      </select>
      {accounts.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">⚠️ Cadastre uma conta bancária no Painel para conciliação.</p>
      )}
    </div>
  );
}
