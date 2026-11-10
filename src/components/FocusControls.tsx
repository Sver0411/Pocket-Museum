import { Key } from "./HardwareKey";
import type { InputController } from "../input/InputController";
import type { Button } from "../emulator/protocol";
import type { DeviceDefinition } from "../devices";
/** The same input arbiter as the physical shell: pointers, keyboard and gamepad may coexist. */
export function FocusControls({
  device,
  input,
  pressed,
  enabled,
  onHome,
}: {
  device: DeviceDefinition;
  input: InputController;
  pressed: Set<Button>;
  enabled: boolean;
  onHome: () => void;
}) {
  const key = (button: Button, label?: string) => (
    <Key
      key={button}
      button={button}
      input={input}
      pressed={pressed}
      className={`focus-key focus-key-${button.toLowerCase()}`}
    >
      {label || device.faceLabels?.[button] || button}
    </Key>
  );
  const extra = device.keys.some((k) => k.button === "X");
  return (
    <div
      className="focus-controls"
      aria-label="专注模式触控按键"
      inert={!enabled}
    >
      <div className="focus-dpad">
        {key("Up", "↑")}
        {key("Left", "←")}
        {key("Down", "↓")}
        {key("Right", "→")}
      </div>
      <div className="focus-secondary">
        {device.keys.some((k) => k.button === "L") && (
          <div>
            {key("L")}
            {key("R")}
          </div>
        )}
        <div>
          {key("Select", "SELECT")}
          {key("Start", "START")}
        </div>
        {["3ds", "psp", "vita"].includes(device.id) && (
          <button className="focus-home" onClick={onHome}>
            HOME
          </button>
        )}
      </div>
      <div className={`focus-face ${extra ? "four-buttons" : "two-buttons"}`}>
        {extra && key("X")}
        {extra && key("Y")}
        {key("B")}
        {key("A")}
      </div>
    </div>
  );
}
