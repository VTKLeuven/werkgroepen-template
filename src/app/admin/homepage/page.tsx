import { AdminShell } from "@/components/admin-shell";
import { SettingsEditor } from "@/components/settings-editor";
import { getSettingsEditorData } from "@/lib/settings-editor-data";

export const dynamic = "force-dynamic";

export default async function HomepageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const editorData = await getSettingsEditorData(searchParams);

  return (
    <AdminShell
      title="Homepage"
      description="Edit the hero, About and contact content, then arrange the homepage sections."
    >
      <SettingsEditor
        {...editorData}
        view="homepage"
        returnTo="/admin/homepage"
      />
    </AdminShell>
  );
}
