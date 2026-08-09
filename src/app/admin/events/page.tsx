import { CalendarPlus } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
} from "@/components/admin-shell";
import {
  LocalizedAdminField,
  getAdminContentLocale,
  getAdminLanguageConfig,
  getAdminLocalizedValue,
  type AdminLanguageConfig,
} from "@/components/admin-localized-field";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteEvent, saveEvent } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { formatEventDate, mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireAdmin();
  const [events, siteSettings] = await Promise.all([
    prisma.event.findMany({
      include: { pictureMedia: true },
      orderBy: { startAt: "desc" },
    }),
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
  ]);
  const languageConfig = getAdminLanguageConfig(siteSettings);
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => event.startAt >= now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const pastEvents = events.filter((event) => event.startAt < now);

  return (
    <AdminShell title="Events">
      <div className="grid gap-6">
        <Panel title="Add event">
          <details className="rounded-2xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Add a new event
            </summary>
            <div className="mt-4">
              <EventForm languageConfig={languageConfig} />
            </div>
          </details>
        </Panel>

        <EventList
          title="Upcoming events"
          events={upcomingEvents}
          languageConfig={languageConfig}
        />
        <EventList
          title="Past events"
          events={pastEvents}
          languageConfig={languageConfig}
        />
      </div>
    </AdminShell>
  );
}

function EventList({
  title,
  events,
  languageConfig,
}: {
  title: string;
  events: Awaited<ReturnType<typeof prisma.event.findMany>>;
  languageConfig: AdminLanguageConfig;
}) {
  const dateLocale =
    getAdminContentLocale(languageConfig) === "nl" ? "nl-BE" : "en-GB";

  return (
    <Panel title={title}>
      <div className="grid gap-3">
        {events.length === 0 ? (
          <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
            No events in this section.
          </p>
        ) : null}
        {events.map((event) => {
          const eventTitle = getAdminLocalizedValue(
            languageConfig,
            event.titleEn,
            event.titleNl,
            event.title,
          );
          const eventLocation = getAdminLocalizedValue(
            languageConfig,
            event.locationEn,
            event.locationNl,
            event.location,
          );

          return (
            <details
              key={event.id}
              className="rounded-3xl border border-black/10 bg-white p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-24 place-items-center overflow-hidden rounded-2xl bg-[#f5f1e8] text-center text-xs font-semibold">
                    {event.pictureMediaId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(event.pictureMediaId) ?? ""}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      eventTitle
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{eventTitle}</h3>
                    <p className="text-sm text-[#6f6860]">
                      {formatEventDate(event.startAt, event.endAt, dateLocale)}
                    </p>
                    <p className="truncate text-xs text-[#9b948a]">
                      {eventLocation}
                      {event.isPublished ? "" : " - Draft"}
                    </p>
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <EventForm event={event} languageConfig={languageConfig} />
                <form action={deleteEvent} className="mt-3">
                  <input type="hidden" name="id" value={event.id} />
                  <ConfirmDeleteButton itemName={`event “${eventTitle}”`} />
                </form>
              </div>
            </details>
          );
        })}
      </div>
    </Panel>
  );
}

function EventForm({
  event,
  languageConfig,
}: {
  event?: {
    id: string;
    title: string;
    titleEn: string;
    titleNl: string;
    slug: string;
    summary: string | null;
    summaryEn: string | null;
    summaryNl: string | null;
    description: string;
    descriptionEn: string;
    descriptionNl: string;
    location: string;
    locationEn: string;
    locationNl: string;
    startAt: Date;
    endAt: Date | null;
    isPublished: boolean;
  };
  languageConfig: AdminLanguageConfig;
}) {
  return (
    <form action={saveEvent} className="grid gap-4" encType="multipart/form-data">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <LocalizedAdminField
          label="Title"
          name="title"
          enValue={event?.titleEn}
          nlValue={event?.titleNl}
          fallbackValue={event?.title}
          required
          className={
            languageConfig.languageMode === "bilingual" ? "lg:col-span-2" : ""
          }
          {...languageConfig}
        />
        <Field label="Start">
          <input
            name="startAt"
            type="datetime-local"
            required
            defaultValue={event ? toDatetimeLocal(event.startAt) : ""}
            className={inputClass}
          />
        </Field>
        <Field label="End">
          <input
            name="endAt"
            type="datetime-local"
            defaultValue={event?.endAt ? toDatetimeLocal(event.endAt) : ""}
            className={inputClass}
          />
        </Field>
        <Field label="Picture">
          <input name="picture" type="file" accept="image/*" className={inputClass} />
        </Field>
        <LocalizedAdminField
          label="Location"
          name="location"
          enValue={event?.locationEn}
          nlValue={event?.locationNl}
          fallbackValue={event?.location}
          required
          className={
            languageConfig.languageMode === "bilingual" ? "lg:col-span-2" : ""
          }
          {...languageConfig}
        />
      </div>
      <details className="rounded-2xl border border-black/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Advanced URL setting
        </summary>
        <div className="mt-4 max-w-xl">
          <Field label="Page address">
            <input
              name="slug"
              defaultValue={event?.slug ?? ""}
              className={inputClass}
              placeholder="Generated automatically when empty"
            />
          </Field>
          <p className="mt-2 text-xs leading-5 text-[#6f6860]">
            Most editors can leave this empty. Only change it when you need a
            specific URL.
          </p>
        </div>
      </details>
      <LocalizedAdminField
        label="Summary"
        name="summary"
        enValue={event?.summaryEn}
        nlValue={event?.summaryNl}
        fallbackValue={event?.summary}
        {...languageConfig}
      />
      <LocalizedAdminField
        label="Description"
        name="description"
        enValue={event?.descriptionEn}
        nlValue={event?.descriptionNl}
        fallbackValue={event?.description}
        required
        multiline
        {...languageConfig}
      />
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          name="isPublished"
          type="checkbox"
          defaultChecked={event?.isPublished ?? true}
          className="h-5 w-5"
        />
        Published
      </label>
      <button className={`${buttonClass} w-fit gap-2`}>
        <CalendarPlus size={16} />
        {event ? "Save event" : "Add event"}
      </button>
    </form>
  );
}

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
