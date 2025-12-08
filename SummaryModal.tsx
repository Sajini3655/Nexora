import React from "react";
import { Button } from "@mui/material";

function SummaryModal({ data, onClose }: any) {
  const { summary, blockers, ticket_prompt_needed, ticket_message } = data;

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>Chat Summary</h2>
        <p>{summary}</p>

        {blockers?.length > 0 && (
          <>
            <h3>Detected Blockers</h3>
            <ul>
              {blockers.map((b: any, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </>
        )}

        <p style={{ marginTop: 12 }}>{ticket_message}</p>

        <div className="modal-buttons">
          <Button variant="contained" onClick={() => onClose()}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
