import React from "react";
import DevLayout from "../../components/layout/DevLayout"; // your sidebar/layout
import ChatBox from "./src/ChatBox"; // main chat component

export default function DevChat() {
  return (
    <DevLayout>
      <ChatBox />
    </DevLayout>
  );
}