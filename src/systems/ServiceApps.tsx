import { useState } from "react";
import {
  BookOpen,
  Check,
  Gamepad2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Trophy,
  Users,
  WifiOff,
} from "lucide-react";
import { AppChrome } from "./NativeApps";
import type { AppProps } from "./NativeApps";
function saved<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function ServiceApp(props: AppProps) {
  const { s, dispatch } = props,
    [step, setStep] = useState(""),
    [draft, setDraft] = useState(s.prefs["message-draft"] || ""),
    [location, setLocation] = useState(""),
    [error, setError] = useState("");
  const name =
    (
      {
        shop: "eShop",
        store: "PlayStation Store",
        party: "Party",
        messages: "Messages",
        near: "near",
        trophies: "Trophies",
        remote: "PS3 Remote Play",
        notifications: "Notifications",
        health: "Health and Safety Information",
      } as Record<string, string>
    )[s.app] || s.app;
  const network = () =>
    dispatch({
      type: "dialog",
      text: "A network connection is required.\nCheck your Internet connection settings.",
    });
  const topIcon =
    s.app === "shop" || s.app === "store"
      ? ShoppingBag
      : s.app === "trophies"
        ? Trophy
        : s.app === "near"
          ? MapPin
          : s.app === "messages"
            ? Mail
            : Users;
  const Icon = topIcon;
  if (props.top)
    return (
      <div className={`service-top service-${s.app}`}>
        <Icon size={75} />
        <h2>{name}</h2>
      </div>
    );
  return (
    <AppChrome
      props={props}
      title={name}
      theme={`service-app service-${s.app}`}
    >
      {s.app === "shop" || s.app === "store" ? (
        <div className="store-offline">
          <ShoppingBag />
          <h3>{name}</h3>
          <WifiOff />
          <p>Unable to connect to the server.</p>
          <div className="app-actions">
            <button onClick={network}>Retry</button>
            <button onClick={() => dispatch({ type: "open", app: "settings" })}>
              Settings
            </button>
          </div>
        </div>
      ) : s.app === "health" ? (
        <div className="health-pages">
          <BookOpen />
          <h3>
            {
              [
                "Health and Safety",
                "Taking Breaks",
                "Using the 3D Screen",
                "Battery and Charging",
              ][Number(step) || 0]
            }
          </h3>
          <p>
            {
              [
                "Read the precautions supplied with your system before playing.",
                "Take regular breaks. Stop playing if you feel tired or uncomfortable.",
                "Use 3D effects only when comfortable. Adjust the depth slider to suit your eyes.",
                "Use the correct charger and keep the system dry.",
              ][Number(step) || 0]
            }
          </p>
          <div className="app-actions">
            <button
              disabled={!Number(step)}
              onClick={() => setStep(String(Number(step) - 1))}
            >
              Previous
            </button>
            <span>{(Number(step) || 0) + 1}/4</span>
            <button
              disabled={Number(step) === 3}
              onClick={() => setStep(String(Number(step || 0) + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : s.app === "notifications" ? (
        <div className="native-empty">
          <MessageCircle />
          <p>There are no notifications.</p>
        </div>
      ) : s.app === "trophies" ? (
        <div className="trophy-list">
          <h3>Welcome Park</h3>
          {[
            ["digits", "Digit Chase"],
            ["puzzle", "Snap + Slide"],
            ["skate", "Skate Axis"],
            ["sound", "Sound Loop"],
            ["face", "Hello Face"],
          ].map(([id, title]) => (
            <div key={id}>
              <Trophy className={s.prefs[`park:${id}`] ? "earned" : ""} />
              <span>{title}</span>
              <small>
                {s.prefs[`park:${id}`] ? "Earned on this system" : "Not earned"}
              </small>
            </div>
          ))}
          <button onClick={network}>Sync with Server</button>
        </div>
      ) : s.app === "near" ? (
        <div className="near-app">
          <div className="near-radar">
            <MapPin />
            <span>{location || "Location unknown"}</span>
          </div>
          <button
            onClick={() => {
              if (!navigator.geolocation) {
                setError("Location data is unavailable.");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (p) => {
                  setLocation(
                    `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`,
                  );
                  setError("");
                },
                (e) => setError(e.message),
              );
            }}
          >
            Update Location
          </button>
          <p>Players nearby　0</p>
        </div>
      ) : s.app === "messages" ? (
        <div className="messages-app">
          {step === "compose" ? (
            <>
              <input aria-label="Message recipient" placeholder="Online ID" />
              <textarea
                aria-label="Message text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  dispatch({
                    type: "set",
                    key: "message-draft",
                    value: e.target.value,
                  });
                }}
              />
              <div className="app-actions">
                <button onClick={() => setStep("")}>Save Draft</button>
                <button onClick={network}>Send</button>
              </div>
            </>
          ) : (
            <>
              <Mail size={54} />
              <p>There are no messages.</p>
              <button onClick={() => setStep("compose")}>Create Message</button>
              {draft && (
                <button onClick={() => setStep("compose")}>Draft</button>
              )}
            </>
          )}
        </div>
      ) : s.app === "party" ? (
        <div className="party-app">
          <Users size={65} />
          <div className="app-menu">
            <button onClick={() => setStep("create")}>Create Party</button>
            <button onClick={() => setStep("join")}>Join Party</button>
          </div>
          {step && (
            <>
              <p>
                {step === "create"
                  ? "Choose who can join the party."
                  : "There are no parties you can join."}
              </p>
              {step === "create" && (
                <>
                  <button onClick={network}>Friends of Friends</button>
                  <button onClick={network}>Invited Players Only</button>
                </>
              )}
            </>
          )}
        </div>
      ) : s.app === "remote" ? (
        <div className="remote-app">
          <Gamepad2 size={58} />
          <p>
            {step === "register"
              ? "Register this system with a PS3™ system. Select Remote Play Settings on the PS3™ system."
              : "Connect to a PS3™ system."}
          </p>
          <div className="app-menu">
            <button onClick={() => setStep("register")}>Register Device</button>
            <button onClick={network}>Connect via Private Network</button>
            <button onClick={network}>Connect via Internet</button>
          </div>
        </div>
      ) : s.app === "friends" ? (
        <div className="native-empty">
          <Users />
          <p>Sign in to view your friends.</p>
          <button onClick={network}>Sign In</button>
        </div>
      ) : (
        <div className="native-empty">
          <Globe />
          <p>The WLAN switch is turned off.</p>
          <button onClick={network}>Connect</button>
        </div>
      )}
      {error && (
        <p role="alert" className="app-error">
          {error}
        </p>
      )}
    </AppChrome>
  );
}
