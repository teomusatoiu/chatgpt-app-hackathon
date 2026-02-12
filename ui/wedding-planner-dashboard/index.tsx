import { createRoot } from "react-dom/client";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useDisplayMode } from "../hooks/use-display-mode";
import { useMaxHeight } from "../hooks/use-max-height";
import { useWidgetProps } from "../hooks/use-widget-props";
import "./styles.css";

type RSVPStatus = "Pending" | "Yes" | "No" | "Maybe";

type EventDetails = {
  event_date: string;
  location: string;
  budget: number;
};

type Guest = {
  id: string;
  name: string;
  contact: string;
  rsvp_status: RSVPStatus;
};

type Task = {
  id: string;
  title: string;
  due_date: string;
  status: "Pending";
};

type ScheduleItem = {
  id: string;
  time: string;
  description: string;
};

type InvitationDraft = {
  theme: string;
  text: string;
};

type DashboardData = {
  eventDetails: EventDetails | null;
  guests: Guest[];
  tasks: Task[];
  pendingTasks: Task[];
  schedule: ScheduleItem[];
  latestInvitation: InvitationDraft | null;
};

type DashboardView = "event" | "guests" | "tasks" | "schedule" | "invitation";

type ToolOutput = {
  view?: DashboardView;
  guest_id?: string;
  invitation_text?: string;
  data?: Partial<DashboardData>;
};

const EMPTY_DATA: DashboardData = {
  eventDetails: null,
  guests: [],
  tasks: [],
  pendingTasks: [],
  schedule: [],
  latestInvitation: null,
};

function normalizeData(partial?: Partial<DashboardData>): DashboardData {
  if (!partial) {
    return EMPTY_DATA;
  }

  return {
    eventDetails: partial.eventDetails ?? null,
    guests: partial.guests ?? [],
    tasks: partial.tasks ?? [],
    pendingTasks: partial.pendingTasks ?? [],
    schedule: partial.schedule ?? [],
    latestInvitation: partial.latestInvitation ?? null,
  };
}

function App() {
  const displayMode = useDisplayMode();
  const maxHeight = useMaxHeight();
  const isFullscreen = displayMode === "fullscreen";
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const output = useWidgetProps<ToolOutput>({
    view: "event",
    data: EMPTY_DATA,
  });
  const data = normalizeData(output.data);
  const activeView = output.view ?? "event";

  const containerStyle: CSSProperties | undefined = maxHeight
    ? {
        maxHeight,
        height: isFullscreen ? maxHeight : undefined,
      }
    : undefined;

  async function requestDisplayMode(mode: "fullscreen" | "inline") {
    setFullscreenError(null);
    try {
      if (window?.openai?.requestDisplayMode) {
        await window.openai.requestDisplayMode({ mode });
        return;
      }

      if (window?.webplus?.requestDisplayMode) {
        await window.webplus.requestDisplayMode({ mode });
        return;
      }

      throw new Error("Display mode API is not available in this host.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to switch display mode.";
      setFullscreenError(message);
    }
  }

  const eventCard = (
    <section className={`card ${activeView === "event" ? "is-active" : ""}`}>
      <h2>Event details</h2>
      {data.eventDetails ? (
        <ul>
          <li>Date: {data.eventDetails.event_date}</li>
          <li>Location: {data.eventDetails.location}</li>
          <li>Budget: ${data.eventDetails.budget}</li>
        </ul>
      ) : (
        <p className="muted">No event details yet.</p>
      )}
    </section>
  );

  const guestsCard = (
    <section className={`card ${activeView === "guests" ? "is-active" : ""}`}>
      <h2>Guests ({data.guests.length})</h2>
      {data.guests.length > 0 ? (
        <ul>
          {data.guests.map((guest) => (
            <li key={guest.id}>
              <span>{guest.name}</span>
              <span>{guest.contact}</span>
              <strong>{guest.rsvp_status}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No guests added.</p>
      )}
    </section>
  );

  const tasksCard = (
    <section className={`card ${activeView === "tasks" ? "is-active" : ""}`}>
      <h2>Pending tasks ({data.pendingTasks.length})</h2>
      {data.pendingTasks.length > 0 ? (
        <ul>
          {data.pendingTasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <span>{task.due_date}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No pending tasks.</p>
      )}
    </section>
  );

  const scheduleCard = (
    <section className={`card ${activeView === "schedule" ? "is-active" : ""}`}>
      <h2>Schedule ({data.schedule.length})</h2>
      {data.schedule.length > 0 ? (
        <ul>
          {data.schedule.map((item) => (
            <li key={item.id}>
              <span>{item.time}</span>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No schedule items yet.</p>
      )}
    </section>
  );

  const invitationCard = (
    <section
      className={`card ${activeView === "invitation" ? "is-active" : ""}`}
    >
      <h2>Invitation text</h2>
      {data.latestInvitation ? (
        <div className="invitation">
          <p className="theme">Theme: {data.latestInvitation.theme}</p>
          <p>{data.latestInvitation.text}</p>
        </div>
      ) : (
        <p className="muted">No invitation text generated yet.</p>
      )}
    </section>
  );

  return (
    <div
      className={`wedding-dashboard ${isFullscreen ? "is-fullscreen" : ""}`}
      style={containerStyle}
    >
      <div className="rose-garland rose-garland-top" aria-hidden="true">
        <span className="rose bloom-lg" />
        <span className="rose bloom-sm" />
        <span className="rose bloom-md" />
      </div>

      <header className="wedding-header">
        <div>
          <p className="eyebrow">Wedding Planner MVP</p>
          <h1>Planning dashboard</h1>
          <p className="subtitle">A romantic overview for your special day</p>
        </div>
        <div className="header-actions">
          <div className="active-view">Active view: {activeView}</div>
          {isFullscreen ? (
            <button
              type="button"
              className="mode-button"
              aria-label="Exit fullscreen"
              onClick={() => requestDisplayMode("inline")}
            >
              Exit fullscreen
            </button>
          ) : (
            <button
              type="button"
              className="mode-button"
              aria-label="Enter fullscreen"
              onClick={() => requestDisplayMode("fullscreen")}
            >
              Enter fullscreen
            </button>
          )}
        </div>
      </header>

      {fullscreenError && (
        <p className="fullscreen-error" role="status" aria-live="polite">
          {fullscreenError}
        </p>
      )}

      {isFullscreen ? (
        <div className="dashboard-grid is-fullscreen">
          <div className="dashboard-column left-column">
            {eventCard}
            {guestsCard}
          </div>
          <div className="dashboard-column right-column">
            {tasksCard}
            {scheduleCard}
            {invitationCard}
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {eventCard}
          {guestsCard}
          {tasksCard}
          {scheduleCard}
          {invitationCard}
        </div>
      )}

      <div className="rose-garland rose-garland-bottom" aria-hidden="true">
        <span className="rose bloom-md" />
        <span className="rose bloom-sm" />
        <span className="rose bloom-lg" />
      </div>
    </div>
  );
}

const root = document.getElementById("wedding-planner-dashboard-root");
if (root) {
  createRoot(root).render(<App />);
}
