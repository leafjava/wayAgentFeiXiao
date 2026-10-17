import { redirect } from "next/navigation";

export default function LegacyProjectRoute({ params }: { params: { projectId: string } }) {
  redirect(`/${params.projectId}`);
}
