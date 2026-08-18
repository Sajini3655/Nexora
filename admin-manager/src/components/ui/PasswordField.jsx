import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password input with a show/hide toggle.
 * Toggles the field between type="password" and type="text".
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? <label className="text-xs text-slate-400">{label}</label> : null}
      <div className="relative mt-1">
        <input
          type={visible ? "text" : "password"}
          className="input pr-10"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
