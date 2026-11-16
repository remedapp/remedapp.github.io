import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Send,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { MedicationItem, PharmacyItem, UserHealthProfile } from '../types';

interface PharmaciesTabViewProps {
  pharmacies: PharmacyItem[];
  medications: MedicationItem[];
  profile: UserHealthProfile;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSavePharmacy: (pharmacy: PharmacyItem) => void;
  onDeletePharmacy: (id: string) => void;
}

interface OrderLine {
  key: string;
  name: string;
  quantity: string;
  fromRegistered: boolean;
}

function formatWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export const PharmaciesTabView: React.FC<PharmaciesTabViewProps> = ({
  pharmacies,
  medications,
  profile,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  onSavePharmacy,
  onDeletePharmacy,
}) => {
  // Pharmacy CRUD modal state
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyItem | null>(
    null
  );
  const [pName, setPName] = useState('');
  const [pWhatsapp, setPWhatsapp] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pHours, setPHours] = useState('');
  const [pDelivers, setPDelivers] = useState(true);
  const [pNotes, setPNotes] = useState('');

  // Order builder state
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacies[0]?.id ?? ''
  );
  const [selectedMeds, setSelectedMeds] = useState<Record<string, string>>({});
  const [customMeds, setCustomMeds] = useState<OrderLine[]>([]);
  const [customMedName, setCustomMedName] = useState('');
  const [customMedQty, setCustomMedQty] = useState('1 caixa');

  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>(
    'delivery'
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [includeAllergies, setIncludeAllergies] = useState(true);
  const [extraObs, setExtraObs] = useState('');
  const [customMessageOverride, setCustomMessageOverride] = useState<
    string | null
  >(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Keep selectedPharmacyId valid when list changes
  useEffect(() => {
    if (
      pharmacies.length > 0 &&
      !pharmacies.some((p) => p.id === selectedPharmacyId)
    ) {
      setSelectedPharmacyId(pharmacies[0].id);
    } else if (pharmacies.length === 0) {
      setSelectedPharmacyId('');
    }
  }, [pharmacies, selectedPharmacyId]);

  useEffect(() => {
    if (isModalOpen && !editingPharmacy) {
      setPName('');
      setPWhatsapp('');
      setPPhone('');
      setPAddress('');
      setPHours('');
      setPDelivers(true);
      setPNotes('');
    }
  }, [isModalOpen, editingPharmacy]);

  const openCreateModal = () => {
    setEditingPharmacy(null);
    onOpenModal();
  };

  const openEditModal = (pharmacy: PharmacyItem) => {
    setEditingPharmacy(pharmacy);
    setPName(pharmacy.name);
    setPWhatsapp(pharmacy.whatsapp);
    setPPhone(pharmacy.phone || '');
    setPAddress(pharmacy.address);
    setPHours(pharmacy.openingHours || '');
    setPDelivers(pharmacy.delivers);
    setPNotes(pharmacy.notes || '');
    onOpenModal();
  };

  const handleSavePharmacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    const item: PharmacyItem = {
      id: editingPharmacy ? editingPharmacy.id : `pharm-${Date.now()}`,
      name: pName.trim(),
      whatsapp: pWhatsapp.trim(),
      phone: pPhone.trim() || undefined,
      address: pAddress.trim(),
      openingHours: pHours.trim() || undefined,
      delivers: pDelivers,
      notes: pNotes.trim() || undefined,
    };

    onSavePharmacy(item);
    setSelectedPharmacyId(item.id);
    setEditingPharmacy(null);
    onCloseModal();
  };

  const registeredMeds = useMemo(
    () => medications.filter((m) => m.type === 'medication'),
    [medications]
  );

  const toggleRegisteredMed = (med: MedicationItem) => {
    setCustomMessageOverride(null);
    setSelectedMeds((prev) => {
      const next = { ...prev };
      if (next[med.id] !== undefined) {
        delete next[med.id];
      } else {
        next[med.id] = '1 caixa';
      }
      return next;
    });
  };

  const updateRegisteredMedQty = (medId: string, qty: string) => {
    setCustomMessageOverride(null);
    setSelectedMeds((prev) => ({
      ...prev,
      [medId]: qty,
    }));
  };

  const handleAddCustomMed = () => {
    const trimmed = customMedName.trim();
    if (!trimmed) return;
    setCustomMessageOverride(null);
    setCustomMeds((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}`,
        name: trimmed,
        quantity: customMedQty.trim() || '1 unidade',
        fromRegistered: false,
      },
    ]);
    setCustomMedName('');
    setCustomMedQty('1 caixa');
  };

  const handleRemoveCustomMed = (key: string) => {
    setCustomMessageOverride(null);
    setCustomMeds((prev) => prev.filter((item) => item.key !== key));
  };

  const selectedPharmacy = useMemo(
    () => pharmacies.find((p) => p.id === selectedPharmacyId) || null,
    [pharmacies, selectedPharmacyId]
  );

  const orderItemsList = useMemo(() => {
    const list: OrderLine[] = [];
    for (const med of registeredMeds) {
      if (selectedMeds[med.id] !== undefined) {
        list.push({
          key: med.id,
          name: med.name,
          quantity: selectedMeds[med.id] || '1 caixa',
          fromRegistered: true,
        });
      }
    }
    return [...list, ...customMeds];
  }, [registeredMeds, selectedMeds, customMeds]);

  const generatedMessage = useMemo(() => {
    const pharmGreeting = selectedPharmacy
      ? `Olá, equipe da ${selectedPharmacy.name}!`
      : 'Olá!';

    const lines: string[] = [
      `${pharmGreeting} Gostaria de fazer um pedido / orçamento de medicamentos:`,
      '',
    ];

    if (orderItemsList.length > 0) {
      lines.push('*Medicamentos solicitados:*');
      orderItemsList.forEach((item) => {
        lines.push(`- ${item.name} (${item.quantity})`);
      });
    } else {
      lines.push('*Medicamentos solicitados:*');
      lines.push('- [Selecione ou informe os medicamentos acima]');
    }

    lines.push('');
    lines.push('*Dados do pedido:*');

    if (profile.fullName.trim()) {
      lines.push(`- Solicitante: ${profile.fullName.trim()}`);
    }

    if (deliveryMode === 'delivery') {
      lines.push(
        `- Recebimento: Entrega${
          deliveryAddress.trim() ? ` no endereço: ${deliveryAddress.trim()}` : ' no meu endereço'
        }`
      );
    } else {
      lines.push('- Recebimento: Retirada na farmácia');
    }

    lines.push(`- Forma de pagamento: ${paymentMethod}`);

    if (
      includeAllergies &&
      (profile.forbiddenMedications.length > 0 || profile.otherAllergies.trim())
    ) {
      const restricted = profile.forbiddenMedications
        .map((f) => f.name)
        .join(', ');
      const allergyParts = [restricted, profile.otherAllergies.trim()]
        .filter(Boolean)
        .join('; ');
      if (allergyParts) {
        lines.push(`- Alergias / NÃO posso tomar: ${allergyParts}`);
      }
    }

    if (extraObs.trim()) {
      lines.push(`- Observação: ${extraObs.trim()}`);
    }

    lines.push('');
    lines.push('Poderiam confirmar a disponibilidade e o valor total, por favor?');

    return lines.join('\n');
  }, [
    selectedPharmacy,
    orderItemsList,
    profile.fullName,
    profile.forbiddenMedications,
    profile.otherAllergies,
    deliveryMode,
    deliveryAddress,
    paymentMethod,
    includeAllergies,
    extraObs,
  ]);

  const finalMessage =
    customMessageOverride !== null ? customMessageOverride : generatedMessage;

  const whatsappUrl = useMemo(() => {
    if (!selectedPharmacy?.whatsapp) return null;
    const digits = formatWhatsAppDigits(selectedPharmacy.whatsapp);
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(finalMessage)}`;
  }, [selectedPharmacy, finalMessage]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(finalMessage);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = finalMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Section 1: Registered Pharmacies */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Farmácias Cadastradas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Salve suas farmácias de confiança com WhatsApp e endereço para enviar pedidos rapidamente.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Farmácia
          </button>
        </div>

        {pharmacies.length === 0 ? (
          <div className="p-10 text-center">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Nenhuma farmácia cadastrada
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Cadastre uma farmácia com o número de WhatsApp para enviar pedidos de medicamentos com mensagem pronta.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Farmácia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-slate-200">
            {pharmacies.map((pharmacy) => {
              const isSelected = pharmacy.id === selectedPharmacyId;
              return (
                <div
                  key={pharmacy.id}
                  className={`p-5 bg-white flex flex-col justify-between gap-4 ${
                    isSelected ? 'ring-1 ring-inset ring-teal-600 bg-teal-50/20' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {pharmacy.name}
                        </h3>
                        <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span>
                            {pharmacy.delivers ? 'Faz entrega' : 'Somente retirada'}
                          </span>
                          {pharmacy.openingHours && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {pharmacy.openingHours}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(pharmacy)}
                          aria-label={`Editar ${pharmacy.name}`}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePharmacy(pharmacy.id)}
                          aria-label={`Excluir ${pharmacy.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      {pharmacy.whatsapp && (
                        <p className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Phone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>WhatsApp: {pharmacy.whatsapp}</span>
                        </p>
                      )}
                      {pharmacy.address && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{pharmacy.address}</span>
                        </p>
                      )}
                      {pharmacy.notes && (
                        <p className="text-slate-500 pt-1">{pharmacy.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPharmacyId(pharmacy.id);
                        setCustomMessageOverride(null);
                      }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected
                        ? 'Selecionada para pedido'
                        : 'Fazer pedido nesta farmácia'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Ready-to-Send Order Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Select Medications & Order Details */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Montar Pedido de Medicamentos
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Marque os remédios cadastrados ou digite outros nomes para gerar a mensagem automática.
            </p>
          </div>

          {/* Choose target pharmacy */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Farmácia de destino
            </label>
            <select
              value={selectedPharmacyId}
              onChange={(e) => {
                setSelectedPharmacyId(e.target.value);
                setCustomMessageOverride(null);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              {pharmacies.length === 0 ? (
                <option value="">Cadastre uma farmácia acima</option>
              ) : (
                pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.whatsapp ? `(${p.whatsapp})` : '(Sem WhatsApp)'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Registered Medications Selection */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">
              Seus remédios cadastrados ({registeredMeds.length})
            </p>

            {registeredMeds.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Nenhum medicamento cadastrado em Horários & Remédios. Você pode digitar o nome manualmente abaixo.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {registeredMeds.map((med) => {
                  const isChecked = selectedMeds[med.id] !== undefined;
                  return (
                    <div
                      key={med.id}
                      className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRegisteredMed(med)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                        />
                        <span className="min-w-0">
                          <span className="font-medium block truncate">
                            {med.name}
                          </span>
                          {med.dosageOrDetails && (
                            <span className="text-xs text-slate-500 block truncate">
                              {med.dosageOrDetails}
                            </span>
                          )}
                        </span>
                      </label>

                      {isChecked && (
                        <input
                          type="text"
                          value={selectedMeds[med.id]}
                          onChange={(e) =>
                            updateRegisteredMedQty(med.id, e.target.value)
                          }
                          placeholder="Qtd (ex.: 1 caixa)"
                          className="w-full sm:w-32 px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-teal-600"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Custom Medication Name */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">
              Ou adicionar outro remédio / item pelo nome
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={customMedName}
                onChange={(e) => setCustomMedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomMed();
                  }
                }}
                placeholder="Nome do remédio ou item (ex.: Soro fisiológico)"
                className="sm:col-span-7 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
              <input
                type="text"
                value={customMedQty}
                onChange={(e) => setCustomMedQty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomMed();
                  }
                }}
                placeholder="Quantidade"
                className="sm:col-span-3 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
              <button
                type="button"
                onClick={handleAddCustomMed}
                disabled={!customMedName.trim()}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Incluir
              </button>
            </div>

            {customMeds.length > 0 && (
              <ul className="mt-2.5 divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {customMeds.map((item) => (
                  <li
                    key={item.key}
                    className="px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-800">
                      <strong>{item.name}</strong> · {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomMed(item.key)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label={`Remover ${item.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Delivery & Payment Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Como deseja receber
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => {
                  setDeliveryMode(e.target.value as 'delivery' | 'pickup');
                  setCustomMessageOverride(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              >
                <option value="delivery">Entrega no endereço</option>
                <option value="pickup">Retirar na farmácia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pagamento preferido
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setCustomMessageOverride(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão na entrega">Cartão na entrega</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="A combinar">A combinar</option>
              </select>
            </div>
          </div>

          {deliveryMode === 'delivery' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Endereço para entrega
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  setCustomMessageOverride(null);
                }}
                placeholder="Rua, número, complemento e bairro"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observação adicional (opcional)
            </label>
            <input
              type="text"
              value={extraObs}
              onChange={(e) => {
                setExtraObs(e.target.value);
                setCustomMessageOverride(null);
              }}
              placeholder="Ex.: Tenho receita e envio a foto em seguida, preferência por genérico..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAllergies}
              onChange={(e) => {
                setIncludeAllergies(e.target.checked);
                setCustomMessageOverride(null);
              }}
              className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            Incluir alerta de alergias / remédios proibidos (cadastrados em Meus Dados)
          </label>
        </div>

        {/* Right: Pre-programmed Message Preview & Send */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Mensagem Pronta do Pedido
              </h3>
              <p className="text-xs text-slate-500">
                Você pode revisar ou editar o texto antes de enviar.
              </p>
            </div>
            {customMessageOverride !== null && (
              <button
                type="button"
                onClick={() => setCustomMessageOverride(null)}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer shrink-0"
              >
                Restaurar texto
              </button>
            )}
          </div>

          <textarea
            rows={14}
            value={finalMessage}
            onChange={(e) => setCustomMessageOverride(e.target.value)}
            className="w-full px-3.5 py-3 text-xs sm:text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />

          <div className="space-y-2.5 pt-1">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar pedido para {selectedPharmacy?.name}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Cadastre o WhatsApp da farmácia para enviar direto
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              {copiedMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Mensagem copiada!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar mensagem pronta
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Pharmacy Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pharmacy-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="modal-pharmacy-title"
                className="text-base font-semibold text-slate-900"
              >
                {editingPharmacy ? 'Editar Farmácia' : 'Cadastrar Nova Farmácia'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingPharmacy(null);
                  onCloseModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePharmacySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome da farmácia
                </label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Ex.: Farmácia São João — Centro"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp para pedidos (com DDD)
                  </label>
                  <input
                    type="tel"
                    required
                    value={pWhatsapp}
                    onChange={(e) => setPWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Telefone fixo (opcional)
                  </label>
                  <input
                    type="tel"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="(11) 3333-3333"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço / Bairro
                </label>
                <input
                  type="text"
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  placeholder="Ex.: Av. Central, 300 — Centro"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Horário de funcionamento
                  </label>
                  <input
                    type="text"
                    value={pHours}
                    onChange={(e) => setPHours(e.target.value)}
                    placeholder="Ex.: 08:00 às 22:00 ou 24h"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pDelivers}
                    onChange={(e) => setPDelivers(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  Faz entrega em domicílio
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações (convênio, entrega, etc.)
                </label>
                <input
                  type="text"
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  placeholder="Ex.: Aceita Farmácia Popular, envia link de pagamento"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPharmacy(null);
                    onCloseModal();
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  {editingPharmacy ? 'Salvar Alterações' : 'Salvar Farmácia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
