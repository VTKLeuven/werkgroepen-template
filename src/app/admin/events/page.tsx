import { CalendarPlus, Trash2 } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
  textareaClass,
} from "@/components/admin-shell";
import { deleteEvent, saveEvent } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { formatEventDate, mediaUrl } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({
    include: { pictureMedia: true },
    orderBy: { startAt: "desc" },
  });
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
              <EventForm />
            </div>
          </details>
        </Panel>

        <EventList title="Upcoming events" events={upcomingEvents} />
        <EventList title="Past events" events={pastEvents} />
      </div>
    </AdminShell>
  );
}

function EventList({
  title,
  events,
}: {
  title: string;
  events: Awaited<ReturnType<typeof prisma.event.findMany>>;
}) {
  return (
    <Panel title={title}>
      <div className="grid gap-3">
        {events.length === 0 ? (
          <p className="rounded-2xl bg-[#f5f1e8] p-4 text-sm text-[#6f6860]">
            No events in this section.
          </p>
        ) : null}
        {events.map((event) => (
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
                    event.titleEn || event.title
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">
                    {event.titleEn || event.title}
                  </h3>
                  <p className="text-sm text-[#6f6860]">
                    {formatEventDate(event.startAt, event.endAt)}
                  </p>
                  <p className="truncate text-xs text-[#9b948a]">
                    {event.locationEn || event.location}
                    {event.isPublished ? "" : " - Draft"}
                  </p>
                </div>
              </div>
            </summary>
            <div className="mt-5">
              <EventForm event={event} />
              <form action={deleteEvent} className="mt-3">
                <input type="hidden" name="id" value={event.id} />
                <button className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  <Trash2 size={15} />
                  Delete
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </Panel>
  );
}

function EventForm({
  event,
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
}) {
  return (
    <form action={saveEvent} className="grid gap-4" encType="multipart/form-data">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title EN">
          <input
            name="titleEn"
            required
            defaultValue={event?.titleEn ?? event?.title}
            className={inputClass}
          />
        </Field>
        <Field label="Title NL">
          <input
            name="titleNl"
            required
            defaultValue={event?.titleNl ?? event?.title}
            className={inputClass}
          />
        </Field>
        <Field label="Slug">
          <input
            name="slug"
            defaultValue={event?.slug ?? ""}
            className={inputClass}
            placeholder="Generated from title when empty"
          />
        </Field>
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
        <Field label="Location EN">
          <input
            name="locationEn"
            required
            defaultValue={event?.locationEn ?? event?.location}
            className={inputClass}
          />
        </Field>
        <Field label="Location NL">
          <input
            name="locationNl"
            required
            defaultValue={event?.locationNl ?? event?.location}
            className={inputClass}
          />
        </Field>
        <Field label="Picture">
          <input name="picture" type="file" accept="image/*" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Summary EN">
          <input
            name="summaryEn"
            defaultValue={event?.summaryEn ?? event?.summary ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Summary NL">
          <input
            name="summaryNl"
            defaultValue={event?.summaryNl ?? event?.summary ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Description EN">
          <textarea
            name="descriptionEn"
            required
            defaultValue={event?.descriptionEn ?? event?.description}
            className={textareaClass}
          />
        </Field>
        <Field label="Description NL">
          <textarea
            name="descriptionNl"
            required
            defaultValue={event?.descriptionNl ?? event?.description}
            className={textareaClass}
          />
        </Field>
      </div>
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
