"use client";

import { useState } from "react";
import { CreditCard, Save, RefreshCcw, Info } from "lucide-react";
import { updateCardFeeSetting } from "@/app/actions/finance";

export function SettingsTab({ initialSettings }: { initialSettings: any[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState<number | null>(null);

  const handleUpdate = async (installments: number, fee: string) => {
    const feeValue = parseFloat(fee);
    if (isNaN(feeValue)) return;

    setIsSaving(installments);
    const res = await updateCardFeeSetting(installments, feeValue);
    if (res.success) {
      setSettings(settings.map(s => s.installments === installments ? { ...s, fee_percent: feeValue } : s));
    } else {
      alert("Erro ao salvar taxa: " + res.error);
    }
    setIsSaving(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Taxas de Cartão de Crédito</h2>
            <p className="text-sm text-slate-700">Configure as taxas cobradas pela sua maquininha/operadora para cada parcelamento.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.map((s) => (
            <div key={s.installments} className={`p-4 rounded-xl border border-slate-100 flex flex-col justify-between ${s.installments === 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-sm font-bold ${s.installments === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {s.installments === 0 ? 'Cartão de Débito' : s.installments === 1 ? '1x (À Vista)' : `${s.installments}x Sem Juros`}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {s.installments === 0 ? 'Débito' : 'Crédito'}
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  className={`w-full pl-4 pr-12 py-3 rounded-lg border focus:ring-2 outline-none font-mono font-bold ${
                    s.installments === 0 
                      ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-600' 
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-700'
                  }`}
                  defaultValue={s.fee_percent}
                  onBlur={(e) => handleUpdate(s.installments, e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">%</span>
              </div>

              {isSaving === s.installments && (
                <p className="text-[10px] text-emerald-600 font-bold mt-2 animate-pulse flex items-center gap-1">
                  <RefreshCcw className="w-3 h-3 animate-spin" /> Salvando alteração...
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Como isso afeta o sistema?</p>
            <p>Sempre que você registrar um pagamento via <b>Cartão de Crédito</b> e informar as parcelas, o sistema usará esses percentuais para:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Calcular o valor líquido que entrará no seu banco.</li>
              <li>Lançar automaticamente o valor da taxa como uma despesa administrativa.</li>
              <li>Garantir que seu lucro real no Dashboard seja calculado corretamente.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
