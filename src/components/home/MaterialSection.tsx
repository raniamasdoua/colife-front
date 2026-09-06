import { useEffect, useState } from "react";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";

import {
  getActivityMaterials,
  proposeMaterial,
  removeMaterial,
  updateMaterial,
} from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type { MaterialResponse } from "../../types/activity";

const inputClass =
  "w-full py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "disabled:opacity-50 disabled:bg-gray-50";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

interface MaterialSectionProps {
  activityId: number;
  /** Désactive la proposition de matériel (ex: activité passée). */
  disabled?: boolean;
}

export function MaterialSection({ activityId, disabled = false }: MaterialSectionProps) {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getActivityMaterials(activityId)
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiRequestError ? e.message : "Impossible de charger le matériel.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  const handlePropose = async () => {
    setActionError(null);
    if (!description.trim()) {
      setActionError("La description est obligatoire.");
      return;
    }
    const qty = Number(quantity);
    if (!quantity || !Number.isFinite(qty) || qty < 1) {
      setActionError("La quantité doit être supérieure ou égale à 1.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await proposeMaterial(activityId, { description: description.trim(), quantity: qty });
      setMaterials((prev) => [...prev, created]);
      setDescription("");
      setQuantity("1");
      setShowForm(false);
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : "Impossible de proposer ce matériel.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (m: MaterialResponse) => {
    setActionError(null);
    setShowForm(false);
    setEditingId(m.id);
    setEditDescription(m.description);
    setEditQuantity(String(m.quantity));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setActionError(null);
  };

  const handleUpdate = async () => {
    if (editingId === null) return;
    setActionError(null);
    if (!editDescription.trim()) {
      setActionError("La description est obligatoire.");
      return;
    }
    const qty = Number(editQuantity);
    if (!editQuantity || !Number.isFinite(qty) || qty < 1) {
      setActionError("La quantité doit être supérieure ou égale à 1.");
      return;
    }
    setEditSubmitting(true);
    try {
      const updated = await updateMaterial(activityId, editingId, {
        description: editDescription.trim(),
        quantity: qty,
      });
      setMaterials((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      setEditingId(null);
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : "Impossible de modifier cette proposition.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleRemove = async (materialId: number) => {
    setActionError(null);
    setRemovingId(materialId);
    try {
      await removeMaterial(activityId, materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : "Impossible de retirer cette proposition.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Package className="h-4 w-4 text-violet-500" />
          Matériel
        </div>
        {!disabled && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Proposer
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement…
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-2">{actionError}</p>
      )}

      {!loading && !error && (
        <>
          {materials.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun matériel proposé pour le moment.</p>
          ) : (
            <ul className="space-y-1.5">
              {materials.map((m) =>
                editingId === m.id ? (
                  <li key={m.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                    <div>
                      <label htmlFor={`material-edit-description-${m.id}`} className={labelClass}>
                        Objet à apporter *
                      </label>
                      <input
                        id={`material-edit-description-${m.id}`}
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        disabled={editSubmitting}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`material-edit-quantity-${m.id}`} className={labelClass}>
                        Quantité
                      </label>
                      <input
                        id={`material-edit-quantity-${m.id}`}
                        type="number"
                        min={1}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        disabled={editSubmitting}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={editSubmitting}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdate}
                        disabled={editSubmitting}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
                      >
                        {editSubmitting ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Envoi…
                          </span>
                        ) : (
                          "Enregistrer"
                        )}
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">
                        {m.description} {m.quantity > 1 && `(x${m.quantity})`}
                      </p>
                      <p className="text-xs text-gray-400">Proposé par {m.proposedByName}</p>
                    </div>
                    {m.mine && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          aria-label="Modifier ma proposition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(m.id)}
                          disabled={removingId === m.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                          aria-label="Retirer ma proposition"
                        >
                          {removingId === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </li>
                )
              )}
            </ul>
          )}

          {showForm && (
            <div className="mt-3 rounded-xl border border-gray-200 p-3 space-y-2">
              <div>
                <label htmlFor="material-description" className={labelClass}>
                  Objet à apporter *
                </label>
                <input
                  id="material-description"
                  type="text"
                  placeholder="Ex: Ballon de foot"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="material-quantity" className={labelClass}>
                  Quantité
                </label>
                <input
                  id="material-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setActionError(null);
                  }}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handlePropose}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Envoi…
                    </span>
                  ) : (
                    "Proposer"
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
