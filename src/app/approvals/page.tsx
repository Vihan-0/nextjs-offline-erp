import { getEditRequests } from "@/actions/editRequestActions";
import { ApprovalsClient } from "./approvals-client";

export const metadata = {
  title: "Director — Edit Request Approvals | TownHall ERP",
  description: "Review, approve, or reject staff-submitted student profile edit requests with side-by-side diff comparison.",
};

export default async function ApprovalsPage() {
  const pendingRequests = await getEditRequests("PENDING");

  return <ApprovalsClient requests={pendingRequests} />;
}
