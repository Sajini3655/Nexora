import {
  clientProfile,
  clientProjects,
  clientSummary,
  clientTickets,
} from "../data/clientMock";

// These mocks keep client dashboards functional until dedicated backend APIs are wired.
export async function fetchClientSummary() {
  return Promise.resolve(clientSummary);
}

export async function fetchClientProjects() {
  return Promise.resolve(clientProjects);
}

export async function fetchClientTickets() {
  return Promise.resolve(clientTickets);
}

export async function fetchClientProfile() {
  return Promise.resolve(clientProfile);
}
