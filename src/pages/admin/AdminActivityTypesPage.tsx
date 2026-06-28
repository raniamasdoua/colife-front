import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";

import { AdminLayout } from "../../components/admin/AdminLayout";
import { ActivityTypeFormModal } from "../../components/admin/ActivityTypeFormModal";
import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "../../components/admin/adminTheme";
import { MessageModal } from "../../components/ui/MessageModal";
import { ApiRequestError } from "../../services/api";
import {
  createActivityType,
  deleteActivityType,
  listActivityTypes,
  updateActivityType,
} from "../../services/activityTypeService";
import type { ActivityTypeOption } from "../../types/activity";

export function AdminActivityTypesPage() {
  const [types, setTypes] = useState<ActivityTypeOption[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityTypeOption | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ActivityTypeOption | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant?: "default" | "success";
  }>({ open: false, title: "", message: "" });

  const loadTypes = useCallback(async () => {
    setListError("");
    setLoadingList(true);
    try {
      const list = await listActivityTypes();
      setTypes(list.sort((a, b) => a.name.localeCompare(b.name, "fr")));
    } catch (e) {
      setListError(
        e instanceof ApiRequestError ? e.message : "Impossible de charger les types d'activités."
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: ActivityTypeOption) => {
    setEditing(t);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (formLoading) return;
    setFormOpen(false);
    setEditing(null);
  };

  const handleFormSubmit = async (values: { name: string }) => {
    setFormLoading(true);
    try {
      if (editing) {
        await updateActivityType(editing.id, values);
        setMessageModal({
          open: true,
          title: "Type modifié",
          message: "Le type d'activité a été mis à jour.",
          variant: "success",
        });
      } else {
        await createActivityType(values);
        setMessageModal({
          open: true,
          title: "Type créé",
          message: "Le nouveau type d'activité a été ajouté.",
          variant: "success",
        });
      }
      setFormOpen(false);
      setEditing(null);
      await loadTypes();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : "Une erreur est survenue lors de l'enregistrement.";
      setMessageModal({ open: true, title: "Enregistrement impossible", message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteActivityType(deleteTarget.id);
      setDeleteTarget(null);
      setMessageModal({
        open: true,
        title: "Type supprimé",
        message: "Le type d'activité a été supprimé.",
        variant: "success",
      });
      await loadTypes();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de supprimer ce type d'activité.";
      setMessageModal({ open: true, title: "Suppression impossible", message: msg });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Types d'activités"
      subtitle="Créez et gérez les catégories proposées aux collaborateurs"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={COLIFE_SECTION_LABEL}>Référentiel</h2>
            <p className="text-sm text-slate-500 mt-1">
              {types.length} type{types.length !== 1 ? "s" : ""} enregistré
              {types.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            Nouveau type
          </button>
        </div>

        {listError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        <div className={COLIFE_CARD}>
          {loadingList ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              Chargement…
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-purple-300 mb-3 ring-1 ring-purple-100/80">
                <Tag className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-slate-600 font-medium">Aucun type d'activité</p>
              <p className="text-sm text-slate-400 mt-1">
                Ajoutez un premier type pour les activités de l'entreprise.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-purple-50/40">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Nom
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {types.map((t) => (
                      <tr key={t.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{t.name}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(t)}
                              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="md:hidden divide-y divide-slate-50">
                {types.map((t) => (
                  <li key={t.id} className="px-4 py-4 flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-800 text-sm">{t.name}</span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                        aria-label="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(t)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <ActivityTypeFormModal
        open={formOpen}
        title={editing ? "Modifier le type" : "Nouveau type d'activité"}
        initialName={editing?.name ?? ""}
        submitLabel={editing ? "Enregistrer" : "Créer"}
        loading={formLoading}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => !deleteLoading && setDeleteTarget(null)}
          />
          <div className={`relative z-10 w-full max-w-sm ${COLIFE_CARD} p-5 shadow-2xl`}>
            <h2 className="text-lg font-bold text-slate-900">Supprimer ce type ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              « {deleteTarget.name} » sera définitivement retiré du référentiel.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageModal
        open={messageModal.open}
        title={messageModal.title}
        message={messageModal.message}
        variant={messageModal.variant}
        onClose={() => setMessageModal((m) => ({ ...m, open: false }))}
      />
    </AdminLayout>
  );
}
