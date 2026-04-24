import React, { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import { fetchClientProfile } from "../../services/clientService";

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchClientProfile().then(setProfile);
  }, []);

  return (
    <ClientLayout>
      <h2 className="text-2xl font-bold mb-4">Client Profile</h2>

      {!profile ? (
        <p className="text-sm text-slate-300">Loading profile...</p>
      ) : (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-2">
          <p><span className="text-slate-300">Name:</span> {profile.name}</p>
          <p><span className="text-slate-300">Email:</span> {profile.email}</p>
          <p><span className="text-slate-300">Company:</span> {profile.company}</p>
          <p><span className="text-slate-300">Timezone:</span> {profile.timezone}</p>
        </div>
      )}
    </ClientLayout>
  );
}
