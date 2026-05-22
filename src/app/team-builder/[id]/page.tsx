import { redirect } from "next/navigation";

// Redirect dynamic subpage requests back to the main team builder dashboard
export default function TeamRedirectPage() {
  redirect("/team-builder");
}