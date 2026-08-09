import { AdminShell } from "@/components/admin-shell";
import { SettingsEditor } from "@/components/settings-editor";
import { getSettingsEditorData } from "@/lib/settings-editor-data";

export const dynamic = "force-dynamic";

export default async function HeaderSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const editorData = await getSettingsEditorData(searchParams);

  return (
    <AdminShell
      title="Header navigation"
      description="Choose which homepage sections and custom pages appear in the header, and arrange their global order."
    >
      <SettingsEditor
        {...editorData}
        view="header"
        returnTo="/admin/header"
      />
    </AdminShell>
  );
}
